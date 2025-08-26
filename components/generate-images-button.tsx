"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface GenerateImagesButtonProps {
  storyId: string
  storyContent: string
  storyTitle: string
}

export function GenerateImagesButton({ storyId, storyContent, storyTitle }: GenerateImagesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const generateImages = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId,
          storyContent,
          storyTitle,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate images")
      }

      const data = await response.json()

      toast({
        title: "Images generated successfully!",
        description: `Generated ${data.imagesGenerated} beautiful illustrations for your story.`,
      })

      // Refresh the page to show the new images
      router.refresh()
    } catch (error) {
      console.error("Image generation error:", error)
      toast({
        title: "Generation failed",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generateImages} disabled={isGenerating} variant="outline">
      <Sparkles className="mr-2 h-4 w-4" />
      {isGenerating ? "Generating Images..." : "Generate Illustrations"}
    </Button>
  )
}
