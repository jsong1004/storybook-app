import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Use production domain explicitly to avoid localhost issues
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://storybook.ai-biz.app'
  
  console.log('OAuth callback - code:', code ? 'present' : 'missing')
  console.log('OAuth callback - requestUrl.origin:', requestUrl.origin)
  console.log('OAuth callback - baseUrl:', baseUrl)
  console.log('OAuth callback - SUPABASE_URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('OAuth callback - SUPABASE_ANON_KEY available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  if (code) {
    try {
      const supabase = await createClient()
      console.log('OAuth callback - supabase client created:', !!supabase)
      
      if (!supabase) {
        console.error('OAuth callback - supabase client is undefined')
        return NextResponse.redirect(new URL('/auth/login?error=oauth_error', baseUrl))
      }
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/login?error=oauth_error', baseUrl))
      }
      
      console.log('OAuth callback - successful authentication')
      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', baseUrl))
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/auth/login?error=oauth_error', baseUrl))
    }
  }
  
  // No code parameter, redirect to login
  console.log('OAuth callback - no code parameter, redirecting to:', `${baseUrl}/auth/login`)
  return NextResponse.redirect(new URL('/auth/login', baseUrl))
}