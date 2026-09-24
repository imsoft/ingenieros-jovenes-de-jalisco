import type { MetadataRoute } from "next"

import { esIndexable, obtenerUrlSitio } from "@/lib/url-sitio"

export default function robots(): MetadataRoute.Robots {
  const url = obtenerUrlSitio()

  if (!esIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/miembros", "/mi-perfil", "/auth"] },
    sitemap: new URL("/sitemap.xml", url).toString(),
    host: url.origin,
  }
}
