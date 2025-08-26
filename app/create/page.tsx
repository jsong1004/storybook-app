"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DraggableImageUpload } from "@/components/draggable-image-upload"
import { StoryCustomization } from "@/components/story-customization"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Sparkles } from "lucide-react"

interface UploadedImage {
  id: string
  url: string
  filename: string
}

interface StoryCustomizations {
  ageGroup?: 'toddlers (2-4)' | 'preschool (4-6)' | 'early readers (6-8)' | 'young readers (8-12)' | 'all ages'
  theme?: 'friendship' | 'adventure' | 'family' | 'nature' | 'magic' | 'learning' | 'kindness' | 'courage'
  length?: 'short' | 'medium' | 'long'
  tone?: 'playful' | 'gentle' | 'exciting' | 'educational'
}

export default function CreateStoryPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [customizations, setCustomizations] = useState<StoryCustomizations>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleImagesUploaded = (images: UploadedImage[]) => {
    setUploadedImages(images)
  }

  const handleCustomizationChange = (newCustomizations: StoryCustomizations) => {
    setCustomizations(newCustomizations)
  }

  const generateStory = async () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "No images uploaded",
        description: "Please upload at least one image to generate a story.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to generate stories.",
          variant: "destructive",
        })
        return
      }

      // Call story generation API with customizations and ordered images
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: uploadedImages.map((img) => img.url), // Images are now in user-defined order
          customizations,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate story")
      }

      const { storyId } = await response.json()

      toast({
        title: "Story generated successfully!",
        description: "Your magical storybook is ready. Illustrations are being generated in the background.",
      })

      router.push(`/story/${storyId}`)
    } catch (error) {
      console.error("Story generation error:", error)
      toast({
        title: "Generation failed",
        description: "Failed to generate story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Create Your Storybook</h1>
          <p className="text-xl text-muted-foreground">
            Upload your photos and let AI create a magical story with beautiful illustrations just for you!
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload & Arrange Your Images</CardTitle>
            <CardDescription>
              Choose up to 5 images that will inspire your story. 
              <span className="font-semibold text-primary"> Drag to reorder them</span> - the sequence will determine how your story unfolds!
              The first image will be your cover, and the order will guide the story progression.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DraggableImageUpload onImagesUploaded={handleImagesUploaded} maxImages={5} />
          </CardContent>
        </Card>

        <div className="mb-8">
          <StoryCustomization onCustomizationChange={handleCustomizationChange} />
        </div>

        {uploadedImages.length > 0 && (
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✨ Ready to create your personalized storybook with {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <Button onClick={generateStory} disabled={isGenerating} size="lg" className="px-8">
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? "Generating Your Story..." : "Generate Story & Illustrations"}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              This may take a few moments while our AI creates your personalized storybook with custom illustrations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}