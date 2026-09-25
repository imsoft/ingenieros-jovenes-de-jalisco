import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

// Browser client used only to upload files with signed URLs (does not handle sessions).
export function createBrowserSupabaseClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase no está configurado.")

  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
