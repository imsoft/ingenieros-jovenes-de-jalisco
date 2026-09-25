import "server-only"

import { cache } from "react"

import {
  EVENT_COLUMNS,
  getEventEnd,
  type Event,
  type EventPhoto,
  type EventWithPhotos,
} from "@/lib/events/types"
import { createPublicSupabaseClient } from "@/lib/supabase/server"

// Public reads (RLS only exposes published events).

export const listPublicEvents = cache(async () => {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return { upcoming: [] as Event[], past: [] as Event[] }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("is_published", true)
    .order("starts_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[events] Could not load events:", error.message)
    return { upcoming: [] as Event[], past: [] as Event[] }
  }

  const now = new Date()
  const events = (data ?? []) as Event[]
  const upcoming = events.filter((event) => getEventEnd(event) >= now).reverse()
  const past = events.filter((event) => getEventEnd(event) < now)

  return { upcoming, past }
})

const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const getEventBySlug = cache(async (slug: string): Promise<EventWithPhotos | null> => {
  if (!SLUG_FORMAT.test(slug)) return null

  const supabase = createPublicSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("events")
    .select(`${EVENT_COLUMNS}, photos:event_photos(id, event_id, path, sort_order)`)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (error) {
    console.error("[events] Could not load event:", error.message)
    return null
  }
  if (!data) return null

  const event = data as unknown as EventWithPhotos
  return {
    ...event,
    photos: [...(event.photos ?? [])].sort((a: EventPhoto, b: EventPhoto) => a.sort_order - b.sort_order),
  }
})
