import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { safeRedirectPath } from "@/lib/account/routes"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "email_change", "magiclink"]

// Links from the auth emails (templates in src/lib/email/auth-templates.ts).
// Uses token_hash instead of PKCE, so the link works even when opened on another device or email app.
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type") as EmailOtpType | null
  const next = safeRedirectPath(url.searchParams.get("next"))

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const supabase = await createSessionSupabaseClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
    console.error("[account] Could not verify the link:", error.code, error.message)
  }

  return NextResponse.redirect(new URL("/ingresar?error=invalid-link", url.origin))
}
