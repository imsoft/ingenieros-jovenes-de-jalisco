import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Anonymous client for public server-side operations (subject to RLS).
// Returns null while the Supabase project is not configured.
export function createPublicSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
