import { NextResponse, type NextRequest } from "next/server"

import { safeRedirectPath } from "@/lib/account/routes"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

// Completes Google sign-in, email confirmation and password recovery (PKCE).
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const next = safeRedirectPath(url.searchParams.get("next"))
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error")

  if (providerError) {
    const reason = providerError.includes("EMAIL_NOT_AUTHORIZED") ? "not-authorized" : "google"
    return NextResponse.redirect(new URL(`/ingresar?error=${reason}`, url.origin))
  }

  const code = url.searchParams.get("code")
  if (code) {
    const supabase = await createSessionSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error("[account] Could not complete sign-in:", error.code, error.message)
  }

  return NextResponse.redirect(new URL("/ingresar?error=invalid-link", url.origin))
}
