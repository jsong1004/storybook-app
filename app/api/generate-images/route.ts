import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { storyId, storyContent, storyTitle } = await request.json()

    if (!storyId || !storyContent) {
      return NextResponse.json({ error: "Story ID and content are required" }, { status: 400 })
    }

    // Verify the story belongs to the user
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Generate image prompts from the story
    const imagePrompts = generateImagePrompts(storyContent, storyTitle)

    // Generate images using Leonardo AI
    const generatedImages = await Promise.all(
      imagePrompts.map(async (prompt, index) => {
        try {
          const imageUrl = await generateImageWithLeonardo(prompt)

          // Ensure imageUrl is absolute (fallbacks may be relative like "/whimsical-forest-tale.png")
          const absoluteUrl = imageUrl.startsWith("http")
            ? imageUrl
            : new URL(imageUrl, request.nextUrl.origin).toString()

          // Upload to Vercel Blob for permanent storage
          const response = await fetch(absoluteUrl)
          const imageBuffer = await response.arrayBuffer()

          const blob = await put(`story-images/${storyId}/${Date.now()}-${index}.png`, imageBuffer, {
            access: "public",
            contentType: "image/png",
          })

          // Save to database
          const { data: storyImage, error } = await supabase
            .from("story_images")
            .insert({
              story_id: storyId,
              image_url: blob.url,
              prompt: prompt,
              page_number: index + 1,
            })
            .select()
            .single()

          if (error) {
            console.error("Database error saving image:", error)
            return null
          }

          return storyImage
        } catch (error) {
          console.error(`Error generating image ${index + 1}:`, error)
          return null
        }
      }),
    )

    const successfulImages = generatedImages.filter(Boolean)

    return NextResponse.json({
      success: true,
      imagesGenerated: successfulImages.length,
      images: successfulImages,
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json({ error: "Failed to generate images" }, { status: 500 })
  }
}

function generateImagePrompts(storyContent: string, storyTitle: string): string[] {
  // Split story into pages using the new page break system
  const pages = storyContent.split('---PAGE BREAK---').filter(page => page.trim().length > 0)
  
  // If no page breaks found, fall back to sentence splitting
  const contentSections = pages.length > 1 ? pages : storyContent.split(/[.!?]+/).filter((s) => s.trim().length > 10)

  // Style palettes for variation
  const styles = [
    {
      label: "watercolor, soft brush, pastel palette, gentle gradients, soft lighting",
      composition: "wide establishing shot, cinematic composition, rule of thirds",
    },
    {
      label: "colored pencil, textured paper, warm tones, cozy atmosphere",
      composition: "medium shot with character focus, shallow depth of field",
    },
    {
      label: "gouache, bold shapes, vibrant saturated colors, playful",
      composition: "dynamic perspective, slight tilt, action-oriented scene",
    },
    {
      label: "ink and wash, clean linework, minimal shading, modern picture book",
      composition: "close-up portrait, strong silhouette, expressive pose",
    },
  ]

  // Content moderation - filter potentially flagged words for children's content
  const moderateContent = (text: string): string => {
    const flaggedWords = [
      'cutting', 'cut', 'knife', 'blade', 'sharp', 'weapon', 'sword', 'gun', 'fight', 'violence',
      'hurt', 'pain', 'blood', 'wound', 'injury', 'danger', 'scary', 'frightening', 'terror',
      'death', 'die', 'kill', 'murder', 'attack', 'strike', 'hit', 'punch', 'kick'
    ]
    
    let moderatedText = text.toLowerCase()
    
    flaggedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      moderatedText = moderatedText.replace(regex, (match) => {
        // Replace with child-friendly alternatives
        const replacements: { [key: string]: string } = {
          'cutting': 'preparing',
          'cut': 'shaped',
          'knife': 'tool',
          'blade': 'leaf',
          'sharp': 'pointed',
          'weapon': 'tool',
          'sword': 'magic wand',
          'gun': 'toy',
          'fight': 'play',
          'violence': 'adventure',
          'hurt': 'surprised',
          'pain': 'discomfort',
          'blood': 'red juice',
          'wound': 'scratch',
          'injury': 'bump',
          'danger': 'challenge',
          'scary': 'mysterious',
          'frightening': 'surprising',
          'terror': 'excitement',
          'death': 'sleep',
          'die': 'rest',
          'kill': 'stop',
          'murder': 'catch',
          'attack': 'approach',
          'strike': 'touch',
          'hit': 'tap',
          'punch': 'poke',
          'kick': 'step'
        }
        return replacements[match.toLowerCase()] || 'adventure'
      })
    })
    
    return moderatedText
  }

  const safeText = (t?: string) => {
    if (!t || t.trim().length === 0) return "A magical adventure scene"
    const moderated = moderateContent(t.trim())
    return moderated.length > 0 ? moderated : "A magical adventure scene"
  }

  const prompts: string[] = []
  
  // Character consistency elements - extract from story title and content
  const characterHints = extractCharacterHints(storyTitle, contentSections.join(' '))
  const settingHints = extractSettingHints(storyTitle, contentSections.join(' '))
  const baseStyle = "Children's book illustration, consistent character design, coherent art style"

  // Generate prompts for each page/section - match exactly with number of pages
  contentSections.forEach((section, index) => {
    const style = styles[index % styles.length]
    const consistencyPrompt = `${baseStyle}, ${style.label}. ${style.composition}.`
    
    // Page-specific scene description
    const pageContent = safeText(section.trim())
    
    // Add character and setting consistency
    const consistentPrompt = `${consistencyPrompt} Story: "${storyTitle}" - ${pageContent}. 
    ${characterHints} ${settingHints} 
    Maintain character appearance consistency, same art style throughout, 
    whimsical, family-friendly, high detail, clean edges, professional children's book quality.`
    
    prompts.push(consistentPrompt)
  })

  // Return all prompts - one for each page
  return prompts
}

// Helper function to extract character hints for consistency
function extractCharacterHints(storyTitle: string, content: string): string {
  const lowerContent = content.toLowerCase()
  const characterWords = []
  
  // Common character descriptors
  if (lowerContent.includes('little') || lowerContent.includes('small')) characterWords.push('small character')
  if (lowerContent.includes('big') || lowerContent.includes('large')) characterWords.push('large character')
  if (lowerContent.includes('child') || lowerContent.includes('kid')) characterWords.push('child character')
  if (lowerContent.includes('animal')) characterWords.push('animal character')
  if (lowerContent.includes('friend')) characterWords.push('friendly characters')
  if (lowerContent.includes('family')) characterWords.push('family characters')
  
  // Colors that might define characters
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange']
  colors.forEach(color => {
    if (lowerContent.includes(color)) characterWords.push(`${color} colored elements`)
  })
  
  return characterWords.length > 0 ? `Characters: ${characterWords.slice(0, 3).join(', ')}.` : ''
}

// Helper function to extract setting hints for consistency  
function extractSettingHints(storyTitle: string, content: string): string {
  const lowerContent = content.toLowerCase()
  const settingWords = []
  
  // Common settings
  if (lowerContent.includes('forest') || lowerContent.includes('wood')) settingWords.push('forest setting')
  if (lowerContent.includes('garden')) settingWords.push('garden setting')
  if (lowerContent.includes('home') || lowerContent.includes('house')) settingWords.push('home setting')
  if (lowerContent.includes('park')) settingWords.push('park setting')
  if (lowerContent.includes('school')) settingWords.push('school setting')
  if (lowerContent.includes('magical') || lowerContent.includes('enchanted')) settingWords.push('magical environment')
  if (lowerContent.includes('outdoor') || lowerContent.includes('outside')) settingWords.push('outdoor scene')
  if (lowerContent.includes('indoor') || lowerContent.includes('inside')) settingWords.push('indoor scene')
  
  // Weather/atmosphere
  if (lowerContent.includes('sunny')) settingWords.push('sunny atmosphere')
  if (lowerContent.includes('rainy')) settingWords.push('rainy atmosphere')
  if (lowerContent.includes('night')) settingWords.push('nighttime scene')
  if (lowerContent.includes('day')) settingWords.push('daytime scene')
  
  return settingWords.length > 0 ? `Setting: ${settingWords.slice(0, 3).join(', ')}.` : ''
}

async function generateImageWithLeonardo(prompt: string): Promise<string> {
  const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY

  if (!LEONARDO_API_KEY) {
    throw new Error("Leonardo AI API key not configured")
  }

  try {
    // Submit image generation request to Leonardo AI
    const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${LEONARDO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId: "b2614463-296c-462a-9586-aafdb8f00e36", // Flux Precision (Dev) model
        prompt: prompt,
        num_images: 1,
        contrast: 3.5, // Recommended value for Flux
        width: 1024,
        height: 1024,
        enhancePrompt: true, // Enhance prompts for better results
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Leonardo AI error:", response.status, errorData)
      
      // Handle content moderation errors specifically
      if (response.status === 403 && errorData.includes("Content moderated")) {
        console.log("Content moderation triggered, using generic children's book prompt")
        // Use a safe, generic prompt for children's illustrations
        return await generateImageWithGenericPrompt()
      }
      
      throw new Error(`Leonardo AI error: ${response.status}`)
    }

    const responseData = await response.json()

    if (!responseData.sdGenerationJob?.generationId) {
      console.error("Unexpected Leonardo AI response structure:", responseData)
      throw new Error("Invalid response from Leonardo AI")
    }

    // Poll for completion
    const imageUrl = await pollLeonardoGeneration(responseData.sdGenerationJob.generationId, LEONARDO_API_KEY)
    return imageUrl
  } catch (error) {
    console.error("Error calling Leonardo AI:", error)

    // Return a placeholder image URL if Leonardo AI fails
    return "/whimsical-forest-tale.png"
  }
}

async function pollLeonardoGeneration(generationId: string, apiKey: string): Promise<string> {
  const maxAttempts = 30 // 5 minutes max (10 second intervals)
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Leonardo AI status check error: ${response.status}`)
      }

      const responseData = await response.json()

      if (responseData.generations_by_pk?.status === "COMPLETE" && responseData.generations_by_pk?.generated_images?.[0]?.url) {
        return responseData.generations_by_pk.generated_images[0].url
      }

      if (responseData.generations_by_pk?.status === "FAILED") {
        throw new Error(`Leonardo AI generation failed: ${responseData.generations_by_pk?.status || "Unknown error"}`)
      }

      // Wait 10 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 10000))
      attempts++
    } catch (error) {
      console.error("Error polling Leonardo AI:", error)
      throw error
    }
  }

  throw new Error("Leonardo AI generation timeout")
}

async function generateImageWithGenericPrompt(): Promise<string> {
  const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY

  if (!LEONARDO_API_KEY) {
    throw new Error("Leonardo AI API key not configured")
  }

  // Safe, generic children's book illustration prompt
  const genericPrompt = "Children's book illustration, watercolor style, gentle colors, whimsical forest scene with friendly animals, magical atmosphere, soft lighting, family-friendly, cozy and warm feeling"

  try {
    const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${LEONARDO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId: "b2614463-296c-462a-9586-aafdb8f00e36", // Flux Precision (Dev) model
        prompt: genericPrompt,
        num_images: 1,
        contrast: 3.5, // Recommended value for Flux
        width: 1024,
        height: 1024,
        enhancePrompt: true, // Enhance prompts for better results
      }),
    })

    if (!response.ok) {
      console.error("Generic prompt also failed, using placeholder")
      return "/whimsical-forest-tale.png"
    }

    const responseData = await response.json()

    if (!responseData.sdGenerationJob?.generationId) {
      console.error("Invalid response for generic prompt, using placeholder")
      return "/whimsical-forest-tale.png"
    }

    // Poll for completion
    const imageUrl = await pollLeonardoGeneration(responseData.sdGenerationJob.generationId, LEONARDO_API_KEY)
    return imageUrl
  } catch (error) {
    console.error("Error with generic prompt:", error)
    return "/whimsical-forest-tale.png"
  }
}
