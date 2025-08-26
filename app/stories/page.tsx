import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function StoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Stories</h1>
          <p className="text-muted-foreground">All your magical storybooks in one place</p>
        </div>
        <Button asChild>
          <Link href="/create">Create New Story</Link>
        </Button>
      </div>

      {stories && stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card key={story.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                {story.cover_image_url && (
                  <div className="mb-4">
                    <img
                      src={story.cover_image_url || "/placeholder.svg"}
                      alt={story.title}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                <CardTitle className="line-clamp-2">{story.title}</CardTitle>
                <CardDescription className="line-clamp-3">{story.content.substring(0, 150)}...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                  <Button asChild>
                    <Link href={`/story/${story.id}`}>Read Story</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
