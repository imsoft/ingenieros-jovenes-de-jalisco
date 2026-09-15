import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "cn"

import { TarjetaEvento } from "@/components/eventos/tarjeta-evento"
import { EncabezadoSeccion } from "@/components/sitio/encabezado-seccion"
import { Revelar } from "@/components/sitio/revelar"
import { buttonVariants } from "@/components/ui/button"
import { listarEventosPublicos } from "@/lib/eventos/publico"

// Solo aparece en la portada cuando hay eventos próximos publicados.
export async function ProximosEventos() {
  const { proximos } = await listarEventosPublicos()
  if (proximos.length === 0) return null

  return (
    <section id="eventos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Revelar className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <EncabezadoSeccion antetitulo="Agenda" titulo="Próximos eventos" />
        <Link
          href="/eventos"
          className={cn(
            buttonVariants({ variant: "outline", size: "xl" }),
            "w-fit shrink-0 border-azul/20 text-azul hover:bg-azul/5 hover:text-azul"
          )}
        >
          Ver todos los eventos
          <ArrowRightIcon data-icon="inline-end" aria-hidden />
        </Link>
      </Revelar>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {proximos.slice(0, 3).map((evento, indice) => (
          <Revelar key={evento.id} como="li" retraso={indice * 90}>
            <TarjetaEvento evento={evento} />
          </Revelar>
        ))}
      </ul>
    </section>
  )
}
