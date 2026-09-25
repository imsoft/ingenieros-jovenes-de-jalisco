import { TIME_ZONE } from "@/lib/events/format"
import type { Event } from "@/lib/events/types"

// Central Mexico uses UTC-6 all year (no daylight saving time since 2022).
const MEXICO_OFFSET = "-06:00"

export function localDateTimeToIso(date: string, time: string) {
  return new Date(`${date}T${time}:00${MEXICO_OFFSET}`).toISOString()
}

const partsFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
})

export function isoToLocalDateTime(iso: string) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(new Date(iso)).map(({ type, value }) => [type, value])
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

// "Jalisco al Grito 2026" → "jalisco-al-grito-2026"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "")
}

// The slug is derived from the title and year: "Jalisco al Grito" + 2026 → "jalisco-al-grito-2026".
// Used by both the form (preview) and the server (actual value) so they always match.
export function getEventSlug(title: string, date: string) {
  const year = /^\d{4}/.exec(date)?.[0] ?? ""
  return slugify(year && !title.includes(year) ? `${title} ${year}` : title)
}

export type EventFormValues = {
  title: string
  slug: string
  summary: string
  description: string
  date: string
  startTime: string
  endTime: string
  venue: string
  address: string
  mapUrl: string
  publicPrice: string
  memberPrice: string
  capacity: string
  paymentInstructions: string
  registrationOpen: boolean
  isPublished: boolean
}

export const emptyEventFormValues: EventFormValues = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  address: "",
  mapUrl: "",
  publicPrice: "",
  memberPrice: "",
  capacity: "",
  paymentInstructions: "",
  registrationOpen: true,
  isPublished: false,
}

export function eventToFormValues(event: Event): EventFormValues {
  const start = isoToLocalDateTime(event.starts_at)
  return {
    title: event.title,
    slug: event.slug,
    summary: event.summary,
    description: event.description,
    date: start.date,
    startTime: start.time,
    endTime: event.ends_at ? isoToLocalDateTime(event.ends_at).time : "",
    venue: event.venue,
    address: event.address ?? "",
    mapUrl: event.map_url ?? "",
    publicPrice: event.public_price?.toString() ?? "",
    memberPrice: event.member_price?.toString() ?? "",
    capacity: event.capacity?.toString() ?? "",
    paymentInstructions: event.payment_instructions ?? "",
    registrationOpen: event.registration_open,
    isPublished: event.is_published,
  }
}
