// URL pública del sitio para metadatos, sitemap y datos estructurados.
// Prioridad: NEXT_PUBLIC_SITE_URL → dominio de producción de Vercel → localhost.
export function obtenerUrlSitio(): URL {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL
  if (configurada) return new URL(configurada)

  const produccionVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (produccionVercel) return new URL(`https://${produccionVercel}`)

  return new URL("http://localhost:3000")
}

// Solo producción se indexa; los despliegues de preview de Vercel quedan fuera de buscadores.
export function esIndexable(): boolean {
  const entornoVercel = process.env.VERCEL_ENV
  return entornoVercel ? entornoVercel === "production" : true
}
