import type { Metadata } from "next"
import { CalendarHeartIcon } from "lucide-react"

import { TarjetaEvento } from "@/components/eventos/tarjeta-evento"
import { DecoracionPuente } from "@/components/sitio/decoracion-puente"
import { IconoInstagram } from "@/components/sitio/iconos-redes"
import { Revelar } from "@/components/sitio/revelar"
import { buttonVariants } from "@/components/ui/button"
import { sitio } from "@/content/sitio"
import { listarEventosPublicos } from "@/lib/eventos/publico"

// Se regenera cada minuto; el panel además la refresca al publicar o editar un evento.
export const revalidate = 60

const descripcion =
  "Próximos eventos del Colectivo de Ingenieros Jóvenes de Jalisco: networking, conferencias y convivencias del gremio en Guadalajara y todo Jalisco."

export const metadata: Metadata = {
  title: "Eventos",
  description: descripcion,
  alternates: { canonical: "/eventos" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/eventos",
    siteName: sitio.nombre,
    title: `Eventos | ${sitio.nombreCorto}`,
    description: descripcion,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${sitio.nombre}: ${sitio.lema}` }],
  },
}

export default async function PaginaEventos() {
  const { proximos, anteriores } = await listarEventosPublicos()

  return (
    <>
      <section className="relative isolate overflow-hidden bg-azul-profundo text-white">
        <DecoracionPuente className="absolute -right-24 -bottom-10 -z-10 w-4xl max-w-none text-white opacity-[0.06]" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="flex items-center gap-3 text-sm font-semibold tracking-widest text-naranja uppercase">
            <span aria-hidden className="h-px w-8 bg-naranja" />
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

      <section aria-labelledby="titulo-proximos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="titulo-proximos" className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">
          Próximos eventos
        </h2>

        {proximos.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-secondary px-6 py-14 text-center">
            <CalendarHeartIcon className="size-10 text-naranja" aria-hidden />
            <p className="font-heading text-xl font-semibold text-azul uppercase">Muy pronto anunciaremos el siguiente</p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Síguenos en redes para enterarte primero de las convocatorias.
            </p>
            <a
              href={sitio.redes.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "acento", size: "xl" })}
            >
              <IconoInstagram className="size-5" />
              Seguir en Instagram
            </a>
          </div>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {proximos.map((evento, indice) => (
              <Revelar key={evento.id} como="li" retraso={indice * 80}>
                <TarjetaEvento evento={evento} />
              </Revelar>
            ))}
          </ul>
        )}
      </section>

      {anteriores.length > 0 ? (
        <section aria-labelledby="titulo-anteriores" className="bg-secondary">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 id="titulo-anteriores" className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">
              Eventos anteriores
            </h2>
            <p className="mt-2 text-muted-foreground">Así hemos construido comunidad.</p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {anteriores.map((evento, indice) => (
                <Revelar key={evento.id} como="li" retraso={Math.min(indice, 5) * 60}>
                  <TarjetaEvento evento={evento} pasado />
                </Revelar>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}
