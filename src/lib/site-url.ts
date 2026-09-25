// Public site URL for metadata, sitemap and structured data.
// Priority: NEXT_PUBLIC_SITE_URL → Vercel production domain → localhost.
export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return new URL(configured)

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return new URL(`https://${vercelProduction}`)

  return new URL("http://localhost:3000")
}

// Only production is indexed; Vercel preview deployments stay out of search engines.
export function isIndexable(): boolean {
  const vercelEnv = process.env.VERCEL_ENV
  return vercelEnv ? vercelEnv === "production" : true
}
