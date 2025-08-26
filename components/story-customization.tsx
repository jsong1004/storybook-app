"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface StoryCustomizations {
  ageGroup?: 'toddlers (2-4)' | 'preschool (4-6)' | 'early readers (6-8)' | 'young readers (8-12)' | 'all ages'
  theme?: 'friendship' | 'adventure' | 'family' | 'nature' | 'magic' | 'learning' | 'kindness' | 'courage'
  length?: 'short' | 'medium' | 'long'
  tone?: 'playful' | 'gentle' | 'exciting' | 'educational'
}

interface StoryCustomizationProps {
  onCustomizationChange: (customizations: StoryCustomizations) => void
}

const themes = {
  friendship: { label: "Friendship", description: "Stories about making friends and working together", emoji: "🤝" },
  adventure: { label: "Adventure", description: "Exciting journeys and discoveries", emoji: "🗺️" },
  family: { label: "Family", description: "Love, togetherness, and family bonds", emoji: "👨‍👩‍👧‍👦" },
  nature: { label: "Nature", description: "Animals, plants, and the great outdoors", emoji: "🌳" },
  magic: { label: "Magic", description: "Enchanted worlds and magical powers", emoji: "✨" },
  learning: { label: "Learning", description: "Educational adventures and discovery", emoji: "📚" },
  kindness: { label: "Kindness", description: "Being helpful and caring for others", emoji: "💝" },
  courage: { label: "Courage", description: "Being brave and overcoming fears", emoji: "🦁" }
}

const ageGroups = {
  'toddlers (2-4)': { label: "Toddlers (2-4)", description: "Simple words, basic concepts", emoji: "🧸" },
  'preschool (4-6)': { label: "Preschool (4-6)", description: "Interactive, educational", emoji: "🎨" },
  'early readers (6-8)': { label: "Early Readers (6-8)", description: "Beginning chapter books", emoji: "📖" },
  'young readers (8-12)': { label: "Young Readers (8-12)", description: "Complex stories, longer tales", emoji: "📚" },
  'all ages': { label: "All Ages", description: "Perfect for the whole family", emoji: "👨‍👩‍👧‍👦" }
}

export function StoryCustomization({ onCustomizationChange }: StoryCustomizationProps) {
  const [customizations, setCustomizations] = useState<StoryCustomizations>({
    ageGroup: 'all ages',
    theme: 'adventure',
    length: 'medium',
    tone: 'playful'
  })

  const updateCustomization = (key: keyof StoryCustomizations, value: string) => {
    const updated = { ...customizations, [key]: value }
    setCustomizations(updated)
    onCustomizationChange(updated)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Customization</CardTitle>
        <CardDescription>
          Customize your story to make it perfect for your audience and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Age Group Selection */}
        <div className="space-y-2">
          <Label htmlFor="age-group">Age Group</Label>
          <Select value={customizations.ageGroup} onValueChange={(value) => updateCustomization('ageGroup', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ageGroups).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{info.emoji}</span>
                    <div>
                      <div className="font-medium">{info.label}</div>
                      <div className="text-sm text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Theme Selection */}
        <div className="space-y-2">
          <Label htmlFor="theme">Story Theme</Label>
          <Select value={customizations.theme} onValueChange={(value) => updateCustomization('theme', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(themes).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{info.emoji}</span>
                    <div>
                      <div className="font-medium">{info.label}</div>
                      <div className="text-sm text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Length Selection */}
        <div className="space-y-2">
          <Label htmlFor="length">Story Length</Label>
          <Select value={customizations.length} onValueChange={(value) => updateCustomization('length', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">
                <div>
                  <div className="font-medium">📄 Short (3-4 pages)</div>
                  <div className="text-sm text-muted-foreground">Quick story, perfect for bedtime</div>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div>
                  <div className="font-medium">📚 Medium (4-6 pages)</div>
                  <div className="text-sm text-muted-foreground">Balanced story with good detail</div>
                </div>
              </SelectItem>
              <SelectItem value="long">
                <div>
                  <div className="font-medium">📖 Long (6-8 pages)</div>
                  <div className="text-sm text-muted-foreground">Rich, detailed adventure</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <Label htmlFor="tone">Story Tone</Label>
          <Select value={customizations.tone} onValueChange={(value) => updateCustomization('tone', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="playful">🎈 Playful - Fun and silly</SelectItem>
              <SelectItem value="gentle">🌸 Gentle - Calm and soothing</SelectItem>
              <SelectItem value="exciting">⚡ Exciting - Action-packed</SelectItem>
              <SelectItem value="educational">🧠 Educational - Learning focused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview of current selections */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium">Your Story Will Be:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{ageGroups[customizations.ageGroup!].emoji} {customizations.ageGroup}</Badge>
            <Badge variant="secondary">{themes[customizations.theme!].emoji} {customizations.theme}</Badge>
            <Badge variant="secondary">📏 {customizations.length}</Badge>
            <Badge variant="secondary">🎭 {customizations.tone}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}