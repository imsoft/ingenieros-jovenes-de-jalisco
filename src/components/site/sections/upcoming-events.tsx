import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "cn"

import { EventCard } from "@/components/events/event-card"
import { SectionHeading } from "@/components/site/section-heading"
import { Reveal } from "@/components/site/reveal"
import { buttonVariants } from "@/components/ui/button"
import { listPublicEvents } from "@/lib/events/public"

// Only shown on the home page when there are published upcoming events.
export async function UpcomingEvents() {
  const { upcoming } = await listPublicEvents()
  if (upcoming.length === 0) return null

  return (
    <section id="eventos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Agenda" title="Próximos eventos" />
        <Link
          href="/eventos"
          className={cn(
            buttonVariants({ variant: "outline", size: "xl" }),
            "w-fit shrink-0 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
          )}
        >
          Ver todos los eventos
          <ArrowRightIcon data-icon="inline-end" aria-hidden />
        </Link>
      </Reveal>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.slice(0, 3).map((event, index) => (
          <Reveal key={event.id} as="li" delay={index * 90}>
            <EventCard event={event} />
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
