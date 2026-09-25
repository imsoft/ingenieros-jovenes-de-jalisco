export const applicationStatuses = ["pending", "approved", "rejected"] as const

export type ApplicationStatus = (typeof applicationStatuses)[number]

export type StatusFilter = ApplicationStatus | "all"

export const applicationStatusLabels: Record<ApplicationStatus, { singular: string; plural: string }> = {
  pending: { singular: "Pendiente", plural: "Pendientes" },
  approved: { singular: "Aprobada", plural: "Aprobadas" },
  rejected: { singular: "Rechazada", plural: "Rechazadas" },
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && (applicationStatuses as readonly string[]).includes(value)
}

export function parseStatusFilter(value: unknown): StatusFilter {
  if (value === "all") return "all"
  return isApplicationStatus(value) ? value : "pending"
}
