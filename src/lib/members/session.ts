import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createSessionSupabaseClient } from "@/lib/supabase/session"

export type MemberSession = {
  userId: string
  email: string | null
  suggestedName: string
  isBoardMember: boolean
  isBoardAdmin: boolean
}

type MemberAccess =
  | { kind: "anonymous" }
  | { kind: "no-access"; email: string | null }
  | { kind: "member"; member: MemberSession }

// Verifies the session (JWT validated with getClaims) and that the person is a member. Memoized per request.
export const getMemberAccess = cache(async (): Promise<MemberAccess> => {
  const supabase = await createSessionSupabaseClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return { kind: "anonymous" }

  const email = typeof claims.email === "string" ? claims.email : null

  const [{ data: isMember, error }, { data: boardMember }] = await Promise.all([
    supabase.rpc("am_i_member"),
    supabase.from("board_members").select("is_active, role, full_name").eq("user_id", claims.sub).maybeSingle(),
  ])

  if (error) console.error("[members] Could not verify membership:", error.code, error.message)
  if (!isMember) return { kind: "no-access", email }

  // Metadata is only used to suggest a name, never to authorize.
  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>
  const metadataName = [metadata.full_name, metadata.name].find(
    (value): value is string => typeof value === "string" && value.trim().length >= 2
  )

  return {
    kind: "member",
    member: {
      userId: claims.sub,
      email,
      // Board members without a profile yet are shown with the name the Consejo registered.
      suggestedName: metadataName?.trim() ?? boardMember?.full_name ?? email?.split("@")[0] ?? "Miembro",
      isBoardMember: Boolean(boardMember?.is_active),
      isBoardAdmin: Boolean(boardMember?.is_active && boardMember.role === "admin"),
    },
  }
})

// Call it at the start of every page, query and server action of the member network.
export async function requireMember(next = "/miembros"): Promise<MemberSession> {
  const access = await getMemberAccess()
  if (access.kind === "anonymous") redirect(`/ingresar?next=${encodeURIComponent(next)}`)
  if (access.kind === "no-access") redirect("/acceso-restringido")
  return access.member
}
