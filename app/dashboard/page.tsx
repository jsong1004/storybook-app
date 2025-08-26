import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentStories } from "@/components/recent-stories"
import Link from "next/link"

export default async function DashboardPage() {
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
    .limit(6)

  // Get uploaded images count
  const { count: uploadedImagesCount } = await supabase
    .from("uploaded_images")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Ready to create magical stories from your photos?</p>
        </div>
        <Button asChild size="lg">
          <Link href="/create">Create New Story</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
            <span className="text-2xl">📚</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stories?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <span className="text-2xl">✨</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stories?.filter((story) => {
                const storyDate = new Date(story.created_at)
                const now = new Date()
                return storyDate.getMonth() === now.getMonth() && storyDate.getFullYear() === now.getFullYear()
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Uploaded</CardTitle>
            <span className="text-2xl">📸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadedImagesCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <RecentStories initialStories={stories || []} />
    </div>
  )
}
