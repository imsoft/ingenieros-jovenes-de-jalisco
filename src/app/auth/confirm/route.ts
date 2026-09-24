import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { rutaSegura } from "@/lib/cuenta/rutas"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

const TIPOS: EmailOtpType[] = ["signup", "email", "recovery", "invite", "email_change", "magiclink"]

// Enlaces de los correos de autenticación (plantillas en supabase/plantillas).
// Usa token_hash en lugar de PKCE, así el enlace sirve aunque se abra en otro dispositivo o app de correo.
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get("token_hash")
  const tipo = url.searchParams.get("type") as EmailOtpType | null
  const siguiente = rutaSegura(url.searchParams.get("siguiente"))

  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await crearClienteSupabaseConSesion()
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(siguiente, url.origin))
    console.error("[cuenta] No se pudo verificar el enlace:", error.code, error.message)
  }

  return NextResponse.redirect(new URL("/ingresar?error=enlace", url.origin))
}
