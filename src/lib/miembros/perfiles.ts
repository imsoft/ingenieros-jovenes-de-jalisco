import "server-only"

import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

export type Perfil = {
  usuario_id: string
  nombre: string
  ocupacion: string | null
  especialidad: string | null
  empresa: string | null
  puesto: string | null
  municipio: string | null
  biografia: string | null
  linkedin_url: string | null
  instagram: string | null
  sitio_web: string | null
  foto_ruta: string | null
  visible: boolean
  suspendido: boolean
  updated_at: string
}

const COLUMNAS =
  "usuario_id, nombre, ocupacion, especialidad, empresa, puesto, municipio, biografia, linkedin_url, instagram, sitio_web, foto_ruta, visible, suspendido, updated_at"

export const BUCKET_PERFILES = "perfiles"

export function urlFotoPerfil(ruta: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!ruta || !base) return null
  return `${base}/storage/v1/object/public/${BUCKET_PERFILES}/${ruta}`
}

// Todas las consultas pasan por RLS: solo miembros ven perfiles; los ocultos, solo su dueño;
// los suspendidos, su dueño y los administradores; y nunca los de quien ya no es miembro.
export async function obtenerPerfil(usuarioId: string): Promise<Perfil | null> {
  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase.from("perfiles").select(COLUMNAS).eq("usuario_id", usuarioId).maybeSingle()
  if (error) console.error("[miembros] No se pudo leer el perfil:", error.code, error.message)
  return data
}

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

// El Colectivo es chico: se trae el directorio completo y se filtra aquí, sin acentos ni mayúsculas.
export async function listarDirectorio(busqueda?: string): Promise<{ perfiles: Perfil[]; total: number }> {
  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase
    .from("perfiles")
    .select(COLUMNAS)
    .eq("visible", true)
    .eq("suspendido", false)
    .order("nombre", { ascending: true })
    .limit(1000)

  if (error) console.error("[miembros] No se pudo leer el directorio:", error.code, error.message)
  const todos = data ?? []

  const terminos = normalizar(busqueda?.trim() ?? "").split(/\s+/).filter(Boolean)
  if (terminos.length === 0) return { perfiles: todos, total: todos.length }

  const perfiles = todos.filter((perfil) => {
    const texto = normalizar(
      [perfil.nombre, perfil.ocupacion, perfil.especialidad, perfil.empresa, perfil.puesto, perfil.municipio]
        .filter(Boolean)
        .join(" ")
    )
    return terminos.every((termino) => texto.includes(termino))
  })
  return { perfiles, total: todos.length }
}
