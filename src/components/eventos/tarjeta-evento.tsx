import Image from "next/image"
import Link from "next/link"
import { CalendarDaysIcon, MapPinIcon, TicketIcon } from "lucide-react"
import { cn } from "cn"

import { DecoracionPuente } from "@/components/sitio/decoracion-puente"
import {
  formatearFechaLarga,
  formatearHora,
  partesFecha,
  textoPrecio,
  urlImagenEvento,
} from "@/lib/eventos/formato"
import { disponibilidadEvento, UMBRAL_ULTIMOS_LUGARES, type Evento } from "@/lib/eventos/tipos"

export function TarjetaEvento({ evento, pasado = false }: { evento: Evento; pasado?: boolean }) {
  const portada = urlImagenEvento(evento.portada_ruta)
  const { dia, mes } = partesFecha(evento.inicia_en)
  const disponibilidad = disponibilidadEvento(evento)

  const aviso =
    disponibilidad.estado === "lleno"
      ? "Cupo lleno"
      : disponibilidad.estado === "cerrado"
        ? "Registro cerrado"
        : disponibilidad.estado === "abierto" &&
            disponibilidad.restantes !== null &&
            disponibilidad.restantes <= UMBRAL_ULTIMOS_LUGARES
          ? "Últimos lugares"
          : null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-azul/10 transition-shadow duration-300 hover:shadow-xl hover:shadow-azul/10">
      <div className="relative aspect-16/10 overflow-hidden bg-azul">
        {portada ? (
          <Image
            src={portada}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105",
              pasado && "grayscale-[35%]"
            )}
          />
        ) : (
          <DecoracionPuente className="absolute -right-10 -bottom-6 w-[130%] max-w-none text-white opacity-15" />
        )}

        <div className="absolute top-4 left-4 flex min-w-14 flex-col items-center rounded-2xl bg-white px-3 py-2 text-center shadow-lg">
          <span className="font-heading text-2xl leading-none font-bold text-azul tabular-nums">{dia}</span>
          <span className="text-xs font-semibold text-naranja uppercase">{mes}</span>
        </div>

        {aviso && !pasado ? (
          <span
            className={cn(
              "absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold shadow",
              disponibilidad.estado === "abierto" ? "bg-naranja text-white" : "bg-azul-profundo/90 text-white"
            )}
          >
            {aviso}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-heading text-xl leading-tight font-semibold text-balance text-azul uppercase">
          <Link href={`/eventos/${evento.slug}`} className="rounded-sm after:absolute after:inset-0">
            {evento.titulo}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-foreground/70">{evento.resumen}</p>
        <ul className="mt-auto flex flex-col gap-1.5 pt-2 text-sm text-foreground/70">
          <li className="flex items-center gap-2">
            <CalendarDaysIcon className="size-4 shrink-0 text-naranja" aria-hidden />
            <span className="truncate">
              {formatearFechaLarga(evento.inicia_en)} · {formatearHora(evento.inicia_en)}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <MapPinIcon className="size-4 shrink-0 text-naranja" aria-hidden />
            <span className="truncate">{evento.lugar}</span>
          </li>
          {!pasado ? (
            <li className="flex items-center gap-2">
              <TicketIcon className="size-4 shrink-0 text-naranja" aria-hidden />
              <span className="truncate">{textoPrecio(evento)}</span>
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  )
}
