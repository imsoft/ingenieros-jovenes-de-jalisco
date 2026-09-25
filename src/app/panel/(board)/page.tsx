import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, InboxIcon } from "lucide-react"
import { cn } from "cn"

import { ApplicationStatusBadge } from "@/components/panel/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { countApplicationsByStatus, listApplications } from "@/lib/panel/applications"
import { formatDate, getFirstName } from "@/lib/panel/format"
import { requireBoardMember } from "@/lib/panel/session"
import { applicationStatuses, applicationStatusLabels } from "@/lib/panel/statuses"

export const metadata: Metadata = { title: "Resumen" }

export default async function PanelOverviewPage() {
  const member = await requireBoardMember()
  const [counts, { applications: pendingApplications }] = await Promise.all([
    countApplicationsByStatus(),
    listApplications({ status: "pending", limit: 5 }),
  ])

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">
          Hola, {getFirstName(member.name)}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {counts.pending === 0
            ? "No hay solicitudes pendientes por revisar."
            : `Hay ${counts.pending} ${counts.pending === 1 ? "solicitud pendiente" : "solicitudes pendientes"} por revisar.`}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {applicationStatuses.map((status) => (
          <li key={status}>
            <Link
              href={`/panel/solicitudes?status=${status}`}
              className={cn(
                "group flex h-full flex-col gap-3 rounded-3xl p-6 ring-1 transition-shadow hover:shadow-lg",
                status === "pending" ? "bg-brand-blue text-white ring-brand-blue" : "bg-white ring-brand-blue/10 hover:shadow-brand-blue/10"
              )}
            >
              <span className={cn("text-sm font-medium", status === "pending" ? "text-white/75" : "text-muted-foreground")}>
                {applicationStatusLabels[status].plural}
              </span>
              <span className={cn("font-heading text-5xl leading-none font-bold tabular-nums", status !== "pending" && "text-brand-blue")}>
                {counts[status]}
              </span>
              <span className={cn("mt-auto flex items-center gap-1 text-sm font-medium", status === "pending" ? "text-white" : "text-brand-blue")}>
                Ver solicitudes
                <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-heading" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-heading" className="font-heading text-xl font-semibold text-brand-blue uppercase">
            Pendientes más recientes
          </h2>
          {pendingApplications.length > 0 ? (
            <Link
              href="/panel/solicitudes?status=pending"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-9")}
            >
              Ver todas
            </Link>
          ) : null}
        </div>

        {pendingApplications.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-secondary px-6 py-10 text-center">
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Todo al día. Las nuevas solicitudes aparecerán aquí.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-brand-blue/10">
            {pendingApplications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/panel/solicitudes/${application.id}`}
                  className="flex flex-col gap-1 rounded-xl px-2 py-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{application.full_name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {application.municipality} · {application.email}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                    {formatDate(application.created_at)}
                    <ApplicationStatusBadge status={application.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
