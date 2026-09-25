import "server-only"

import type { BoardRole } from "@/lib/panel/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

export type BoardMemberListing = {
  user_id: string | null
  full_name: string
  email: string
  role: BoardRole
  status: "active" | "inactive" | "invited"
  since: string
}

export type ModeratedProfile = { user_id: string; full_name: string; updated_at: string }

// Admins only: list_board enforces it in the database.
export async function listBoard(): Promise<BoardMemberListing[]> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.rpc("list_board")
  if (error) console.error("[panel] Could not list the board:", error.code, error.message)
  return (data ?? []) as BoardMemberListing[]
}

// RLS only lets admins see suspended profiles.
export async function listModeratedProfiles(): Promise<ModeratedProfile[]> {
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, updated_at")
    .eq("is_suspended", true)
    .order("updated_at", { ascending: false })
  if (error) console.error("[panel] Could not list moderated profiles:", error.code, error.message)
  return data ?? []
}
