import type { MetadataRoute } from "next"

import { sitio } from "@/content/sitio"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: sitio.nombre,
    short_name: "Ingenieros Jóvenes",
    description: sitio.descripcion,
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
