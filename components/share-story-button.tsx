"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Share2, Copy, Facebook, Twitter, Mail, Link as LinkIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ShareStoryButtonProps {
  storyId: string
  title: string
  coverImage?: string
}

export function ShareStoryButton({ storyId, title, coverImage }: ShareStoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Use production URL for sharing if available, otherwise fallback to current origin
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      // Check if we're in production by looking at the hostname
      const isProduction = window.location.hostname !== 'localhost'
      
      if (isProduction) {
        return `${window.location.origin}/share/${storyId}`
      } else {
        // In development, show a helpful message
        return `https://your-domain.com/share/${storyId}`
      }
    }
    return `/share/${storyId}`
  }
  
  const shareUrl = getShareUrl()
  const shareText = `Check out this magical storybook: "${title}" - Created with AI Story Generator!`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      
      toast({
        title: "Link copied!",
        description: isDevelopment 
          ? "Development link copied. Deploy your app to share with others!"
          : "The story link has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link. Please copy manually.",
        variant: "destructive",
      })
    }
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my storybook: ${title}`)
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareViaTwitter = () => {
    const text = encodeURIComponent(shareText)
    const url = encodeURIComponent(shareUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`)
  }

  const shareViaFacebook = () => {
    const url = encodeURIComponent(shareUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`)
  }

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.log('Native sharing cancelled or failed')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Story
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Storybook</DialogTitle>
          <DialogDescription>
            Share this magical storybook with family and friends!
          </DialogDescription>
        </DialogHeader>
        
        {/* Story Preview */}
        <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
          {coverImage && (
            <img
              src={coverImage}
              alt={title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-2">{title}</h4>
            <Badge variant="secondary" className="text-xs mt-1">
              Storybook
            </Badge>
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {/* Copy Link */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={copyToClipboard}
          >
            <Copy className="mr-3 h-4 w-4" />
            Copy Link
          </Button>

          {/* Native Share (if supported) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={shareViaNative}
            >
              <Share2 className="mr-3 h-4 w-4" />
              Share via Device
            </Button>
          )}

          {/* Social Media */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={shareViaEmail}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Mail className="h-5 w-5 mb-1" />
              <span className="text-xs">Email</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareViaTwitter}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Twitter className="h-5 w-5 mb-1" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareViaFacebook}
              className="flex flex-col items-center p-3 h-auto"
            >
              <Facebook className="h-5 w-5 mb-1" />
              <span className="text-xs">Facebook</span>
            </Button>
          </div>
        </div>

        {/* URL Display */}
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <code className="text-sm text-muted-foreground break-all">
              {shareUrl}
            </code>
          </div>
          {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <span>⚠️</span> Deploy your app to enable real sharing
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}