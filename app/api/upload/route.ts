import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN)
    console.log("[v0] Environment check:", {
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    })

    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    console.log("[v0] About to upload file:", file.name, "Size:", file.size)

    try {
      // Upload to Vercel Blob - simplified filename like the example
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      })

      console.log("[v0] Upload successful:", blob.url)

      try {
        const { error: dbError } = await supabase.from("uploaded_images").insert({
          user_id: user.id,
          image_url: blob.url,
          original_filename: file.name,
        })

        if (dbError) {
          console.log("[v0] Database save failed (tables may not exist):", dbError.message)
        } else {
          console.log("[v0] Successfully saved to database")
        }
      } catch (dbError) {
        console.log("[v0] Database operation failed:", dbError instanceof Error ? dbError.message : String(dbError))
      }

      return NextResponse.json({ url: blob.url })
    } catch (blobError) {
      console.error("[v0] Blob upload failed:", blobError instanceof Error ? blobError.message : String(blobError))

      // Check if it's a size-related error
      if (String(blobError).includes("Request Entity Too Large") || String(blobError).includes("413")) {
        return NextResponse.json({ error: "File too large. Please use a smaller image." }, { status: 413 })
      }

      return NextResponse.json({ error: "Upload service unavailable. Please try again." }, { status: 503 })
    }
  } catch (error) {
    console.error("[v0] General upload error:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
