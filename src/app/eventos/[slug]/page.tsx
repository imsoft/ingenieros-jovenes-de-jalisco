import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExternalLinkIcon,
  MapPinIcon,
  UsersRoundIcon,
} from "lucide-react"
import { cn } from "cn"

import { EventGallery } from "@/components/events/event-gallery"
import { EventRegistrationForm } from "@/components/events/event-registration-form"
import { JsonLd } from "@/components/seo/json-ld"
import { BridgeDecoration } from "@/components/site/bridge-decoration"
import { InstagramIcon } from "@/components/site/social-icons"
import { buttonVariants } from "@/components/ui/button"
import { site } from "@/content/site"
import { formatLongDate, formatPrice, formatTimeRange, getEventImageUrl } from "@/lib/events/format"
import { getEventBySlug } from "@/lib/events/public"
import { getEventAvailability, LAST_SPOTS_THRESHOLD } from "@/lib/events/types"
import { getEventStructuredData } from "@/lib/seo/structured-data"

export const revalidate = 60

// No prebuilt paths: each event is generated on its first visit and then cached (ISR).
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps<"/eventos/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return { title: "Evento no encontrado", robots: { index: false } }

  const cover = getEventImageUrl(event.cover_path)
  const image = cover
    ? { url: cover, alt: event.title }
    : { url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name}: ${site.tagline}` }

  return {
    title: event.title,
    description: event.summary,
    alternates: { canonical: `/eventos/${event.slug}` },
    openGraph: {
      type: "website",
      locale: "es_MX",
      url: `/eventos/${event.slug}`,
      siteName: site.name,
      title: `${event.title} | ${site.shortName}`,
      description: event.summary,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.summary,
      images: [image.url],
    },
  }
}

export default async function EventPage({ params }: PageProps<"/eventos/[slug]">) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const cover = getEventImageUrl(event.cover_path)
  const availability = getEventAvailability(event)
  const hasEnded = availability.status === "ended"
  const hasPrice = event.public_price !== null && event.public_price > 0
  const hasMemberPrice =
    hasPrice && event.member_price !== null && event.member_price !== event.public_price

  return (
    <>
      <JsonLd data={getEventStructuredData(event)} />

      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="-z-20 object-cover opacity-40"
          />
        ) : (
          <BridgeDecoration className="absolute -right-24 -bottom-10 -z-20 w-4xl max-w-none text-white opacity-[0.06]" />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-brand-navy via-brand-navy/85 to-brand-navy/40" />

        <div className="mx-auto max-w-6xl px-4 pt-8 pb-14 sm:px-6 lg:pt-12 lg:pb-20">
          <Link href="/eventos" className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Todos los eventos
          </Link>

          {hasEnded ? (
            <p className="mt-8 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest uppercase">
              Evento realizado
            </p>
          ) : null}

          <h1 className="mt-4 max-w-4xl font-heading text-4xl leading-[1.02] font-bold text-balance uppercase sm:text-5xl lg:text-6xl">
            {event.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-white/80">{event.summary}</p>

          <ul className="mt-8 flex flex-col gap-3 text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-8">
            <li className="flex items-center gap-2">
              <CalendarDaysIcon className="size-5 shrink-0 text-brand-orange" aria-hidden />
              {formatLongDate(event.starts_at)}
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="size-5 shrink-0 text-brand-orange" aria-hidden />
              {formatTimeRange(event)}
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="size-5 shrink-0 text-brand-orange" aria-hidden />
              {event.venue}
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:gap-14 lg:py-20">
        <div className="flex min-w-0 flex-col gap-12">
          {event.description ? (
            <section aria-labelledby="about-title">
              <h2 id="about-title" className="font-heading text-2xl font-semibold text-brand-blue uppercase">
                Acerca del evento
              </h2>
              <div className="mt-4 text-lg leading-relaxed break-words whitespace-pre-line text-foreground/80">
                {event.description}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="venue-title" className="rounded-3xl bg-secondary p-6 sm:p-8">
            <h2 id="venue-title" className="font-heading text-2xl font-semibold text-brand-blue uppercase">
              Cómo llegar
            </h2>
            <p className="mt-3 text-lg font-medium">{event.venue}</p>
            {event.address ? <p className="mt-1 text-foreground/70">{event.address}</p> : null}
            {event.map_url ? (
              <a
                href={event.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "xl" }), "mt-5 bg-white")}
              >
                <MapPinIcon data-icon="inline-start" aria-hidden />
                Ver en el mapa
                <ExternalLinkIcon data-icon="inline-end" aria-hidden />
              </a>
            ) : null}
          </section>

          <EventGallery photos={event.photos} title={event.title} />
        </div>

        <aside id="registro" aria-labelledby="registration-title" className="lg:sticky lg:top-24">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-brand-blue/5 ring-brand-blue/10 sm:p-8">
            <h2 id="registration-title" className="font-heading text-2xl font-semibold text-brand-blue uppercase">
              {hasEnded ? "Gracias por acompañarnos" : "Registro"}
            </h2>

            {!hasEnded ? (
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary p-4">
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {hasMemberPrice ? "Público" : "Entrada"}
                  </dt>
                  <dd className="mt-1 font-heading text-2xl font-bold text-brand-blue tabular-nums">
                    {hasPrice ? formatPrice(event.public_price!) : "Libre"}
                  </dd>
                </div>
                {hasMemberPrice ? (
                  <div className="rounded-2xl bg-brand-orange/10 p-4">
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Miembros</dt>
                    <dd className="mt-1 font-heading text-2xl font-bold text-brand-blue tabular-nums">
                      {formatPrice(event.member_price!)}
                    </dd>
                  </div>
                ) : availability.status === "open" && availability.remaining !== null ? (
                  <div className="rounded-2xl bg-secondary p-4">
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Lugares</dt>
                    <dd className="mt-1 font-heading text-2xl font-bold text-brand-blue tabular-nums">{availability.remaining}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {availability.status === "open" && availability.remaining !== null && hasMemberPrice ? (
              <p
                className={cn(
                  "mt-4 flex items-center gap-2 text-sm",
                  availability.remaining <= LAST_SPOTS_THRESHOLD ? "font-semibold text-brand-orange" : "text-muted-foreground"
                )}
              >
                <UsersRoundIcon className="size-4" aria-hidden />
                {availability.remaining === 1 ? "Queda 1 lugar" : `Quedan ${availability.remaining} lugares`}
              </p>
            ) : null}

            <div className="mt-6">
              {availability.status === "open" ? (
                <EventRegistrationForm eventId={event.id} slug={event.slug} />
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="leading-relaxed text-foreground/75">
                    {availability.status === "full"
                      ? "El cupo de este evento ya está lleno. Síguenos en redes por si se liberan lugares o para enterarte del próximo."
                      : availability.status === "closed"
                        ? "El registro en línea para este evento ya está cerrado."
                        : "Este evento ya se realizó. Mira las fotos y entérate del siguiente en nuestras redes."}
                  </p>
                  <a
                    href={site.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "accent", size: "xl" })}
                  >
                    <InstagramIcon className="size-5" />
                    Seguir en Instagram
                  </a>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
