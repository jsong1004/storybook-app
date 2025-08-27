import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  // Remove server-side auth check for now - public landing page
  // TODO: Add client-side redirect to dashboard if user is logged in

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">StoryBook Creator</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your photos into magical storybooks with AI. Upload images and watch as our AI creates enchanting
            stories for all ages.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">📸 Upload Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Upload your favorite photos and let our AI analyze them to create the perfect story setting.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">✨ AI Magic</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Our advanced AI creates engaging, age-appropriate stories and generates beautiful illustrations.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">📚 Share Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Save your personalized storybooks and share them with family and friends.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
