import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get story ID from request body
    const { storyId } = await request.json()

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Verify the story belongs to the user before deletion
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found or access denied" }, { status: 404 })
    }

    // Delete associated story images first (to maintain referential integrity)
    const { error: imagesDeleteError } = await supabase
      .from("story_images")
      .delete()
      .eq("story_id", storyId)

    if (imagesDeleteError) {
      console.error("Error deleting story images:", imagesDeleteError)
      // Continue with story deletion even if image deletion fails
    }

    // Delete the story
    const { error: deleteError } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("Error deleting story:", deleteError)
      return NextResponse.json({ error: "Failed to delete story" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Story deleted successfully" 
    })
  } catch (error) {
    console.error("Delete story error:", error)
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 })
  }
}