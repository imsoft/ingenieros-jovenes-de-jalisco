import "server-only"

import { z } from "zod"

import type { EventRegistration } from "@/lib/events/registrations"
import { EVENT_COLUMNS, type Event, type EventPhoto, type EventWithPhotos } from "@/lib/events/types"
import { requireBoardMember } from "@/lib/panel/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

// Panel queries: include drafts (RLS only shows them to the board).

export async function listPanelEvents(): Promise<Event[]> {
  await requireBoardMember()
  const supabase = await createSessionSupabaseClient()

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("starts_at", { ascending: false })
    .limit(200)

  if (error) throw new Error(`Could not load events: ${error.message}`)
  return (data ?? []) as Event[]
}

export async function getPanelEvent(id: string): Promise<EventWithPhotos | null> {
  await requireBoardMember()
  if (!z.uuid().safeParse(id).success) return null

  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase
    .from("events")
    .select(`${EVENT_COLUMNS}, photos:event_photos(id, event_id, path, sort_order)`)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(`Could not load event: ${error.message}`)
  if (!data) return null

  const event = data as unknown as EventWithPhotos
  return {
    ...event,
    photos: [...(event.photos ?? [])].sort((a: EventPhoto, b: EventPhoto) => a.sort_order - b.sort_order),
  }
}

export async function listEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  await requireBoardMember()
  if (!z.uuid().safeParse(eventId).success) return []

  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, confirmation_code, full_name, email, phone, organization, is_member, amount_due, status, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(2000)

  if (error) throw new Error(`Could not load registrations: ${error.message}`)
  return (data ?? []).map((registration) => ({
    ...registration,
    amount_due: Number(registration.amount_due),
  })) as EventRegistration[]
}
