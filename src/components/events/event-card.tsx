import Image from "next/image"
import Link from "next/link"
import { CalendarDaysIcon, MapPinIcon, TicketIcon } from "lucide-react"
import { cn } from "cn"

import { BridgeDecoration } from "@/components/site/bridge-decoration"
import { formatLongDate, formatTime, getDateParts, getEventImageUrl, getPriceLabel } from "@/lib/events/format"
import { getEventAvailability, LAST_SPOTS_THRESHOLD, type Event } from "@/lib/events/types"

export function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const cover = getEventImageUrl(event.cover_path)
  const { day, month } = getDateParts(event.starts_at)
  const availability = getEventAvailability(event)

  const notice =
    availability.status === "full"
      ? "Cupo lleno"
      : availability.status === "closed"
        ? "Registro cerrado"
        : availability.status === "open" &&
            availability.remaining !== null &&
            availability.remaining <= LAST_SPOTS_THRESHOLD
          ? "Últimos lugares"
          : null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-brand-blue/10 transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-blue/10">
      <div className="relative aspect-16/10 overflow-hidden bg-brand-blue">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105",
              past && "grayscale-[35%]"
            )}
          />
        ) : (
          <BridgeDecoration className="absolute -right-10 -bottom-6 w-[130%] max-w-none text-white opacity-15" />
        )}

        <div className="absolute top-4 left-4 flex min-w-14 flex-col items-center rounded-2xl bg-white px-3 py-2 text-center shadow-lg">
          <span className="font-heading text-2xl leading-none font-bold text-brand-blue tabular-nums">{day}</span>
          <span className="text-xs font-semibold text-brand-orange uppercase">{month}</span>
        </div>

        {notice && !past ? (
          <span
            className={cn(
              "absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold shadow",
              availability.status === "open" ? "bg-brand-orange text-white" : "bg-brand-navy/90 text-white"
            )}
          >
            {notice}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-heading text-xl leading-tight font-semibold text-balance text-brand-blue uppercase">
          <Link href={`/eventos/${event.slug}`} className="rounded-sm after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-foreground/70">{event.summary}</p>
        <ul className="mt-auto flex flex-col gap-1.5 pt-2 text-sm text-foreground/70">
          <li className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
            <span className="truncate">
              {formatLongDate(event.starts_at)} · {formatTime(event.starts_at)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <MapPinIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
            <span className="truncate">{event.venue}</span>
          </li>
          {!past ? (
            <li className="flex items-center gap-2">
              <TicketIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
              <span className="truncate">{getPriceLabel(event)}</span>
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  )
}
