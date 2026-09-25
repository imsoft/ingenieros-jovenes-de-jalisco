import "server-only"

import { createSessionSupabaseClient } from "@/lib/supabase/session"

export type Profile = {
  user_id: string
  full_name: string
  headline: string | null
  specialty: string | null
  company: string | null
  job_title: string | null
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
  "user_id, full_name, headline, specialty, company, job_title, municipality, bio, linkedin_url, instagram_handle, website_url, photo_path, is_visible, is_suspended, updated_at"

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

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

// The Collective is small: fetch the whole directory and filter here, ignoring accents and case.
export async function listDirectory(search?: string): Promise<{ profiles: Profile[]; total: number }> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("is_visible", true)
    .eq("is_suspended", false)
    .order("full_name", { ascending: true })
    .limit(1000)

  if (error) console.error("[members] Could not read the directory:", error.code, error.message)
  const all = data ?? []

  const terms = normalize(search?.trim() ?? "").split(/\s+/).filter(Boolean)
  if (terms.length === 0) return { profiles: all, total: all.length }

  const profiles = all.filter((profile) => {
    const text = normalize(
      [profile.full_name, profile.headline, profile.specialty, profile.company, profile.job_title, profile.municipality]
        .filter(Boolean)
        .join(" ")
    )
    return terms.every((term) => text.includes(term))
  })
  return { profiles, total: all.length }
}
