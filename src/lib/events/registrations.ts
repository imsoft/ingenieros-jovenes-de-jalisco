export const registrationStatuses = ["pending_payment", "paid", "cancelled"] as const

export type RegistrationStatus = (typeof registrationStatuses)[number]

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  pending_payment: "Pago pendiente",
  paid: "Pagado",
  cancelled: "Cancelado",
}

export function isRegistrationStatus(value: unknown): value is RegistrationStatus {
  return typeof value === "string" && (registrationStatuses as readonly string[]).includes(value)
}

export type EventRegistration = {
  id: string
  confirmation_code: string
  full_name: string
  email: string
  phone: string
  organization: string | null
  is_member: boolean
  amount_due: number
  status: RegistrationStatus
  created_at: string
}
