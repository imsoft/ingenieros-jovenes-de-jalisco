import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, DownloadIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { updateRegistrationStatus } from "@/actions/panel-events"
import { RegistrationStatusBadge } from "@/components/panel/registration-badge"
import { SubmitButton } from "@/components/panel/submit-button"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount, formatLongDate, formatPrice } from "@/lib/events/format"
import type { EventRegistration, RegistrationStatus } from "@/lib/events/registrations"
import { getPanelEvent, listEventRegistrations } from "@/lib/panel/events"
import { formatDate } from "@/lib/panel/format"

export const metadata: Metadata = { title: "Registros del evento" }

export default async function EventRegistrationsPage({ params }: PageProps<"/panel/eventos/[id]/registros">) {
  const { id } = await params
  const [event, registrations] = await Promise.all([getPanelEvent(id), listEventRegistrations(id)])
  if (!event) notFound()

  const active = registrations.filter((registration) => registration.status !== "cancelled")
  const paid = active.filter((registration) => registration.status === "paid")
  const pending = active.filter((registration) => registration.status === "pending_payment")
  const sum = (list: EventRegistration[]) => list.reduce((total, registration) => total + registration.amount_due, 0)

  const summary = [
    { label: "Registrados", value: `${active.length}${event.capacity !== null ? ` / ${event.capacity}` : ""}` },
    { label: "Miembros", value: String(active.filter((registration) => registration.is_member).length) },
    { label: "Cobrado", value: formatAmount(sum(paid)) },
    { label: "Por cobrar", value: formatAmount(sum(pending)) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/panel/eventos/${event.id}`} className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-brand-blue hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver al evento
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold break-words text-brand-blue uppercase sm:text-4xl">Registros</h1>
          <p className="mt-2 text-muted-foreground">
            {event.title} · {formatLongDate(event.starts_at)}
          </p>
        </div>
        {registrations.length > 0 ? (
          <a
            href={`/panel/eventos/${event.id}/registros/csv`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-fit bg-white")}
          >
            <DownloadIcon data-icon="inline-start" aria-hidden />
            Descargar CSV
          </a>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-5 ring-1 ring-brand-blue/10">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 font-heading text-3xl font-bold text-brand-blue tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      {registrations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-brand-blue/10">
          <UsersRoundIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Todavía no hay registros</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {event.is_published ? "Comparte la página del evento para empezar a recibirlos." : "Publica el evento para abrir el registro."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl bg-white ring-1 ring-brand-blue/10 lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Folio</TableHead>
                  <TableHead>Asistente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id} className={cn(registration.status === "cancelled" && "opacity-60")}>
                    <TableCell className="py-4 pl-6 font-mono text-sm font-semibold">{registration.confirmation_code}</TableCell>
                    <TableCell className="max-w-72">
                      <span className="block truncate font-medium">{registration.full_name}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {registration.email} · {registration.phone}
                      </span>
                      {registration.organization ? <span className="block truncate text-xs text-muted-foreground">{registration.organization}</span> : null}
                      <span className="block text-xs text-muted-foreground">{formatDate(registration.created_at)}</span>
                    </TableCell>
                    <TableCell>{registration.is_member ? "Miembro" : "Público"}</TableCell>
                    <TableCell className="tabular-nums">{formatPrice(registration.amount_due)}</TableCell>
                    <TableCell>
                      <RegistrationStatusBadge status={registration.status} />
                    </TableCell>
                    <TableCell className="pr-6">
                      <RegistrationActions registration={registration} eventId={event.id} className="justify-end" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 lg:hidden">
            {registrations.map((registration) => (
              <li key={registration.id} className={cn("flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-blue/10", registration.status === "cancelled" && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{registration.full_name}</p>
                    <p className="truncate text-sm text-muted-foreground">{registration.email}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{registration.phone}</p>
                  </div>
                  <RegistrationStatusBadge status={registration.status} />
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="font-mono font-semibold">{registration.confirmation_code}</span>
                  <span>{registration.is_member ? "Miembro" : "Público"}</span>
                  <span className="tabular-nums">{formatPrice(registration.amount_due)}</span>
                </p>
                <RegistrationActions registration={registration} eventId={event.id} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const actionsByStatus: Record<
  RegistrationStatus,
  { status: RegistrationStatus; label: string; variant: "default" | "outline" | "ghost" }[]
> = {
  pending_payment: [
    { status: "paid", label: "Marcar pagado", variant: "default" },
    { status: "cancelled", label: "Cancelar", variant: "ghost" },
  ],
  paid: [
    { status: "pending_payment", label: "Marcar pendiente", variant: "outline" },
    { status: "cancelled", label: "Cancelar", variant: "ghost" },
  ],
  cancelled: [{ status: "pending_payment", label: "Reactivar", variant: "outline" }],
}

function RegistrationActions({
  registration,
  eventId,
  className,
}: {
  registration: EventRegistration
  eventId: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actionsByStatus[registration.status].map((action) => (
        <form key={action.status} action={updateRegistrationStatus.bind(null, registration.id, eventId, action.status)}>
          <SubmitButton variant={action.variant} size="sm" className="h-8 px-3">
            {action.label}
          </SubmitButton>
        </form>
      ))}
    </div>
  )
}
