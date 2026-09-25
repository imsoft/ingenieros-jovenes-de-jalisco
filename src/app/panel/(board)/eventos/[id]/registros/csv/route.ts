import { registrationStatusLabels } from "@/lib/events/registrations"
import { getPanelEvent, listEventRegistrations } from "@/lib/panel/events"
import { formatDate } from "@/lib/panel/format"
import { getPanelAccess } from "@/lib/panel/session"

// Escapes each cell and neutralizes formulas so Excel never runs content entered by attendees.
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(_request: Request, { params }: RouteContext<"/panel/eventos/[id]/registros/csv">) {
  const access = await getPanelAccess()
  if (access.kind !== "member") return new Response("No autorizado", { status: 401 })

  const { id } = await params
  const [event, registrations] = await Promise.all([getPanelEvent(id), listEventRegistrations(id)])
  if (!event) return new Response("Evento no encontrado", { status: 404 })

  const headers = ["Folio", "Nombre", "Correo", "Teléfono", "Empresa o universidad", "Tipo", "Monto", "Estado", "Registrado"]
  const rows = registrations.map((registration) => [
    registration.confirmation_code,
    registration.full_name,
    registration.email,
    registration.phone,
    registration.organization ?? "",
    registration.is_member ? "Miembro" : "Público",
    registration.amount_due.toFixed(2),
    registrationStatusLabels[registration.status],
    formatDate(registration.created_at),
  ])

  // BOM so Excel recognizes accented characters.
  const csv = "﻿" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registros-${event.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  })
}
