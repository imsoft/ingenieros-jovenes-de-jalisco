import type { Event } from "@/lib/events/types"

// Guadalajara uses central Mexico time (no daylight saving time since 2022).
export const TIME_ZONE = "America/Mexico_City"

const longDateFormat = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
})

const timeFormat = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
})

const dayMonthFormat = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: TIME_ZONE,
})

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatLongDate(iso: string) {
  const text = longDateFormat.format(new Date(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso))
}

export function formatTimeRange(event: Pick<Event, "starts_at" | "ends_at">) {
  const start = formatTime(event.starts_at)
  return event.ends_at ? `${start} a ${formatTime(event.ends_at)}` : start
}

export function getDateParts(iso: string) {
  const parts = dayMonthFormat.formatToParts(new Date(iso))
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: (parts.find((part) => part.type === "month")?.value ?? "").replace(".", ""),
  }
}

export function formatPrice(value: number) {
  return value === 0 ? "Gratis" : currency.format(value)
}

// For totals and accounting amounts: always shown as currency, even when 0.
export function formatAmount(value: number) {
  return currency.format(value)
}

// Short price text for cards: "Entrada libre", "$350" or "$350 · Miembros $300".
export function getPriceLabel(event: Pick<Event, "public_price" | "member_price">) {
  if (event.public_price === null || event.public_price === 0) return "Entrada libre"
  const publicPrice = formatPrice(event.public_price)
  if (event.member_price !== null && event.member_price < event.public_price) {
    return `${publicPrice} · Miembros ${formatPrice(event.member_price)}`
  }
  return publicPrice
}

export function getEventImageUrl(path: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!path || !base) return null
  return `${base}/storage/v1/object/public/events/${path}`
}
