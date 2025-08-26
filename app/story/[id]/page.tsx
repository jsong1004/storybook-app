import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Share2 } from "lucide-react"
import { GenerateImagesButton } from "@/components/generate-images-button"
import { StorybookReader } from "@/components/storybook-reader"
import { PDFExportButton } from "@/components/pdf-export-button"
import { ShareStoryButton } from "@/components/share-story-button"

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch the story
  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !story) {
    notFound()
  }

  // Fetch story images
  const { data: storyImages } = await supabase
    .from("story_images")
    .select("*")
    .eq("story_id", story.id)
    .order("page_number", { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex gap-2">
            {(!storyImages || storyImages.length === 0) && (
              <GenerateImagesButton storyId={story.id} storyContent={story.content} storyTitle={story.title} />
            )}
            <PDFExportButton 
              storyId={story.id}
              title={story.title}
              content={story.content}
              coverImage={story.cover_image_url}
              storyImages={storyImages}
              createdAt={story.created_at}
            />
            <ShareStoryButton 
              storyId={story.id}
              title={story.title}
              coverImage={story.cover_image_url}
            />
          </div>
        </div>

        <StorybookReader 
          storyId={story.id}
          title={story.title}
          content={story.content}
          coverImage={story.cover_image_url}
          storyImages={storyImages}
          createdAt={story.created_at}
        />

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/create">Create Another Story</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
