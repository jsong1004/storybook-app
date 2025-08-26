import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional for public sharing)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { storyId, title, content, coverImage, storyImages, createdAt } = await request.json()

    if (!storyId || !content) {
      return NextResponse.json({ error: "Story ID and content are required" }, { status: 400 })
    }

    // Verify the story exists (and belongs to user if authenticated)
    const storyQuery = supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)

    if (user) {
      // If user is authenticated, ensure they own the story
      storyQuery.eq("user_id", user.id)
    }

    const { data: story, error: storyError } = await storyQuery.single()

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Generate printable HTML with images
    const htmlContent = generatePrintableHTML(title, content, coverImage, storyImages, createdAt)

    // Return as HTML that opens in new tab for printing
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_storybook.html`
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}

function generatePrintableHTML(title: string, content: string, coverImage?: string, storyImages: any[] = [], createdAt: string): string {
  // Parse the story content into pages
  const pageContents = content.split('---PAGE BREAK---').filter(page => page.trim().length > 0)
  
  const storyPages = []
  
  // Cover page
  storyPages.push({
    pageNumber: 0,
    content: title,
    image: coverImage,
    isCover: true
  })

  // Story pages
  pageContents.forEach((pageContent, index) => {
    const pageNumber = index + 1
    // Find matching image for this page
    const matchingImage = storyImages.find(img => img.page_number === pageNumber)
    
    storyPages.push({
      pageNumber,
      content: pageContent.trim(),
      image: matchingImage?.image_url,
      isStory: true
    })
  })

  const pagesHTML = storyPages.map((page, index) => {
    if (page.isCover) {
      // Cover page
      return `
        <div class="page cover-page">
          <div class="cover-content">
            <h1 class="cover-title">${title}</h1>
            <p class="cover-subtitle">A magical storybook created just for you</p>
            ${coverImage ? `<img src="${coverImage}" alt="Cover" class="cover-image" />` : ''}
            <p class="cover-date">Created on ${new Date(createdAt).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      `
    } else {
      // Story pages
      return `
        <div class="page story-page">
          <div class="page-content">
            <div class="text-section">
              <p class="story-text">${page.content}</p>
            </div>
            ${page.image ? `
              <div class="image-section">
                <img src="${page.image}" alt="Story illustration for page ${page.pageNumber}" class="story-image" />
              </div>
            ` : ''}
          </div>
          <div class="page-number">Page ${page.pageNumber}</div>
        </div>
      `
    }
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - Storybook</title>
      <style>
        @media screen {
          body {
            background: #f0f0f0;
            padding: 20px;
          }
          .page {
            max-width: 210mm;
            margin: 0 auto 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .print-instructions {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            max-width: 300px;
          }
          .print-button {
            background: white;
            color: #007bff;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            margin-top: 10px;
          }
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .print-instructions {
            display: none;
          }
          .page {
            box-shadow: none;
            margin: 0;
          }
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          font-family: 'Georgia', serif;
          margin: 0;
          padding: 0;
          line-height: 1.6;
        }
        
        .page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          position: relative;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        .cover-page {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          justify-content: center;
          align-items: center;
          padding: 60px 40px;
        }
        
        .cover-content {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .cover-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin: 0 0 20px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          line-height: 1.2;
        }
        
        .cover-subtitle {
          font-size: 1.2rem;
          margin: 0 0 30px 0;
          font-style: italic;
          opacity: 0.9;
        }
        
        .cover-image {
          max-width: 250px;
          max-height: 200px;
          object-fit: cover;
          border-radius: 10px;
          margin: 20px 0;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        .cover-date {
          font-size: 1rem;
          margin-top: 30px;
          opacity: 0.8;
        }
        
        .story-page {
          padding: 40px;
          background: white;
        }
        
        .page-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          min-height: 200mm;
          align-items: start;
        }
        
        .text-section {
          padding: 20px;
        }
        
        .story-text {
          font-size: 1.1rem;
          line-height: 1.8;
          text-align: justify;
          color: #333;
          margin: 0;
          hyphens: auto;
        }
        
        .story-text::first-letter {
          font-size: 3rem;
          font-weight: bold;
          float: left;
          margin: 0 8px 0 0;
          line-height: 0.8;
          color: #667eea;
        }
        
        .image-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .story-image {
          max-width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        
        .page-number {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 0.9rem;
          color: #666;
        }
        
        /* Single column layout when no image */
        .page-content:has(.text-section:only-child) {
          grid-template-columns: 1fr;
        }
      </style>
      <script>
        function printStorybook() {
          window.print();
        }
        
        // Auto-focus for immediate printing
        window.onload = function() {
          document.title = '${title} - Ready to Print';
        }
      </script>
    </head>
    <body>
      <div class="print-instructions">
        <strong>Print Instructions:</strong><br>
        Use Ctrl+P (Cmd+P on Mac) to print this storybook as PDF. 
        Choose "Save as PDF" as your destination.
        <br>
        <button class="print-button" onclick="printStorybook()">Print Now</button>
      </div>
      
      ${pagesHTML}
    </body>
    </html>
  `
}