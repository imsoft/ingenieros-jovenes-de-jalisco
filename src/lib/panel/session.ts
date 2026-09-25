import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createSessionSupabaseClient } from "@/lib/supabase/session"

export type BoardRole = "admin" | "reviewer"

export type BoardMember = {
  userId: string
  email: string | null
  name: string
  role: BoardRole
}

type PanelAccess =
  | { kind: "anonymous" }
  | { kind: "no-access"; email: string | null }
  | { kind: "member"; member: BoardMember }

// Verifies the session (JWT validated with getClaims) and active membership. Memoized per request.
export const getPanelAccess = cache(async (): Promise<PanelAccess> => {
  const supabase = await createSessionSupabaseClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return { kind: "anonymous" }

  const email = typeof claims.email === "string" ? claims.email : null

  // RLS only lets active members see board_members: no row means no access.
  const { data: row, error } = await supabase
    .from("board_members")
    .select("full_name, role, is_active")
    .eq("user_id", claims.sub)
    .maybeSingle()

  // An error here (e.g. an unapplied migration) must not be mistaken for "not a member".
  if (error) console.error("[panel] Could not verify board membership:", error.code, error.message)

  if (!row?.is_active) return { kind: "no-access", email }

  return {
    kind: "member",
    member: { userId: claims.sub, email, name: row.full_name, role: row.role },
  }
})

// Call it at the start of every panel page, query and server action.
export async function requireBoardMember(): Promise<BoardMember> {
  const access = await getPanelAccess()
  if (access.kind === "anonymous") redirect("/panel/ingresar")
  if (access.kind === "no-access") redirect("/panel/sin-acceso")
  return access.member
}

// For admin-only actions. The database enforces it too.
export async function requireBoardAdmin(): Promise<BoardMember> {
  const member = await requireBoardMember()
  if (member.role !== "admin") redirect("/panel")
  return member
}
