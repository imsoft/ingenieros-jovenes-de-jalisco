import "server-only"

import { buildBadges, type MemberBadge } from "@/lib/members/badges"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

// Consejo members come from list_board_badges (members never see panel roles); special badges follow
// profile visibility through RLS. Pass userIds to fetch only the badges of one profile.
export async function listBadges(userIds?: string[]): Promise<Map<string, MemberBadge[]>> {
  const supabase = await createSessionSupabaseClient()
  let specialQuery = supabase.from("member_badges").select("user_id, kind").order("created_at")
  if (userIds) specialQuery = specialQuery.in("user_id", userIds)
  const [board, special] = await Promise.all([supabase.rpc("list_board_badges"), specialQuery])
  if (board.error) console.error("[badges] Could not read Consejo badges:", board.error.code, board.error.message)
  if (special.error) console.error("[badges] Could not read badges:", special.error.code, special.error.message)
  const boardRows = ((board.data ?? []) as { user_id: string; title: string | null }[]).filter((row) => !userIds || userIds.includes(row.user_id))
  return buildBadges(boardRows, special.data ?? [])
}
