import Image from "next/image"
import { ArrowRightIcon, CheckIcon } from "lucide-react"

import { EncabezadoSeccion } from "@/components/sitio/encabezado-seccion"
import { Revelar } from "@/components/sitio/revelar"
import { sitio } from "@/content/sitio"

// Provisional: puntos derivados de la descripción oficial y los pilares.
const compromisos = [
  "Integración de todas las especialidades de la ingeniería",
  "Vinculación con empresas, universidades y sector público",
  "Comunidad activa en eventos, reuniones y redes",
]

export function Nosotros() {
  return (
    <section
      id="nosotros"
      className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-28"
    >
      <Revelar className="relative order-last lg:order-first">
        <div aria-hidden className="absolute -bottom-4 -left-4 h-2/3 w-2/3 rounded-3xl bg-naranja/15 sm:-bottom-6 sm:-left-6" />
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl shadow-2xl shadow-azul/15 sm:aspect-4/3 lg:aspect-4/5">
          <Image
            src="/images/stock/obra-construccion.jpg"
            alt="Ingenieros trabajando en una obra"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-xs">
            <p className="font-heading text-lg leading-snug font-semibold text-azul uppercase">{sitio.lema}</p>
            <p className="mt-1 text-sm text-foreground/60">El lema que nos une</p>
          </div>
        </div>
      </Revelar>

      <Revelar retraso={100}>
        <EncabezadoSeccion antetitulo="Nosotros" titulo="Una década uniendo a la ingeniería joven" />
        <p className="mt-6 text-lg leading-relaxed text-pretty text-foreground/80">{sitio.descripcion}</p>
        <p className="mt-4 leading-relaxed text-pretty text-foreground/65">
          Hoy, bajo el {sitio.consejoActual}, seguimos sumando a ingenieros y estudiantes que quieren
          aportar su talento al desarrollo de Jalisco y crecer junto a una red de colegas.
        </p>
        <ul className="mt-8 flex flex-col gap-3">
          {compromisos.map((compromiso) => (
            <li key={compromiso} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-azul text-white">
                <CheckIcon className="size-3.5" aria-hidden />
              </span>
              <span className="text-foreground/80">{compromiso}</span>
            </li>
          ))}
        </ul>
        <a
          href="#unete"
          className="group mt-9 inline-flex items-center gap-2 rounded-md font-semibold text-azul underline-offset-4 hover:underline"
        >
          Súmate al Colectivo
          <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
        </a>
      </Revelar>
    </section>
  )
}
