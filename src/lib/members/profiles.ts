import "server-only"

import { createSessionSupabaseClient } from "@/lib/supabase/session"

export type Profile = {
  user_id: string
  full_name: string
  headline: string | null
  specialty: string | null
  municipality: string | null
  bio: string | null
  linkedin_url: string | null
  instagram_handle: string | null
  website_url: string | null
  photo_path: string | null
  is_visible: boolean
  is_suspended: boolean
  updated_at: string
}

const COLUMNS =
  "user_id, full_name, headline, specialty, municipality, bio, linkedin_url, instagram_handle, website_url, photo_path, is_visible, is_suspended, updated_at"

export const PROFILES_BUCKET = "profiles"

export function getProfilePhotoUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/${PROFILES_BUCKET}/${path}`
}

// Every query goes through RLS: only members see profiles; hidden ones, only their owner;
// suspended ones, their owner and admins; and never those of someone who is no longer a member.
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("user_id", userId).maybeSingle()
  if (error) console.error("[members] Could not read the profile:", error.code, error.message)
  return data
}

// The Collective is small: the whole directory is fetched and filtered in memory (see lib/members/directory.ts).
export async function listDirectoryProfiles(): Promise<Profile[]> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("is_visible", true)
    .eq("is_suspended", false)
    .order("full_name", { ascending: true })
    .limit(1000)

  if (error) console.error("[members] Could not read the directory:", error.code, error.message)
  return data ?? []
}
