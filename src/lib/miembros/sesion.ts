import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

export type SesionMiembro = {
  usuarioId: string
  correo: string | null
  nombreSugerido: string
  esConsejo: boolean
  esAdminConsejo: boolean
}

type AccesoMiembro =
  | { tipo: "anonimo" }
  | { tipo: "sin-acceso"; correo: string | null }
  | { tipo: "miembro"; miembro: SesionMiembro }

// Verifica la sesión (JWT validado con getClaims) y que la persona sea miembro. Se memoriza por petición.
export const obtenerAccesoMiembro = cache(async (): Promise<AccesoMiembro> => {
  const supabase = await crearClienteSupabaseConSesion()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return { tipo: "anonimo" }

  const correo = typeof claims.email === "string" ? claims.email : null

  const [{ data: esMiembro, error }, { data: consejo }] = await Promise.all([
    supabase.rpc("soy_miembro"),
    supabase.from("miembros_consejo").select("activo, rol").eq("usuario_id", claims.sub).maybeSingle(),
  ])

  if (error) console.error("[miembros] No se pudo verificar la membresía:", error.code, error.message)
  if (!esMiembro) return { tipo: "sin-acceso", correo }

  // Los metadatos solo se usan para sugerir un nombre, nunca para autorizar.
  const metadatos = (claims.user_metadata ?? {}) as Record<string, unknown>
  const nombreMetadatos = [metadatos.full_name, metadatos.name].find(
    (valor): valor is string => typeof valor === "string" && valor.trim().length >= 2
  )

  return {
    tipo: "miembro",
    miembro: {
      usuarioId: claims.sub,
      correo,
      nombreSugerido: nombreMetadatos?.trim() ?? correo?.split("@")[0] ?? "Miembro",
      esConsejo: Boolean(consejo?.activo),
      esAdminConsejo: Boolean(consejo?.activo && consejo.rol === "admin"),
    },
  }
})

// Úsala al inicio de cada página, consulta y server action de la red de miembros.
export async function exigirMiembro(siguiente = "/miembros"): Promise<SesionMiembro> {
  const acceso = await obtenerAccesoMiembro()
  if (acceso.tipo === "anonimo") redirect(`/ingresar?siguiente=${encodeURIComponent(siguiente)}`)
  if (acceso.tipo === "sin-acceso") redirect("/acceso-restringido")
  return acceso.miembro
}
