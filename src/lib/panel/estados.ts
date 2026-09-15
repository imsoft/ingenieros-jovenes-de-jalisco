export const estadosSolicitud = ["pendiente", "aprobada", "rechazada"] as const

export type EstadoSolicitud = (typeof estadosSolicitud)[number]

export type FiltroEstado = EstadoSolicitud | "todas"

export const etiquetasEstado: Record<EstadoSolicitud, { singular: string; plural: string }> = {
  pendiente: { singular: "Pendiente", plural: "Pendientes" },
  aprobada: { singular: "Aprobada", plural: "Aprobadas" },
  rechazada: { singular: "Rechazada", plural: "Rechazadas" },
}

export function esEstadoSolicitud(valor: unknown): valor is EstadoSolicitud {
  return typeof valor === "string" && (estadosSolicitud as readonly string[]).includes(valor)
}

export function leerFiltroEstado(valor: unknown): FiltroEstado {
  if (valor === "todas") return "todas"
  return esEstadoSolicitud(valor) ? valor : "pendiente"
}
