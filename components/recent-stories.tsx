"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StoryCard } from "@/components/story-card"
import Link from "next/link"

interface Story {
  id: string
  title: string
  content: string
  created_at: string
}

interface RecentStoriesProps {
  initialStories: Story[]
}

export function RecentStories({ initialStories }: RecentStoriesProps) {
  const [stories, setStories] = useState<Story[]>(initialStories)

  const handleStoryDelete = (deletedStoryId: string) => {
    setStories(stories.filter(story => story.id !== deletedStoryId))
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Recent Stories</h2>
        {stories && stories.length > 0 && (
          <Button variant="outline" asChild>
            <Link href="/stories">View All</Link>
          </Button>
        )}
      </div>

      {stories && stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard 
              key={story.id} 
              story={story} 
              onDelete={handleStoryDelete}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No stories yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Upload some photos and let our AI create your first magical storybook!
            </p>
            <Button asChild>
              <Link href="/create">Create Your First Story</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}