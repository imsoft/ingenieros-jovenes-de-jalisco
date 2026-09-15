import "server-only"

import { z } from "zod"

import type { RegistroEvento } from "@/lib/eventos/registros"
import { COLUMNAS_EVENTO, type Evento, type EventoConFotos, type FotoEvento } from "@/lib/eventos/tipos"
import { exigirMiembroConsejo } from "@/lib/panel/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

// Consultas del panel: incluyen borradores (RLS los muestra solo al Consejo).

export async function listarEventosPanel(): Promise<Evento[]> {
  await exigirMiembroConsejo()
  const supabase = await crearClienteSupabaseConSesion()

  const { data, error } = await supabase
    .from("eventos")
    .select(COLUMNAS_EVENTO)
    .order("inicia_en", { ascending: false })
    .limit(200)

  if (error) throw new Error(`No se pudieron cargar los eventos: ${error.message}`)
  return (data ?? []) as Evento[]
}

export async function obtenerEventoPanel(id: string): Promise<EventoConFotos | null> {
  await exigirMiembroConsejo()
  if (!z.uuid().safeParse(id).success) return null

  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase
    .from("eventos")
    .select(`${COLUMNAS_EVENTO}, fotos:eventos_fotos(id, evento_id, ruta, orden)`)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar el evento: ${error.message}`)
  if (!data) return null

  const evento = data as unknown as EventoConFotos
  return { ...evento, fotos: [...(evento.fotos ?? [])].sort((a: FotoEvento, b: FotoEvento) => a.orden - b.orden) }
}

export async function listarRegistrosEvento(eventoId: string): Promise<RegistroEvento[]> {
  await exigirMiembroConsejo()
  if (!z.uuid().safeParse(eventoId).success) return []

  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase
    .from("registros_evento")
    .select("id, folio, nombre, correo, telefono, organizacion, es_miembro, monto, estado, created_at")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: false })
    .limit(2000)

  if (error) throw new Error(`No se pudieron cargar los registros: ${error.message}`)
  return (data ?? []).map((registro) => ({ ...registro, monto: Number(registro.monto) })) as RegistroEvento[]
}
