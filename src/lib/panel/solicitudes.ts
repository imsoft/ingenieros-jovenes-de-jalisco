import "server-only"

import { z } from "zod"

import { estadosSolicitud, type EstadoSolicitud, type FiltroEstado } from "@/lib/panel/estados"
import { exigirMiembroConsejo } from "@/lib/panel/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

export type Solicitud = {
  id: string
  nombre: string
  correo: string
  telefono: string
  municipio: string
  confirma_mayoria_edad: boolean
  acepta_aviso_privacidad: boolean
  estado: EstadoSolicitud
  notas_consejo: string | null
  revisado_por: string | null
  revisado_en: string | null
  created_at: string
}

const COLUMNAS =
  "id, nombre, correo, telefono, municipio, confirma_mayoria_edad, acepta_aviso_privacidad, estado, notas_consejo, revisado_por, revisado_en, created_at"

export const TAMANO_PAGINA = 25

export async function contarSolicitudesPorEstado(): Promise<Record<EstadoSolicitud, number>> {
  await exigirMiembroConsejo()
  const supabase = await crearClienteSupabaseConSesion()

  const conteos = await Promise.all(
    estadosSolicitud.map(async (estado) => {
      const { count, error } = await supabase
        .from("solicitudes_afiliacion")
        .select("id", { count: "exact", head: true })
        .eq("estado", estado)
      if (error) throw new Error(`No se pudieron contar las solicitudes: ${error.message}`)
      return [estado, count ?? 0] as const
    })
  )

  return Object.fromEntries(conteos) as Record<EstadoSolicitud, number>
}

// Quita caracteres que alteran la sintaxis de filtros de PostgREST.
function limpiarBusqueda(valor?: string) {
  return (valor ?? "").replace(/[,()*%\\"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60)
}

// Paginación por cursor (created_at) para que las páginas profundas sigan siendo rápidas.
export async function listarSolicitudes({
  estado,
  busqueda,
  hasta,
  limite = TAMANO_PAGINA,
}: {
  estado: FiltroEstado
  busqueda?: string
  hasta?: string
  limite?: number
}) {
  await exigirMiembroConsejo()
  const supabase = await crearClienteSupabaseConSesion()

  let consulta = supabase
    .from("solicitudes_afiliacion")
    .select(COLUMNAS)
    .order("created_at", { ascending: false })
    .limit(limite + 1)

  if (estado !== "todas") consulta = consulta.eq("estado", estado)
  if (hasta && !Number.isNaN(Date.parse(hasta))) consulta = consulta.lt("created_at", hasta)

  const termino = limpiarBusqueda(busqueda)
  if (termino) {
    consulta = consulta.or(`nombre.ilike.%${termino}%,correo.ilike.%${termino}%,municipio.ilike.%${termino}%`)
  }

  const { data, error } = await consulta
  if (error) throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`)

  const filas = (data ?? []) as Solicitud[]
  const solicitudes = filas.slice(0, limite)

  return {
    solicitudes,
    siguienteCursor: filas.length > limite ? (solicitudes.at(-1)?.created_at ?? null) : null,
  }
}

export async function obtenerSolicitud(id: string) {
  await exigirMiembroConsejo()
  if (!z.uuid().safeParse(id).success) return null

  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase.from("solicitudes_afiliacion").select(COLUMNAS).eq("id", id).maybeSingle()
  if (error) throw new Error(`No se pudo cargar la solicitud: ${error.message}`)
  if (!data) return null

  const solicitud = data as Solicitud
  let revisor: string | null = null

  if (solicitud.revisado_por) {
    const { data: miembro } = await supabase
      .from("miembros_consejo")
      .select("nombre")
      .eq("usuario_id", solicitud.revisado_por)
      .maybeSingle()
    revisor = miembro?.nombre ?? null
  }

  return { solicitud, revisor }
}
