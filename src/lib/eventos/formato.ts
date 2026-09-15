import type { Evento } from "@/lib/eventos/tipos"

// Guadalajara usa la hora del centro de México (sin horario de verano desde 2022).
export const ZONA_HORARIA = "America/Mexico_City"

const formatoFechaLarga = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA_HORARIA,
})

const formatoHora = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: ZONA_HORARIA,
})

const formatoDiaMes = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: ZONA_HORARIA,
})

const moneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatearFechaLarga(iso: string) {
  const texto = formatoFechaLarga.format(new Date(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatearHora(iso: string) {
  return formatoHora.format(new Date(iso))
}

export function formatearHorario(evento: Pick<Evento, "inicia_en" | "termina_en">) {
  const inicio = formatearHora(evento.inicia_en)
  return evento.termina_en ? `${inicio} a ${formatearHora(evento.termina_en)}` : inicio
}

export function partesFecha(iso: string) {
  const partes = formatoDiaMes.formatToParts(new Date(iso))
  return {
    dia: partes.find((parte) => parte.type === "day")?.value ?? "",
    mes: (partes.find((parte) => parte.type === "month")?.value ?? "").replace(".", ""),
  }
}

export function formatearPrecio(valor: number) {
  return valor === 0 ? "Gratis" : moneda.format(valor)
}

// Texto corto de precio para tarjetas: "Entrada libre", "$350" o "$350 · Miembros $300".
export function textoPrecio(evento: Pick<Evento, "precio_publico" | "precio_miembro">) {
  if (evento.precio_publico === null || evento.precio_publico === 0) return "Entrada libre"
  const publico = formatearPrecio(evento.precio_publico)
  if (evento.precio_miembro !== null && evento.precio_miembro < evento.precio_publico) {
    return `${publico} · Miembros ${formatearPrecio(evento.precio_miembro)}`
  }
  return publico
}

export function urlImagenEvento(ruta: string | null) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!ruta || !base) return null
  return `${base}/storage/v1/object/public/eventos/${ruta}`
}
