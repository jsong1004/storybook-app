"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface StoryImage {
  id: string
  image_url: string
  page_number: number
  prompt?: string
}

interface PDFExportButtonProps {
  storyId: string
  title: string
  content: string
  coverImage?: string
  storyImages?: StoryImage[]
  createdAt: string
}

export function PDFExportButton({ 
  storyId, 
  title, 
  content, 
  coverImage, 
  storyImages = [], 
  createdAt 
}: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Call API to get printable HTML
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId,
          title,
          content,
          coverImage,
          storyImages,
          createdAt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      // Get the HTML content
      const htmlContent = await response.text()
      
      // Open in new tab for printing
      const newTab = window.open('', '_blank')
      if (newTab) {
        newTab.document.write(htmlContent)
        newTab.document.close()
      }

      toast({
        title: "Print-ready storybook opened!",
        description: "A new tab opened with your storybook ready to print as PDF.",
      })
      
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "PDF generation failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }


  return (
    <Button 
      variant="outline" 
      onClick={generatePDF} 
      disabled={isGenerating}
      className="flex items-center gap-2"
    >
      {isGenerating ? (
        <>
          <FileText className="h-4 w-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  )
}