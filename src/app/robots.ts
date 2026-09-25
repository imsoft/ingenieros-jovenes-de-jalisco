import type { MetadataRoute } from "next"

import { getSiteUrl, isIndexable } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const url = getSiteUrl()

  if (!isIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/panel", "/miembros", "/mi-perfil", "/auth"] },
    sitemap: new URL("/sitemap.xml", url).toString(),
    host: url.origin,
  }
}
