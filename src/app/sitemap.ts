import type { MetadataRoute } from "next"

import { obtenerUrlSitio } from "@/lib/url-sitio"

export default function sitemap(): MetadataRoute.Sitemap {
  const url = obtenerUrlSitio()
  const generado = new Date()

  return [
    {
      url: new URL("/", url).toString(),
      lastModified: generado,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/aviso-de-privacidad", url).toString(),
      lastModified: generado,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
