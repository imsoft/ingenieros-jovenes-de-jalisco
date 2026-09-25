// Event types and rules, safe for both server and client.

export type Event = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  starts_at: string
  ends_at: string | null
  venue: string
  address: string | null
  map_url: string | null
  public_price: number | null
  member_price: number | null
  capacity: number | null
  spots_taken: number
  payment_instructions: string | null
  cover_path: string | null
  registration_open: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export type EventPhoto = {
  id: string
  event_id: string
  path: string
  sort_order: number
}

export type EventWithPhotos = Event & { photos: EventPhoto[] }

export const EVENT_COLUMNS =
  "id, slug, title, summary, description, starts_at, ends_at, venue, address, map_url, public_price, member_price, capacity, spots_taken, payment_instructions, cover_path, registration_open, is_published, created_at, updated_at"

// Without an end time, an event is considered ongoing until 6 hours after it starts.
const ASSUMED_DURATION_MS = 6 * 60 * 60 * 1000

export function getEventEnd(event: Pick<Event, "starts_at" | "ends_at">) {
  return event.ends_at
    ? new Date(event.ends_at)
    : new Date(new Date(event.starts_at).getTime() + ASSUMED_DURATION_MS)
}

export function hasEnded(event: Pick<Event, "starts_at" | "ends_at">, now = new Date()) {
  return getEventEnd(event) < now
}

export type Availability =
  | { status: "open"; remaining: number | null }
  | { status: "full" }
  | { status: "closed" }
  | { status: "ended" }

export const LAST_SPOTS_THRESHOLD = 10

export function getEventAvailability(event: Event, now = new Date()): Availability {
  if (hasEnded(event, now)) return { status: "ended" }
  if (!event.registration_open || new Date(event.starts_at) <= now) return { status: "closed" }
  if (event.capacity !== null && event.spots_taken >= event.capacity) return { status: "full" }
  return {
    status: "open",
    remaining: event.capacity === null ? null : event.capacity - event.spots_taken,
  }
}
