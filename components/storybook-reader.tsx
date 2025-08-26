"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, BookOpen, Maximize2, Eye, EyeOff } from "lucide-react"

interface StoryImage {
  id: string
  image_url: string
  page_number: number
  prompt?: string
}

interface StorybookPage {
  pageNumber: number
  content: string
  image?: StoryImage
}

interface StorybookReaderProps {
  storyId: string
  title: string
  content: string
  coverImage?: string
  storyImages?: StoryImage[]
  createdAt: string
}

export function StorybookReader({ storyId, title, content, coverImage, storyImages = [], createdAt }: StorybookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [pages, setPages] = useState<StorybookPage[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)

  const exportToPDF = async () => {
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
      
    } catch (error) {
      console.error("PDF generation error:", error)
    }
  }


  useEffect(() => {
    // Parse the story content into pages
    const pageContents = content.split('---PAGE BREAK---').filter(page => page.trim().length > 0)
    
    const storyPages: StorybookPage[] = []
    
    // Cover page
    storyPages.push({
      pageNumber: 0,
      content: `# ${title}\n\n*A magical storybook created just for you*\n\nCreated on ${new Date(createdAt).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`,
      image: coverImage ? { id: 'cover', image_url: coverImage, page_number: 0 } : undefined
    })

    // Story pages
    pageContents.forEach((pageContent, index) => {
      const pageNumber = index + 1
      // Find matching image for this page
      const matchingImage = storyImages.find(img => img.page_number === pageNumber)
      
      storyPages.push({
        pageNumber,
        content: pageContent.trim(),
        image: matchingImage
      })
    })

    setPages(storyPages)
  }, [content, title, coverImage, storyImages, createdAt])

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const currentPageData = pages[currentPage]

  if (!currentPageData) {
    return <div className="text-center p-8">Loading your storybook...</div>
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 bg-white z-50 p-4' : ''}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <Badge variant="secondary">Page {currentPage + 1} of {pages.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Storybook Pages */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          {/* Page Display */}
          <Card className="overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              {currentPage === 0 ? (
                // Cover Page
                <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 p-8 md:p-12">
                  <div className="text-center space-y-6">
                    <div className="space-y-4">
                      <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {title}
                      </h1>
                      <p className="text-lg text-muted-foreground italic">A magical storybook created just for you</p>
                    </div>
                    
                    {coverImage && (
                      <div className="flex justify-center">
                        <img
                          src={coverImage || "/placeholder.svg"}
                          alt="Story cover"
                          className="rounded-xl shadow-lg max-w-md w-full h-64 object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      Created on {new Date(createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // Story Pages
                <div className="grid md:grid-cols-2 min-h-[500px]">
                  {/* Text Content */}
                  <div className="p-8 md:p-12 flex items-center justify-center bg-gradient-to-br from-cream-50 to-yellow-50">
                    <div className="prose prose-lg max-w-none">
                      <p className="text-xl leading-relaxed font-medium text-gray-800 first-letter:text-6xl first-letter:font-bold first-letter:text-purple-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                        {currentPageData.content}
                      </p>
                    </div>
                  </div>
                  
                  {/* Illustration */}
                  <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
                    {currentPageData.image ? (
                      <div className="text-center space-y-4 relative">
                        {/* Prompt Toggle Button */}
                        {currentPageData.image.prompt && (
                          <div className="absolute top-2 right-2 z-10">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPrompts(!showPrompts)}
                              className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
                            >
                              {showPrompts ? (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  AI Prompt
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        
                        <img
                          src={currentPageData.image.image_url || "/placeholder.svg"}
                          alt={`Story illustration for page ${currentPage + 1}`}
                          className="w-full max-w-md h-80 object-cover rounded-xl shadow-lg"
                        />
                        
                        {/* Collapsible Prompt */}
                        {currentPageData.image.prompt && showPrompts && (
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border max-w-md mx-auto">
                            <p className="text-xs text-muted-foreground italic">
                              <span className="font-medium text-blue-600">AI Prompt:</span><br />
                              {currentPageData.image.prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-4 text-muted-foreground">
                        <BookOpen className="h-24 w-24 mx-auto opacity-30" />
                        <p className="text-sm">Illustration coming soon...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={prevPage} 
          disabled={currentPage === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        {/* Page Indicators */}
        <div className="flex items-center gap-1">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentPage 
                  ? 'bg-primary scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
        
        <Button 
          variant="outline" 
          onClick={nextPage} 
          disabled={currentPage === pages.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}