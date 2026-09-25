import type { MetadataRoute } from "next"

import { listPublicEvents } from "@/lib/events/public"
import { getSiteUrl } from "@/lib/site-url"

// Includes published events; regenerated every hour.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = getSiteUrl()
  const generatedAt = new Date()
  const { upcoming, past } = await listPublicEvents()

  const events = [...upcoming, ...past].map((event) => ({
    url: new URL(`/eventos/${event.slug}`, url).toString(),
    lastModified: new Date(event.updated_at),
    changeFrequency: "weekly" as const,
    priority: upcoming.includes(event) ? 0.8 : 0.5,
  }))

  return [
    { url: new URL("/", url).toString(), lastModified: generatedAt, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/eventos", url).toString(), lastModified: generatedAt, changeFrequency: "daily", priority: 0.9 },
    ...events,
    { url: new URL("/aviso-de-privacidad", url).toString(), lastModified: generatedAt, changeFrequency: "yearly", priority: 0.3 },
  ]
}
