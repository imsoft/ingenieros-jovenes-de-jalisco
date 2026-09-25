import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes that require a session and which sign-in page they send to when there is none.
const PROTECTED_ROUTES: { prefix: string; signInPath: string; publicPaths?: string[] }[] = [
  { prefix: "/panel", signInPath: "/panel/ingresar", publicPaths: ["/panel/ingresar"] },
  { prefix: "/miembros", signInPath: "/ingresar" },
  { prefix: "/mi-perfil", signInPath: "/ingresar" },
]

function ruleFor(path: string) {
  return PROTECTED_ROUTES.find(({ prefix }) => path === prefix || path.startsWith(`${prefix}/`))
}

// Refreshes the Supabase session and performs the optimistic access check.
// Real authorization (member, Board) is enforced on the server and in RLS.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        // Prevents a CDN from caching responses that carry session cookies.
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
      },
    },
  })

  // Important: do not add logic between creating the client and getClaims().
  const { data } = await supabase.auth.getClaims()
  const hasSession = Boolean(data?.claims?.sub)

  const path = request.nextUrl.pathname
  const rule = ruleFor(path)

  if (!hasSession && rule && !rule.publicPaths?.includes(path)) {
    const destination = request.nextUrl.clone()
    destination.pathname = rule.signInPath
    destination.search = ""
    if (path !== rule.prefix || rule.prefix !== "/panel") destination.searchParams.set("next", path)

    const redirectResponse = NextResponse.redirect(destination)
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  return response
}
