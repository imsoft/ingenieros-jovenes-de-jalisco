import "server-only"

import { z } from "zod"

import { applicationStatuses, type ApplicationStatus, type StatusFilter } from "@/lib/panel/statuses"
import { requireBoardMember } from "@/lib/panel/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

export type MembershipApplication = {
  id: string
  full_name: string
  email: string
  phone: string
  municipality: string
  confirms_legal_age: boolean
  accepts_privacy_notice: boolean
  status: ApplicationStatus
  board_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

const COLUMNS =
  "id, full_name, email, phone, municipality, confirms_legal_age, accepts_privacy_notice, status, board_notes, reviewed_by, reviewed_at, created_at"

export const PAGE_SIZE = 25

export async function countApplicationsByStatus(): Promise<Record<ApplicationStatus, number>> {
  await requireBoardMember()
  const supabase = await createSessionSupabaseClient()

  const counts = await Promise.all(
    applicationStatuses.map(async (status) => {
      const { count, error } = await supabase
        .from("membership_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
      if (error) throw new Error(`Could not count applications: ${error.message}`)
      return [status, count ?? 0] as const
    })
  )

  return Object.fromEntries(counts) as Record<ApplicationStatus, number>
}

// Strips characters that would alter PostgREST filter syntax.
function sanitizeSearch(value?: string) {
  return (value ?? "").replace(/[,()*%\\"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)
}

// Cursor pagination (created_at) so deep pages stay fast.
export async function listApplications({
  status,
  search,
  before,
  limit = PAGE_SIZE,
}: {
  status: StatusFilter
  search?: string
  before?: string
  limit?: number
}) {
  await requireBoardMember()
  const supabase = await createSessionSupabaseClient()

  let query = supabase
    .from("membership_applications")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit + 1)

  if (status !== "all") query = query.eq("status", status)
  if (before && !Number.isNaN(Date.parse(before))) query = query.lt("created_at", before)

  const term = sanitizeSearch(search)
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,municipality.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(`Could not load applications: ${error.message}`)

  const rows = (data ?? []) as MembershipApplication[]
  const applications = rows.slice(0, limit)

  return {
    applications,
    nextCursor: rows.length > limit ? (applications.at(-1)?.created_at ?? null) : null,
  }
}

export async function getApplication(id: string) {
  await requireBoardMember()
  if (!z.uuid().safeParse(id).success) return null

  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.from("membership_applications").select(COLUMNS).eq("id", id).maybeSingle()
  if (error) throw new Error(`Could not load the application: ${error.message}`)
  if (!data) return null

  const application = data as MembershipApplication
  let reviewerName: string | null = null

  if (application.reviewed_by) {
    const { data: member } = await supabase
      .from("board_members")
      .select("full_name")
      .eq("user_id", application.reviewed_by)
      .maybeSingle()
    reviewerName = member?.full_name ?? null
  }

  return { application, reviewerName }
}
