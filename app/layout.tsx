import type { Metadata } from 'next'
import Script from 'next/script'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'StoryBook Creator - Transform Photos into Magical Stories',
  description:
    'Create enchanting children\'s storybooks with AI. Upload photos and watch as our AI generates beautiful stories with custom illustrations for all ages.',
  keywords:
    'AI story generator, children\'s books, photo to story, custom illustrations, family-friendly stories, AI art generation, AI children books',
  authors: [{ name: 'Startup Consulting Inc.' }],
  creator: 'Startup Consulting Inc.',
  publisher: 'Startup Consulting Inc.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'StoryBook Creator - AI-Powered Children\'s Stories',
    description:
      'Transform your photos into magical storybooks with AI-generated stories and beautiful custom illustrations.',
    type: 'website',
    locale: 'en_US',
    siteName: 'StoryBook Creator',
    url: appUrl,
    images: [{ url: '/placeholder.jpg', width: 1200, height: 630, alt: 'StoryBook Creator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryBook Creator - AI-Powered Children\'s Stories',
    description: 'Transform photos into magical storybooks with AI-generated stories and custom illustrations.',
    images: ['/placeholder.jpg'],
    creator: '@startup_consult',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const ldOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Startup Consulting Inc.',
    url: appUrl,
    logo: `${appUrl}/placeholder-logo.png`,
    sameAs: ['https://x.com/startup_consult'],
  }
  const ldSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StoryBook Creator',
    url: appUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${appUrl}/stories?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Script id="ld-org" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(ldOrg)}
        </Script>
        <Script id="ld-site" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(ldSite)}
        </Script>
        {children}
      </body>
    </html>
  )
}
