import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDaysIcon, CalendarPlusIcon, MapPinIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import { formatearFechaLarga, formatearHora } from "@/lib/eventos/formato"
import { finDelEvento, type Evento } from "@/lib/eventos/tipos"
import { listarEventosPanel } from "@/lib/panel/eventos"

export const metadata: Metadata = { title: "Eventos" }

export default async function EventosPanel() {
  const eventos = await listarEventosPanel()
  const ahora = new Date()

  const grupos = [
    {
      id: "borradores",
      titulo: "Borradores",
      descripcion: "No se ven en el sitio hasta que los publiques.",
      eventos: eventos.filter((evento) => !evento.publicado),
    },
    {
      id: "proximos",
      titulo: "Próximos",
      descripcion: "Publicados y por realizarse.",
      eventos: eventos.filter((evento) => evento.publicado && finDelEvento(evento) >= ahora).reverse(),
    },
    {
      id: "realizados",
      titulo: "Realizados",
      descripcion: "Súbeles fotos para que luzcan en el archivo de eventos.",
      eventos: eventos.filter((evento) => evento.publicado && finDelEvento(evento) < ahora),
    },
  ].filter((grupo) => grupo.eventos.length > 0)

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">Eventos</h1>
          <p className="mt-2 text-muted-foreground">Crea eventos, abre el registro y da seguimiento a los asistentes.</p>
        </div>
        <Link href="/panel/eventos/nuevo" className={cn(buttonVariants({ variant: "acento", size: "xl" }), "w-fit")}>
          <CalendarPlusIcon data-icon="inline-start" aria-hidden />
          Nuevo evento
        </Link>
      </div>

      {grupos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-azul/10">
          <CalendarDaysIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Aún no hay eventos</p>
          <p className="max-w-sm text-sm text-muted-foreground">Crea el primero; puedes guardarlo como borrador y publicarlo cuando esté listo.</p>
        </div>
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.id} aria-labelledby={`grupo-${grupo.id}`}>
            <h2 id={`grupo-${grupo.id}`} className="flex items-center gap-3 font-heading text-xl font-semibold text-azul uppercase">
              {grupo.titulo}
              <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-medium text-muted-foreground tabular-nums ring-1 ring-azul/10">
                {grupo.eventos.length}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{grupo.descripcion}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {grupo.eventos.map((evento) => (
                <FilaEvento key={evento.id} evento={evento} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

function FilaEvento({ evento }: { evento: Evento }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-azul/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href={`/panel/eventos/${evento.id}`} className="font-heading text-lg leading-tight font-semibold break-words text-azul uppercase hover:underline">
          {evento.titulo}
        </Link>
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon className="size-4" aria-hidden />
            {formatearFechaLarga(evento.inicia_en)} · {formatearHora(evento.inicia_en)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-4" aria-hidden />
            {evento.lugar}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <UsersRoundIcon className="size-4" aria-hidden />
            {evento.lugares_ocupados}
            {evento.cupo !== null ? ` / ${evento.cupo}` : ""} registrados
          </span>
          {evento.publicado && !evento.registro_abierto ? <span className="font-medium text-foreground/70">Registro cerrado</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link href={`/panel/eventos/${evento.id}/registros`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10")}>
          Registros
        </Link>
        <Link href={`/panel/eventos/${evento.id}`} className={cn(buttonVariants({ size: "lg" }), "h-10")}>
          Editar
        </Link>
      </div>
    </li>
  )
}
