"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface UploadedImage {
  id: string
  url: string
  filename: string
}

interface ImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void
  maxImages?: number
}

const compressImage = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality,
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

export function ImageUpload({ onImagesUploaded, maxImages = 5 }: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (uploadedImages.length + acceptedFiles.length > maxImages) {
        toast({
          title: "Too many images",
          description: `You can only upload up to ${maxImages} images at once.`,
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to upload images.",
            variant: "destructive",
          })
          return
        }

        const uploadPromises = acceptedFiles.map(async (file) => {
          let processedFile = file
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "Compressing image",
              description: `${file.name} is large, compressing for faster upload...`,
            })
            processedFile = await compressImage(file)
          }

          // Upload to Vercel Blob
          const formData = new FormData()
          formData.append("file", processedFile)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            let errorMessage = "Failed to upload image"
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch {
              // If response is not JSON, try to get text content
              const errorText = await response.text()
              if (errorText.includes("Request Entity Too Large")) {
                errorMessage = "File is too large. Please choose a smaller image."
              } else if (errorText) {
                errorMessage = `Upload failed: ${errorText.substring(0, 100)}`
              }
            }
            throw new Error(errorMessage)
          }

          const { url } = await response.json()

          // Save to Supabase
          const { data, error } = await supabase
            .from("uploaded_images")
            .insert({
              user_id: user.id,
              image_url: url,
              original_filename: file.name,
            })
            .select()
            .single()

          if (error) throw error

          return {
            id: data.id,
            url: data.image_url,
            filename: data.original_filename,
          }
        })

        const newImages = await Promise.all(uploadPromises)
        const updatedImages = [...uploadedImages, ...newImages]
        setUploadedImages(updatedImages)
        onImagesUploaded(updatedImages)

        toast({
          title: "Images uploaded successfully",
          description: `${newImages.length} image(s) uploaded.`,
        })
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Upload failed",
          description: "Failed to upload images. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [uploadedImages, maxImages, onImagesUploaded, supabase],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxImages,
    disabled: isUploading,
  })

  const removeImage = (imageId: string) => {
    const updatedImages = uploadedImages.filter((img) => img.id !== imageId)
    setUploadedImages(updatedImages)
    onImagesUploaded(updatedImages)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the images here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">{isUploading ? "Uploading..." : "Drag & drop images here"}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to select files (max {maxImages} images, auto-compressed if large)
                </p>
                <Button variant="outline" disabled={isUploading}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose Images
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedImages.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative overflow-hidden rounded-md">
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.filename}
                    className="object-cover w-full h-full"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 truncate">{image.filename}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
