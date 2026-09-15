import "server-only"

import { cache } from "react"

import {
  COLUMNAS_EVENTO,
  finDelEvento,
  type Evento,
  type EventoConFotos,
  type FotoEvento,
} from "@/lib/eventos/tipos"
import { crearClienteSupabasePublico } from "@/lib/supabase/servidor"

// Lecturas públicas (RLS solo deja ver eventos publicados).

export const listarEventosPublicos = cache(async () => {
  const supabase = crearClienteSupabasePublico()
  if (!supabase) return { proximos: [] as Evento[], anteriores: [] as Evento[] }

  const { data, error } = await supabase
    .from("eventos")
    .select(COLUMNAS_EVENTO)
    .eq("publicado", true)
    .order("inicia_en", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[eventos] No se pudieron cargar los eventos:", error.message)
    return { proximos: [] as Evento[], anteriores: [] as Evento[] }
  }

  const ahora = new Date()
  const eventos = (data ?? []) as Evento[]
  const proximos = eventos.filter((evento) => finDelEvento(evento) >= ahora).reverse()
  const anteriores = eventos.filter((evento) => finDelEvento(evento) < ahora)

  return { proximos, anteriores }
})

const FORMATO_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const obtenerEventoPorSlug = cache(async (slug: string): Promise<EventoConFotos | null> => {
  if (!FORMATO_SLUG.test(slug)) return null

  const supabase = crearClienteSupabasePublico()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("eventos")
    .select(`${COLUMNAS_EVENTO}, fotos:eventos_fotos(id, evento_id, ruta, orden)`)
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle()

  if (error) {
    console.error("[eventos] No se pudo cargar el evento:", error.message)
    return null
  }
  if (!data) return null

  const evento = data as unknown as EventoConFotos
  return { ...evento, fotos: [...(evento.fotos ?? [])].sort((a: FotoEvento, b: FotoEvento) => a.orden - b.orden) }
})
