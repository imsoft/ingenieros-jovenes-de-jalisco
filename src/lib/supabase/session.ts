import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Client with the user's session (cookies). All its queries go through RLS as `authenticated`.
export async function createSessionSupabaseClient() {
  // Cookies first: this makes Next mark the page as dynamic so it never tries to prerender it
  // during the build (where an error from missing env vars would break the whole deployment).
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase no está configurado (faltan variables de entorno).")

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components can't write cookies; the /panel proxy refreshes the session.
        }
      },
    },
  })
}
