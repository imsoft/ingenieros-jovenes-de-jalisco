// Tipos y reglas de los eventos, seguros para servidor y cliente.

export type Evento = {
  id: string
  slug: string
  titulo: string
  resumen: string
  descripcion: string
  inicia_en: string
  termina_en: string | null
  lugar: string
  direccion: string | null
  mapa_url: string | null
  precio_publico: number | null
  precio_miembro: number | null
  cupo: number | null
  lugares_ocupados: number
  instrucciones_pago: string | null
  portada_ruta: string | null
  registro_abierto: boolean
  publicado: boolean
  created_at: string
  updated_at: string
}

export type FotoEvento = {
  id: string
  evento_id: string
  ruta: string
  orden: number
}

export type EventoConFotos = Evento & { fotos: FotoEvento[] }

export const COLUMNAS_EVENTO =
  "id, slug, titulo, resumen, descripcion, inicia_en, termina_en, lugar, direccion, mapa_url, precio_publico, precio_miembro, cupo, lugares_ocupados, instrucciones_pago, portada_ruta, registro_abierto, publicado, created_at, updated_at"

// Si no se indica hora de término, un evento se considera en curso hasta 6 horas después de iniciar.
const DURACION_SUPUESTA_MS = 6 * 60 * 60 * 1000

export function finDelEvento(evento: Pick<Evento, "inicia_en" | "termina_en">) {
  return evento.termina_en
    ? new Date(evento.termina_en)
    : new Date(new Date(evento.inicia_en).getTime() + DURACION_SUPUESTA_MS)
}

export function yaTermino(evento: Pick<Evento, "inicia_en" | "termina_en">, ahora = new Date()) {
  return finDelEvento(evento) < ahora
}

export type Disponibilidad =
  | { estado: "abierto"; restantes: number | null }
  | { estado: "lleno" }
  | { estado: "cerrado" }
  | { estado: "finalizado" }

export const UMBRAL_ULTIMOS_LUGARES = 10

export function disponibilidadEvento(evento: Evento, ahora = new Date()): Disponibilidad {
  if (yaTermino(evento, ahora)) return { estado: "finalizado" }
  if (!evento.registro_abierto || new Date(evento.inicia_en) <= ahora) return { estado: "cerrado" }
  if (evento.cupo !== null && evento.lugares_ocupados >= evento.cupo) return { estado: "lleno" }
  return {
    estado: "abierto",
    restantes: evento.cupo === null ? null : evento.cupo - evento.lugares_ocupados,
  }
}
