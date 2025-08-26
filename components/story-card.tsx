"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Story {
  id: string
  title: string
  content: string
  created_at: string
}

interface StoryCardProps {
  story: Story
  onDelete: (storyId: string) => void
}

export function StoryCard({ story, onDelete }: StoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/delete-story", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storyId: story.id }),
      })

      if (response.ok) {
        onDelete(story.id)
      } else {
        console.error("Failed to delete story")
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error("Error deleting story:", error)
      // You might want to show a toast notification here
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card key={story.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1">{story.title}</CardTitle>
            <CardDescription className="line-clamp-2">{story.content.substring(0, 100)}...</CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Story</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{story.title}"? This action cannot be undone and will permanently remove the story and all associated images.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Story"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {new Date(story.created_at).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/story/${story.id}`}>Read</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}