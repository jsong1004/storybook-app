"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, GripVertical } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface UploadedImage {
  id: string
  url: string
  filename: string
}

interface DraggableImageUploadProps {
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

export function DraggableImageUpload({ onImagesUploaded, maxImages = 5 }: DraggableImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
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

  const reorderImages = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return
    
    const result = Array.from(uploadedImages)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    setUploadedImages(result)
    onImagesUploaded(result)
    
    toast({
      title: "Images reordered",
      description: `Moved image from position ${startIndex + 1} to ${endIndex + 1}`,
    })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== dropIndex && !isNaN(dragIndex)) {
      reorderImages(dragIndex, dropIndex)
    }
    setDraggedIndex(null)
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
                  <br />
                  <span className="text-xs font-medium text-blue-600">✨ Images will be used in the order you arrange them</span>
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
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <GripVertical className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800 dark:text-blue-200">
              Drag images to reorder them for your story sequence
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <Card 
                key={image.id} 
                className={`relative group cursor-move hover:shadow-lg transition-all duration-200 ${
                  draggedIndex === index ? 'scale-105 shadow-xl ring-2 ring-primary ring-opacity-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <CardContent className="p-2">
                  {/* Order indicator */}
                  <div className="absolute -top-2 -left-2 z-20">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Drag handle indicator */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/70 text-white rounded-md px-2 py-1 text-xs flex items-center gap-1">
                      <GripVertical className="h-3 w-3" />
                      <span>Drag</span>
                    </div>
                  </div>

                  <div className="aspect-square relative overflow-hidden rounded-md ring-1 ring-gray-200 dark:ring-gray-700">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.filename}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      draggable={false}
                    />
                    
                    {/* Remove button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(image.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    
                    {/* Drag overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mt-2 text-center">
                    <p className="text-xs text-muted-foreground truncate font-medium">{image.filename}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Story position {index + 1}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="text-xs text-center text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
            💡 The first image will be your cover, and subsequent images will inspire different parts of your story
          </div>
        </div>
      )}
    </div>
  )
}