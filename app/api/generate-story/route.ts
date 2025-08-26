import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface StoryCustomizations {
  ageGroup?: 'toddlers (2-4)' | 'preschool (4-6)' | 'early readers (6-8)' | 'young readers (8-12)' | 'all ages'
  theme?: 'friendship' | 'adventure' | 'family' | 'nature' | 'magic' | 'learning' | 'kindness' | 'courage'
  length?: 'short' | 'medium' | 'long'
  tone?: 'playful' | 'gentle' | 'exciting' | 'educational'
}

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

    const { images, customizations } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    let storyContent: string
    let storyGenerationSuccessful = false

    if (OPENROUTER_API_KEY) {
      try {
        storyContent = await generateStoryFromImages(images, customizations)
        storyGenerationSuccessful = true
      } catch (error) {
        console.error("Story generation failed, using fallback:", error)
        storyContent = generateFallbackStory(customizations)
      }
    } else {
      console.log("OpenRouter API key not configured, using fallback story")
      storyContent = generateFallbackStory(customizations)
    }

    // Extract title from the story (first line or generate one)
    const lines = storyContent.split("\n").filter((line) => line.trim())
    const title = lines[0]?.replace(/^#+\s*/, "") || "My Magical Story"
    const content = lines.slice(1).join("\n").trim() || storyContent

    // Save story to database
    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        title: title.substring(0, 100), // Limit title length
        content: content,
        cover_image_url: images[0], // Use first image as cover
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save story" }, { status: 500 })
    }

    if (storyGenerationSuccessful && process.env.LEONARDO_API_KEY) {
      try {
        // Use relative URL for internal API calls
        const baseUrl = request.headers.get("host")
          ? `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`
          : "http://localhost:3000"

        fetch(`${baseUrl}/api/generate-images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || "", // Forward cookies for auth
          },
          body: JSON.stringify({
            storyId: story.id,
            storyContent: content,
            storyTitle: title,
          }),
        }).catch((error) => {
          console.error("Background image generation failed:", error)
        })
      } catch (error) {
        console.error("Failed to trigger image generation:", error)
      }
    } else {
      console.log("Skipping background image generation - missing API keys or story generation failed")
    }

    return NextResponse.json({ storyId: story.id, title: story.title })
  } catch (error) {
    console.error("Story generation error:", error)
    return NextResponse.json({ error: "Failed to generate story" }, { status: 500 })
  }
}

async function generateStoryFromImages(imageUrls: string[], customizations?: StoryCustomizations): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured")
  }

  // Enhanced prompt with better photo analysis
  const prompt = `You are a master children's story writer and image analyst. Your task is to create a magical, personalized storybook from the uploaded photos.

ANALYSIS PHASE - First examine each image carefully:
1. Identify main subjects (people, animals, objects, settings)
2. Note colors, moods, activities, and relationships
3. Detect settings (indoor/outdoor, time of day, season, location type)
4. Observe emotions and expressions
5. Look for story-worthy details and elements

STORY CREATION PHASE - Create a ${customizations?.length || 'medium'} length story:

Story Structure Requirements:
- Title on first line (engaging and magical)
- Story divided into 4-6 clear sections/pages
- Each section should be 2-3 sentences for easy illustration
- Use "---PAGE BREAK---" between sections
- Build narrative arc: setup → adventure → challenge → resolution
- End with positive, heartwarming conclusion

Content Guidelines:
- Age-appropriate for ${customizations?.ageGroup || 'all ages'} 
- Theme focus: ${customizations?.theme || 'friendship, adventure, and wonder'}
- Use vivid, descriptive language that sparks imagination
- Create memorable characters with distinct personalities
- Include dialogue and action for dynamic storytelling
- Make each page visually distinct for illustrations

Photo Integration:
- Transform photo subjects into story characters
- Use photo settings as story locations  
- Incorporate photo activities into plot events
- Maintain photo relationships and emotions
- Reference specific visual elements (colors, objects, expressions)

The story should feel personal and magical, as if the photos themselves came to life in a wonderful adventure.`

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "StoryBook Creator",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              ...imageUrls.map((url) => ({
                type: "image_url",
                image_url: {
                  url: url,
                },
              })),
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenRouter API error:", response.status, errorData)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response structure:", data)
      throw new Error("Invalid response from story generation API")
    }

    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error("Error calling OpenRouter API:", error)

    // Fallback story generation if API fails
    return generateFallbackStory()
  }
}

function generateFallbackStory(customizations?: StoryCustomizations): string {
  const theme = customizations?.theme || 'adventure'
  const ageGroup = customizations?.ageGroup || 'all ages'
  
  const fallbackStories = {
    adventure: `The Magical Adventure

---PAGE BREAK---

Once upon a time, in a world filled with wonder and magic, there lived a curious little explorer who discovered something extraordinary in their everyday surroundings. What started as an ordinary day quickly turned into the most amazing adventure they had ever experienced.

---PAGE BREAK---

As they ventured further into this magical world, they met friendly creatures who taught them about courage, kindness, and the power of imagination. Together, they solved puzzles and overcame challenges with teamwork and determination.

---PAGE BREAK---

With each step of their journey, the little explorer grew braver and wiser. They discovered that magic isn't just in fairy tales – it's all around us, waiting to be found by those who dare to look with wonder and an open heart.

---PAGE BREAK---

And so, with new friends by their side and a heart full of joy, the explorer returned home, knowing that every day holds the possibility for a new magical adventure.`,

    friendship: `The Friendship Garden

---PAGE BREAK---

In a special place where flowers bloomed in rainbow colors and butterflies danced in the sunshine, there was a magical garden where the most wonderful friendships grew. This wasn't just any ordinary garden – it was a place where kindness and laughter made everything more beautiful.

---PAGE BREAK---

One day, a gentle soul discovered this enchanted garden and met the most amazing friends they could ever imagine. Together, they planted seeds of joy, watered them with giggles, and watched as their friendship blossomed into something truly spectacular.

---PAGE BREAK---

Through sunny days and gentle rains, the friends in the garden learned to help each other grow. They shared stories, played games, and discovered that when friends work together, they can create the most beautiful things in the world.

---PAGE BREAK---

The garden became a symbol of how friendship makes life more colorful, more joyful, and more magical than anyone could ever imagine.`,

    family: `The Family Adventure

---PAGE BREAK---

In a cozy home filled with love and laughter, there lived a special family who shared the most wonderful adventures together. Every day brought new opportunities to explore, learn, and create magical memories.

---PAGE BREAK---

One sunny morning, the family decided to embark on their greatest adventure yet. With packed lunches and hearts full of excitement, they set off to discover the wonders that waited just beyond their backyard.

---PAGE BREAK---

Along the way, they helped each other, shared discoveries, and learned that the best adventures happen when families stick together. Each family member brought their own special talents to make the journey even more amazing.

---PAGE BREAK---

As they returned home that evening, tired but happy, they realized that the greatest treasure of all was the love they shared and the memories they created together.`
  }

  const selectedStory = fallbackStories[theme] || fallbackStories.adventure
  return selectedStory
}
