import { NextResponse, type NextRequest } from "next/server"

import { rutaSegura } from "@/lib/cuenta/rutas"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

// Termina el inicio de sesión con Google, la confirmación de correo y la recuperación de contraseña (PKCE).
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const siguiente = rutaSegura(url.searchParams.get("siguiente"))
  const errorProveedor = url.searchParams.get("error_description") ?? url.searchParams.get("error")

  if (errorProveedor) {
    const motivo = errorProveedor.includes("CORREO_NO_AUTORIZADO") ? "no-autorizado" : "google"
    return NextResponse.redirect(new URL(`/ingresar?error=${motivo}`, url.origin))
  }

  const codigo = url.searchParams.get("code")
  if (codigo) {
    const supabase = await crearClienteSupabaseConSesion()
    const { error } = await supabase.auth.exchangeCodeForSession(codigo)
    if (!error) return NextResponse.redirect(new URL(siguiente, url.origin))
    console.error("[cuenta] No se pudo completar el inicio de sesión:", error.code, error.message)
  }

  return NextResponse.redirect(new URL("/ingresar?error=enlace", url.origin))
}
