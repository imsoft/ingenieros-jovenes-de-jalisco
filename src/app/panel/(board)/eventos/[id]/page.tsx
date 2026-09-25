import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CircleCheckIcon, ExternalLinkIcon, Trash2Icon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { deleteEvent, deleteGalleryPhoto } from "@/actions/panel-events"
import { ConfirmButton } from "@/components/panel/confirm-button"
import { EventForm } from "@/components/panel/event-form"
import { CoverImageUpload, GalleryUpload } from "@/components/panel/image-upload"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getEventImageUrl } from "@/lib/events/format"
import { eventToFormValues } from "@/lib/events/form"
import { getPanelEvent } from "@/lib/panel/events"
import { requireBoardMember } from "@/lib/panel/session"

export const metadata: Metadata = { title: "Editar evento" }

export default async function EditEventPage({ params, searchParams }: PageProps<"/panel/eventos/[id]">) {
  const [{ id }, { created }, member] = await Promise.all([params, searchParams, requireBoardMember()])
  const event = await getPanelEvent(id)
  if (!event) notFound()

  const cover = getEventImageUrl(event.cover_path)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/eventos" className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-brand-blue hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver a eventos
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("h-6 px-2.5", event.is_published ? "bg-brand-blue/10 text-brand-blue" : "bg-muted text-muted-foreground")}>
              {event.is_published ? "Publicado" : "Borrador"}
            </Badge>
            {!event.registration_open ? <Badge className="h-6 bg-brand-orange/15 px-2.5 text-foreground">Registro cerrado</Badge> : null}
          </div>
          <h1 className="mt-3 font-heading text-3xl font-bold break-words text-brand-blue uppercase sm:text-4xl">{event.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/panel/eventos/${event.id}/registros`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}>
            <UsersRoundIcon data-icon="inline-start" aria-hidden />
            Registros ({event.spots_taken})
          </Link>
          {event.is_published ? (
            <a
              href={`/eventos/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}
            >
              Ver en el sitio
              <ExternalLinkIcon data-icon="inline-end" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      {created === "1" ? (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-brand-blue/10 px-4 py-3 text-sm text-brand-blue">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Evento creado. Agrega una portada para que luzca en el sitio{event.is_published ? "" : " y publícalo cuando esté listo"}.
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="details-title" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10 sm:p-8">
          <h2 id="details-title" className="sr-only">
            Datos del evento
          </h2>
          <EventForm eventId={event.id} initialValues={eventToFormValues(event)} />
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="cover-title" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10">
            <h2 id="cover-title" className="font-heading text-lg font-semibold text-brand-blue uppercase">
              Portada
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Horizontal, idealmente 1600 × 1000 px. JPG, PNG o WebP de hasta 5 MB.</p>
            <CoverImageUpload eventId={event.id} coverUrl={cover} title={event.title} />
          </section>

          <section aria-labelledby="gallery-title" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10">
            <h2 id="gallery-title" className="font-heading text-lg font-semibold text-brand-blue uppercase">
              Galería
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Fotos del evento para su página y el archivo de eventos anteriores.</p>
            <GalleryUpload eventId={event.id} />
            {event.photos.length > 0 ? (
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {event.photos.map((photo, index) => {
                  const url = getEventImageUrl(photo.path)
                  return (
                    <li key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                      {url ? (
                        <Image src={url} alt={`Foto ${index + 1} de ${event.title}`} fill sizes="(min-width: 1024px) 10vw, 33vw" className="object-cover" />
                      ) : null}
                      <div className="absolute top-1.5 right-1.5">
                        <ConfirmButton
                          action={deleteGalleryPhoto.bind(null, photo.id)}
                          title="¿Quitar esta foto?"
                          description="Se borrará de la galería del evento."
                          confirmLabel="Quitar foto"
                          ariaLabel={`Quitar foto ${index + 1}`}
                          variant="secondary"
                          size="icon-sm"
                          className="bg-white/90 text-destructive shadow"
                        >
                          <Trash2Icon />
                        </ConfirmButton>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </section>

          {member.role === "admin" ? (
            <section aria-labelledby="delete-title" className="rounded-3xl bg-white p-6 ring-1 ring-destructive/20">
              <h2 id="delete-title" className="font-heading text-lg font-semibold text-destructive uppercase">
                Eliminar evento
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Solo se pueden eliminar eventos sin registros. Si ya tiene registros, despublícalo para ocultarlo.
              </p>
              <ConfirmButton
                action={deleteEvent.bind(null, event.id)}
                title="¿Eliminar este evento?"
                description="Se borrarán el evento, su portada y sus fotos. Esta acción no se puede deshacer."
                confirmLabel="Eliminar evento"
                variant="destructive"
                size="lg"
                className="h-10"
              >
                <Trash2Icon data-icon="inline-start" aria-hidden />
                Eliminar evento
              </ConfirmButton>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
