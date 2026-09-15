export const estadosRegistro = ["pendiente_pago", "pagado", "cancelado"] as const

export type EstadoRegistro = (typeof estadosRegistro)[number]

export const etiquetasRegistro: Record<EstadoRegistro, string> = {
  pendiente_pago: "Pago pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
}

export function esEstadoRegistro(valor: unknown): valor is EstadoRegistro {
  return typeof valor === "string" && (estadosRegistro as readonly string[]).includes(valor)
}

export type RegistroEvento = {
  id: string
  folio: string
  nombre: string
  correo: string
  telefono: string
  organizacion: string | null
  es_miembro: boolean
  monto: number
  estado: EstadoRegistro
  created_at: string
}
