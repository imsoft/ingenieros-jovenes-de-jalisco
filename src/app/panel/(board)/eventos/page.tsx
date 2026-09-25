import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDaysIcon, CalendarPlusIcon, MapPinIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import { formatLongDate, formatTime } from "@/lib/events/format"
import { getEventEnd, type Event } from "@/lib/events/types"
import { listPanelEvents } from "@/lib/panel/events"

export const metadata: Metadata = { title: "Eventos" }

export default async function PanelEventsPage() {
  const events = await listPanelEvents()
  const now = new Date()

  const groups = [
    {
      id: "drafts",
      title: "Borradores",
      description: "No se ven en el sitio hasta que los publiques.",
      events: events.filter((event) => !event.is_published),
    },
    {
      id: "upcoming",
      title: "Próximos",
      description: "Publicados y por realizarse.",
      events: events.filter((event) => event.is_published && getEventEnd(event) >= now).reverse(),
    },
    {
      id: "past",
      title: "Realizados",
      description: "Súbeles fotos para que luzcan en el archivo de eventos.",
      events: events.filter((event) => event.is_published && getEventEnd(event) < now),
    },
  ].filter((group) => group.events.length > 0)

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Eventos</h1>
          <p className="mt-2 text-muted-foreground">Crea eventos, abre el registro y da seguimiento a los asistentes.</p>
        </div>
        <Link href="/panel/eventos/nuevo" className={cn(buttonVariants({ variant: "accent", size: "xl" }), "w-fit")}>
          <CalendarPlusIcon data-icon="inline-start" aria-hidden />
          Nuevo evento
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-brand-blue/10">
          <CalendarDaysIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Aún no hay eventos</p>
          <p className="max-w-sm text-sm text-muted-foreground">Crea el primero; puedes guardarlo como borrador y publicarlo cuando esté listo.</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`} className="flex items-center gap-3 font-heading text-xl font-semibold text-brand-blue uppercase">
              {group.title}
              <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-medium text-muted-foreground tabular-nums ring-1 ring-brand-blue/10">
                {group.events.length}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {group.events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function EventRow({ event }: { event: Event }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-brand-blue/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href={`/panel/eventos/${event.id}`} className="font-heading text-lg leading-tight font-semibold break-words text-brand-blue uppercase hover:underline">
          {event.title}
        </Link>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon className="size-4" aria-hidden />
            {formatLongDate(event.starts_at)} · {formatTime(event.starts_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-4" aria-hidden />
            {event.venue}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <UsersRoundIcon className="size-4" aria-hidden />
            {event.spots_taken}
            {event.capacity !== null ? ` / ${event.capacity}` : ""} registrados
          </span>
          {event.is_published && !event.registration_open ? <span className="font-medium text-foreground/70">Registro cerrado</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link href={`/panel/eventos/${event.id}/registros`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10")}>
          Registros
        </Link>
        <Link href={`/panel/eventos/${event.id}`} className={cn(buttonVariants({ size: "lg" }), "h-10")}>
          Editar
        </Link>
      </div>
    </li>
  )
}
