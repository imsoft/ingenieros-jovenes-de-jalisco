import type { Metadata } from "next"
import { CalendarHeartIcon } from "lucide-react"

import { EventCard } from "@/components/events/event-card"
import { BridgeDecoration } from "@/components/site/bridge-decoration"
import { Reveal } from "@/components/site/reveal"
import { InstagramIcon } from "@/components/site/social-icons"
import { buttonVariants } from "@/components/ui/button"
import { site } from "@/content/site"
import { listPublicEvents } from "@/lib/events/public"

// Regenerated every minute; the panel also refreshes it when an event is published or edited.
export const revalidate = 60

const description =
  "Próximos eventos del Colectivo de Ingenieros Jóvenes de Jalisco: networking, conferencias y convivencias del gremio en Guadalajara y todo Jalisco."

export const metadata: Metadata = {
  title: "Eventos",
  description,
  alternates: { canonical: "/eventos" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/eventos",
    siteName: site.name,
    title: `Eventos | ${site.shortName}`,
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name}: ${site.tagline}` }],
  },
}

export default async function EventsPage() {
  const { upcoming, past } = await listPublicEvents()

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
        <BridgeDecoration className="absolute -right-24 -bottom-10 -z-10 w-4xl max-w-none text-white opacity-[0.06]" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="flex items-center gap-3 text-sm font-semibold tracking-widest text-brand-orange uppercase">
            <span aria-hidden className="h-px w-8 bg-brand-orange" />
            Agenda del Colectivo
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-[1.02] font-bold text-balance uppercase sm:text-6xl">
            Eventos
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-white/75">
            Encuentros para conectar con otros ingenieros, aprender y celebrar al gremio. Regístrate en línea y,
            si eres miembro, obtén tu precio preferente.
          </p>
        </div>
      </section>

      <section aria-labelledby="upcoming-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="upcoming-title" className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">
          Próximos eventos
        </h2>

        {upcoming.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-secondary px-6 py-14 text-center">
            <CalendarHeartIcon className="size-10 text-brand-orange" aria-hidden />
            <p className="font-heading text-xl font-semibold text-brand-blue uppercase">Muy pronto anunciaremos el siguiente</p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Síguenos en redes para enterarte primero de las convocatorias.
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
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event, index) => (
              <Reveal key={event.id} as="li" delay={index * 80}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section aria-labelledby="past-title" className="bg-secondary">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 id="past-title" className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">
              Eventos anteriores
            </h2>
            <p className="mt-2 text-muted-foreground">Así hemos construido comunidad.</p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, index) => (
                <Reveal key={event.id} as="li" delay={Math.min(index, 5) * 60}>
                  <EventCard event={event} past />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}
