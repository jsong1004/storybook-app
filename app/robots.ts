import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/auth/', '/api/', '/dashboard'] }],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  }
}


