import { ZONA_HORARIA } from "@/lib/eventos/formato"
import type { Evento } from "@/lib/eventos/tipos"

// El centro de México usa UTC-6 todo el año (sin horario de verano desde 2022).
const DESFASE_MEXICO = "-06:00"

export function isoDesdeHoraLocal(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00${DESFASE_MEXICO}`).toISOString()
}

const formatoPartes = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA_HORARIA,
})

export function horaLocalDesdeIso(iso: string) {
  const partes = Object.fromEntries(
    formatoPartes.formatToParts(new Date(iso)).map(({ type, value }) => [type, value])
  )
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` }
}

// "Jalisco al Grito 2026" → "jalisco-al-grito-2026"
export function generarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "")
}

export type ValoresEvento = {
  titulo: string
  slug: string
  resumen: string
  descripcion: string
  fecha: string
  horaInicio: string
  horaFin: string
  lugar: string
  direccion: string
  mapaUrl: string
  precioPublico: string
  precioMiembro: string
  cupo: string
  instruccionesPago: string
  registroAbierto: boolean
  publicado: boolean
}

export const valoresEventoVacio: ValoresEvento = {
  titulo: "",
  slug: "",
  resumen: "",
  descripcion: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  lugar: "",
  direccion: "",
  mapaUrl: "",
  precioPublico: "",
  precioMiembro: "",
  cupo: "",
  instruccionesPago: "",
  registroAbierto: true,
  publicado: false,
}

export function valoresDesdeEvento(evento: Evento): ValoresEvento {
  const inicio = horaLocalDesdeIso(evento.inicia_en)
  return {
    titulo: evento.titulo,
    slug: evento.slug,
    resumen: evento.resumen,
    descripcion: evento.descripcion,
    fecha: inicio.fecha,
    horaInicio: inicio.hora,
    horaFin: evento.termina_en ? horaLocalDesdeIso(evento.termina_en).hora : "",
    lugar: evento.lugar,
    direccion: evento.direccion ?? "",
    mapaUrl: evento.mapa_url ?? "",
    precioPublico: evento.precio_publico?.toString() ?? "",
    precioMiembro: evento.precio_miembro?.toString() ?? "",
    cupo: evento.cupo?.toString() ?? "",
    instruccionesPago: evento.instrucciones_pago ?? "",
    registroAbierto: evento.registro_abierto,
    publicado: evento.publicado,
  }
}
