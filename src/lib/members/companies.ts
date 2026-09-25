import "server-only"

import { PROFILES_BUCKET } from "@/lib/members/profiles"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import type { CompanyRole } from "@/lib/validations/company"

export type Company = {
  id: string
  user_id: string
  name: string
  role: CompanyRole
  job_title: string | null
  sector: string | null
  description: string | null
  services: string[]
  municipality: string | null
  address: string | null
  website_url: string | null
  linkedin_url: string | null
  instagram_handle: string | null
  facebook_url: string | null
  logo_path: string | null
  sort_order: number
  created_at: string
}

export type Contact = { whatsapp: string | null; email: string | null; is_visible: boolean }

const COLUMNS =
  "id, user_id, name, role, job_title, sector, description, services, municipality, address, website_url, linkedin_url, instagram_handle, facebook_url, logo_path, sort_order, created_at"

// Logos live in the member's folder of the profiles bucket: {user_id}/companies/{uuid}.ext
export const companyLogoFolder = (userId: string) => `${userId}/companies`

export function getCompanyLogoUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/${PROFILES_BUCKET}/${path}`
}

// RLS makes companies follow profile visibility: hidden, suspended and former members' companies never come back.
export async function listCompaniesForUser(userId: string): Promise<Company[]> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase
    .from("member_companies")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("sort_order")
    .order("created_at")
  if (error) console.error("[companies] Could not read companies:", error.code, error.message)
  return data ?? []
}

export async function listVisibleCompanies(): Promise<Company[]> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.from("member_companies").select(COLUMNS).order("sort_order").order("created_at").limit(5000)
  if (error) console.error("[companies] Could not read companies:", error.code, error.message)
  return data ?? []
}

export async function getOwnCompany(userId: string, companyId: string): Promise<Company | null> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.from("member_companies").select(COLUMNS).eq("id", companyId).eq("user_id", userId).maybeSingle()
  if (error) console.error("[companies] Could not read the company:", error.code, error.message)
  return data
}

// Returns the contact only when RLS allows it: the owner, or members when it is shared.
export async function getContact(userId: string): Promise<Contact | null> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.from("profile_contacts").select("whatsapp, email, is_visible").eq("user_id", userId).maybeSingle()
  if (error) console.error("[companies] Could not read the contact:", error.code, error.message)
  return data
}
