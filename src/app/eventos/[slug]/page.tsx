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

import { FormularioRegistroEvento } from "@/components/eventos/formulario-registro-evento"
import { GaleriaEvento } from "@/components/eventos/galeria-evento"
import { JsonLd } from "@/components/seo/json-ld"
import { DecoracionPuente } from "@/components/sitio/decoracion-puente"
import { IconoInstagram } from "@/components/sitio/iconos-redes"
import { buttonVariants } from "@/components/ui/button"
import { sitio } from "@/content/sitio"
import { formatearFechaLarga, formatearHorario, formatearPrecio, urlImagenEvento } from "@/lib/eventos/formato"
import { obtenerEventoPorSlug } from "@/lib/eventos/publico"
import { disponibilidadEvento, UMBRAL_ULTIMOS_LUGARES } from "@/lib/eventos/tipos"
import { datosEvento } from "@/lib/seo/datos-estructurados"

export const revalidate = 60

// Sin rutas precalculadas: cada evento se genera en su primera visita y queda en caché (ISR).
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps<"/eventos/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const evento = await obtenerEventoPorSlug(slug)
  if (!evento) return { title: "Evento no encontrado", robots: { index: false } }

  const portada = urlImagenEvento(evento.portada_ruta)
  const imagen = portada
    ? { url: portada, alt: evento.titulo }
    : { url: "/opengraph-image", width: 1200, height: 630, alt: `${sitio.nombre}: ${sitio.lema}` }

  return {
    title: evento.titulo,
    description: evento.resumen,
    alternates: { canonical: `/eventos/${evento.slug}` },
    openGraph: {
      type: "website",
      locale: "es_MX",
      url: `/eventos/${evento.slug}`,
      siteName: sitio.nombre,
      title: `${evento.titulo} | ${sitio.nombreCorto}`,
      description: evento.resumen,
      images: [imagen],
    },
    twitter: {
      card: "summary_large_image",
      title: evento.titulo,
      description: evento.resumen,
      images: [imagen.url],
    },
  }
}

export default async function PaginaEvento({ params }: PageProps<"/eventos/[slug]">) {
  const { slug } = await params
  const evento = await obtenerEventoPorSlug(slug)
  if (!evento) notFound()

  const portada = urlImagenEvento(evento.portada_ruta)
  const disponibilidad = disponibilidadEvento(evento)
  const finalizado = disponibilidad.estado === "finalizado"
  const conPrecio = evento.precio_publico !== null && evento.precio_publico > 0
  const precioMiembroDistinto =
    conPrecio && evento.precio_miembro !== null && evento.precio_miembro !== evento.precio_publico

  return (
    <>
      <JsonLd datos={datosEvento(evento)} />

      <section className="relative isolate overflow-hidden bg-azul-profundo text-white">
        {portada ? (
          <Image
            src={portada}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="-z-20 object-cover opacity-40"
          />
        ) : (
          <DecoracionPuente className="absolute -right-24 -bottom-10 -z-20 w-4xl max-w-none text-white opacity-[0.06]" />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-azul-profundo via-azul-profundo/85 to-azul-profundo/40" />

        <div className="mx-auto max-w-6xl px-4 pt-8 pb-14 sm:px-6 lg:pt-12 lg:pb-20">
          <Link href="/eventos" className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeftIcon className="size-4" aria-hidden />
            Todos los eventos
          </Link>

          {finalizado ? (
            <p className="mt-8 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest uppercase">
              Evento realizado
            </p>
          ) : null}

          <h1 className="mt-4 max-w-4xl font-heading text-4xl leading-[1.02] font-bold text-balance uppercase sm:text-5xl lg:text-6xl">
            {evento.titulo}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-white/80">{evento.resumen}</p>

          <ul className="mt-8 flex flex-col gap-3 text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-8">
            <li className="flex items-center gap-2">
              <CalendarDaysIcon className="size-5 shrink-0 text-naranja" aria-hidden />
              {formatearFechaLarga(evento.inicia_en)}
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="size-5 shrink-0 text-naranja" aria-hidden />
              {formatearHorario(evento)}
            </li>
            <li className="flex items-center gap-2">
              <MapPinIcon className="size-5 shrink-0 text-naranja" aria-hidden />
              {evento.lugar}
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.45fr_1fr] lg:gap-14 lg:py-20">
        <div className="flex min-w-0 flex-col gap-12">
          {evento.descripcion ? (
            <section aria-labelledby="titulo-acerca">
              <h2 id="titulo-acerca" className="font-heading text-2xl font-semibold text-azul uppercase">
                Acerca del evento
              </h2>
              <div className="mt-4 text-lg leading-relaxed break-words whitespace-pre-line text-foreground/80">
                {evento.descripcion}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="titulo-lugar" className="rounded-3xl bg-secondary p-6 sm:p-8">
            <h2 id="titulo-lugar" className="font-heading text-2xl font-semibold text-azul uppercase">
              Cómo llegar
            </h2>
            <p className="mt-3 text-lg font-medium">{evento.lugar}</p>
            {evento.direccion ? <p className="mt-1 text-foreground/70">{evento.direccion}</p> : null}
            {evento.mapa_url ? (
              <a
                href={evento.mapa_url}
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

          <GaleriaEvento fotos={evento.fotos} titulo={evento.titulo} />
        </div>

        <aside id="registro" aria-labelledby="titulo-registro" className="lg:sticky lg:top-24">
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 shadow-azul/5 ring-azul/10 sm:p-8">
            <h2 id="titulo-registro" className="font-heading text-2xl font-semibold text-azul uppercase">
              {finalizado ? "Gracias por acompañarnos" : "Registro"}
            </h2>

            {!finalizado ? (
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary p-4">
                  <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {precioMiembroDistinto ? "Público" : "Entrada"}
                  </dt>
                  <dd className="mt-1 font-heading text-2xl font-bold text-azul tabular-nums">
                    {conPrecio ? formatearPrecio(evento.precio_publico!) : "Libre"}
                  </dd>
                </div>
                {precioMiembroDistinto ? (
                  <div className="rounded-2xl bg-naranja/10 p-4">
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Miembros</dt>
                    <dd className="mt-1 font-heading text-2xl font-bold text-azul tabular-nums">
                      {formatearPrecio(evento.precio_miembro!)}
                    </dd>
                  </div>
                ) : disponibilidad.estado === "abierto" && disponibilidad.restantes !== null ? (
                  <div className="rounded-2xl bg-secondary p-4">
                    <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Lugares</dt>
                    <dd className="mt-1 font-heading text-2xl font-bold text-azul tabular-nums">{disponibilidad.restantes}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            {disponibilidad.estado === "abierto" && disponibilidad.restantes !== null && precioMiembroDistinto ? (
              <p
                className={cn(
                  "mt-4 flex items-center gap-2 text-sm",
                  disponibilidad.restantes <= UMBRAL_ULTIMOS_LUGARES ? "font-semibold text-naranja" : "text-muted-foreground"
                )}
              >
                <UsersRoundIcon className="size-4" aria-hidden />
                {disponibilidad.restantes === 1 ? "Queda 1 lugar" : `Quedan ${disponibilidad.restantes} lugares`}
              </p>
            ) : null}

            <div className="mt-6">
              {disponibilidad.estado === "abierto" ? (
                <FormularioRegistroEvento eventoId={evento.id} slug={evento.slug} />
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="leading-relaxed text-foreground/75">
                    {disponibilidad.estado === "lleno"
                      ? "El cupo de este evento ya está lleno. Síguenos en redes por si se liberan lugares o para enterarte del próximo."
                      : disponibilidad.estado === "cerrado"
                        ? "El registro en línea para este evento ya está cerrado."
                        : "Este evento ya se realizó. Mira las fotos y entérate del siguiente en nuestras redes."}
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
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
