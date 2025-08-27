import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0, changeFrequency: 'weekly', lastModified: new Date() },
    { url: `${base}/dashboard`, priority: 0.7, changeFrequency: 'weekly', lastModified: new Date() },
    { url: `${base}/create`, priority: 0.7, changeFrequency: 'monthly', lastModified: new Date() },
  ]

  try {
    const supabase = await createClient()
    const { data: stories } = await supabase.from('stories').select('id, updated_at').limit(200)
    if (stories && stories.length > 0) {
      for (const s of stories) {
        let images: { url: string }[] | undefined
        try {
          const { data: imgs } = await supabase
            .from('story_images')
            .select('image_url')
            .eq('story_id', s.id)
            .limit(5)
          images = (imgs || []).map((i) => ({ url: i.image_url }))
        } catch {
          images = undefined
        }
        entries.push({
          url: `${base}/story/${s.id}`,
          changeFrequency: 'monthly',
          priority: 0.6,
          lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
          images,
        })
      }
    }
  } catch {
    // best-effort only
  }

  return entries
}


