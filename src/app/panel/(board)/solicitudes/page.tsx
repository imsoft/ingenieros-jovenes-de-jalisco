import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { ChevronRightIcon, InboxIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

import { ApplicationStatusBadge } from "@/components/panel/status-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { countApplicationsByStatus, listApplications } from "@/lib/panel/applications"
import { formatDate } from "@/lib/panel/format"
import { applicationStatusLabels, parseStatusFilter, type StatusFilter } from "@/lib/panel/statuses"

export const metadata: Metadata = { title: "Solicitudes" }

export default async function ApplicationsPage({ searchParams }: PageProps<"/panel/solicitudes">) {
  const params = await searchParams
  const status = parseStatusFilter(params.status)
  const search = typeof params.q === "string" ? params.q.trim() : ""
  const before = typeof params.before === "string" ? params.before : undefined

  const [counts, { applications, nextCursor }] = await Promise.all([
    countApplicationsByStatus(),
    listApplications({ status, search, before }),
  ])

  const filters: { value: StatusFilter; label: string; total: number }[] = [
    { value: "pending", label: applicationStatusLabels.pending.plural, total: counts.pending },
    { value: "approved", label: applicationStatusLabels.approved.plural, total: counts.approved },
    { value: "rejected", label: applicationStatusLabels.rejected.plural, total: counts.rejected },
    { value: "all", label: "Todas", total: counts.pending + counts.approved + counts.rejected },
  ]

  const buildHref = (changes: { status?: StatusFilter; q?: string; before?: string }) => {
    const values = { status, q: search || undefined, before: undefined, ...changes }
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(values)) if (value) query.set(key, value)
    return `/panel/solicitudes?${query.toString()}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Solicitudes de afiliación</h1>
        <p className="mt-2 text-muted-foreground">Revisa y da seguimiento a quienes quieren unirse al Colectivo.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {filters.map((filter) => {
            const isActive = filter.value === status
            return (
              <Link
                key={filter.value}
                href={buildHref({ status: filter.value, q: search || undefined })}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors",
                  isActive ? "bg-brand-blue text-white ring-brand-blue" : "bg-white text-foreground/70 ring-brand-blue/10 hover:text-foreground"
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs tabular-nums",
                    isActive ? "bg-white/20" : "bg-secondary"
                  )}
                >
                  {filter.total}
                </span>
              </Link>
            )
          })}
        </nav>

        <Form action="/panel/solicitudes" className="flex w-full gap-2 lg:max-w-sm">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="search" className="sr-only">
            Buscar por nombre, correo o municipio
          </label>
          <Input
            id="search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Buscar nombre, correo o municipio…"
            autoComplete="off"
            className="h-10 rounded-xl bg-white px-4"
          />
          <Button type="submit" variant="outline" size="lg" className="h-10 bg-white px-3">
            <SearchIcon />
            <span className="sr-only">Buscar</span>
          </Button>
        </Form>
      </div>

      {search ? (
        <p className="text-sm text-muted-foreground">
          Resultados para “{search}”.{" "}
          <Link href={buildHref({ q: undefined })} className="font-medium text-brand-blue hover:underline">
            Quitar búsqueda
          </Link>
        </p>
      ) : null}

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-brand-blue/10">
          <InboxIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">No hay solicitudes en esta vista</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {search ? "Prueba con otro término de búsqueda o cambia el filtro." : "Cuando lleguen nuevas solicitudes aparecerán aquí."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-3xl bg-white ring-1 ring-brand-blue/10 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Solicitante</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Recibida</TableHead>
                  <TableHead className="pr-6">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id} className="relative">
                    <TableCell className="max-w-72 py-4 pl-6">
                      <Link
                        href={`/panel/solicitudes/${application.id}`}
                        className="block truncate font-medium text-brand-blue after:absolute after:inset-0 hover:underline"
                      >
                        {application.full_name}
                      </Link>
                      <span className="block truncate text-sm text-muted-foreground">{application.email}</span>
                    </TableCell>
                    <TableCell className="tabular-nums">{application.phone}</TableCell>
                    <TableCell>{application.municipality}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(application.created_at)}</TableCell>
                    <TableCell className="pr-6">
                      <ApplicationStatusBadge status={application.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <ul className="flex flex-col gap-3 md:hidden">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/panel/solicitudes/${application.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-blue/10 transition-shadow hover:shadow-md"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate font-medium text-brand-blue">{application.full_name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {application.municipality} · {formatDate(application.created_at)}
                    </span>
                    <ApplicationStatusBadge status={application.status} />
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {nextCursor || before ? (
        <div className="flex flex-wrap justify-center gap-2">
          {before ? (
            <Link href={buildHref({ before: undefined })} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}>
              Volver a las más recientes
            </Link>
          ) : null}
          {nextCursor ? (
            <Link href={buildHref({ before: nextCursor })} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}>
              Ver más antiguas
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
