import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

export type RolConsejo = "admin" | "revisor"

export type MiembroConsejo = {
  usuarioId: string
  correo: string | null
  nombre: string
  rol: RolConsejo
}

type AccesoPanel =
  | { tipo: "anonimo" }
  | { tipo: "sin-acceso"; correo: string | null }
  | { tipo: "miembro"; miembro: MiembroConsejo }

// Verifica la sesión (JWT validado con getClaims) y la membresía activa. Se memoriza por petición.
export const obtenerAccesoPanel = cache(async (): Promise<AccesoPanel> => {
  const supabase = await crearClienteSupabaseConSesion()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return { tipo: "anonimo" }

  const correo = typeof claims.email === "string" ? claims.email : null

  // RLS solo deja ver miembros_consejo a miembros activos: si no hay fila, no hay acceso.
  const { data: fila } = await supabase
    .from("miembros_consejo")
    .select("nombre, rol, activo")
    .eq("usuario_id", claims.sub)
    .maybeSingle()

  if (!fila?.activo) return { tipo: "sin-acceso", correo }

  return {
    tipo: "miembro",
    miembro: { usuarioId: claims.sub, correo, nombre: fila.nombre, rol: fila.rol },
  }
})

// Úsala al inicio de cada página, consulta y server action del panel.
export async function exigirMiembroConsejo(): Promise<MiembroConsejo> {
  const acceso = await obtenerAccesoPanel()
  if (acceso.tipo === "anonimo") redirect("/panel/ingresar")
  if (acceso.tipo === "sin-acceso") redirect("/panel/sin-acceso")
  return acceso.miembro
}
