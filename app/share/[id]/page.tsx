import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { StorybookReader } from "@/components/storybook-reader"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Heart } from "lucide-react"

export default async function PublicStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the story (no user authentication required for public sharing)
  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
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
        {/* Public Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Shared with love</span>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/create">
              Create Your Own Story
            </Link>
          </Button>
        </div>

        {/* Story Reader */}
        <StorybookReader 
          storyId={story.id}
          title={story.title}
          content={story.content}
          coverImage={story.cover_image_url}
          storyImages={storyImages}
          createdAt={story.created_at}
        />

        {/* Call to Action */}
        <div className="mt-12 text-center space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Create Your Own Magical Storybook</h3>
            <p className="text-muted-foreground mb-6">
              Upload your photos and let AI create a personalized storybook with beautiful illustrations, just like this one!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/create">
                  Start Creating
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: story } = await supabase
    .from("stories")
    .select("title, cover_image_url")
    .eq("id", id)
    .single()

  if (!story) {
    return {
      title: 'Story Not Found'
    }
  }

  return {
    title: `${story.title} - AI Generated Storybook`,
    description: `Check out this magical storybook: "${story.title}" - Created with AI Story Generator!`,
    openGraph: {
      title: story.title,
      description: `Check out this magical storybook created with AI!`,
      images: story.cover_image_url ? [story.cover_image_url] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description: `Check out this magical storybook created with AI!`,
      images: story.cover_image_url ? [story.cover_image_url] : [],
    },
  }
}