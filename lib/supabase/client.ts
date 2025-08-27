import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // During build time, environment variables might not be available
  // Provide valid placeholder values that won't cause URL constructor to fail
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUyNjU0MzAsImV4cCI6MTk2MDg0MTQzMH0.placeholder-signature"
  
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to create Supabase client, using placeholder:', error)
    // Return a minimal client object that won't break the build
    return createBrowserClient("https://placeholder.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUyNjU0MzAsImV4cCI6MTk2MDg0MTQzMH0.placeholder-signature")
  }
}
