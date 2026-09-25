import type { MetadataRoute } from "next"

import { site } from "@/content/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Ingenieros Jóvenes",
    description: site.description,
    lang: "es-MX",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10436f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
