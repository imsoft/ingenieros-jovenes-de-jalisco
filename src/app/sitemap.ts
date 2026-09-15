import type { MetadataRoute } from "next"

import { listarEventosPublicos } from "@/lib/eventos/publico"
import { obtenerUrlSitio } from "@/lib/url-sitio"

// Incluye los eventos publicados; se regenera cada hora.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = obtenerUrlSitio()
  const generado = new Date()
  const { proximos, anteriores } = await listarEventosPublicos()

  const eventos = [...proximos, ...anteriores].map((evento) => ({
    url: new URL(`/eventos/${evento.slug}`, url).toString(),
    lastModified: new Date(evento.updated_at),
    changeFrequency: "weekly" as const,
    priority: proximos.includes(evento) ? 0.8 : 0.5,
  }))

  return [
    { url: new URL("/", url).toString(), lastModified: generado, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/eventos", url).toString(), lastModified: generado, changeFrequency: "daily", priority: 0.9 },
    ...eventos,
    { url: new URL("/aviso-de-privacidad", url).toString(), lastModified: generado, changeFrequency: "yearly", priority: 0.3 },
  ]
}
