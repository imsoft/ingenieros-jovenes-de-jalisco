import "server-only"

import type { RolConsejo } from "@/lib/panel/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

export type IntegranteConsejo = {
  usuario_id: string | null
  nombre: string
  correo: string
  rol: RolConsejo
  estado: "activo" | "baja" | "invitado"
  desde: string
}

export type PerfilModerado = { usuario_id: string; nombre: string; updated_at: string }

// Solo administradores: listar_consejo lo exige en la base de datos.
export async function listarConsejo(): Promise<IntegranteConsejo[]> {
  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase.rpc("listar_consejo")
  if (error) console.error("[panel] No se pudo listar al Consejo:", error.code, error.message)
  return (data ?? []) as IntegranteConsejo[]
}

// RLS solo deja ver perfiles suspendidos a administradores.
export async function listarPerfilesModerados(): Promise<PerfilModerado[]> {
  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase
    .from("perfiles")
    .select("usuario_id, nombre, updated_at")
    .eq("suspendido", true)
    .order("updated_at", { ascending: false })
  if (error) console.error("[panel] No se pudieron listar los perfiles moderados:", error.code, error.message)
  return data ?? []
}
