import Image from "next/image"
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  CheckIcon,
  GraduationCapIcon,
  HardHatIcon,
  LandmarkIcon,
  UsersRoundIcon,
} from "lucide-react"

import { DecoracionPuente } from "@/components/sitio/decoracion-puente"
import { EncabezadoSeccion } from "@/components/sitio/encabezado-seccion"
import { Revelar } from "@/components/sitio/revelar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pilares } from "@/content/sitio"

const iconos = {
  empresarial: BriefcaseBusinessIcon,
  gremial: UsersRoundIcon,
  academico: GraduationCapIcon,
  politico: LandmarkIcon,
  tecnico: HardHatIcon,
} as const

export function Pilares() {
  return (
    <section id="pilares" className="relative isolate overflow-hidden bg-azul-profundo py-20 text-white lg:py-28">
      <DecoracionPuente className="absolute -right-24 -bottom-8 -z-10 w-4xl max-w-none text-white opacity-[0.05]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Revelar className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <EncabezadoSeccion claro antetitulo="Nuestros pilares" titulo="Cinco frentes para impulsar tu carrera" />
          <p className="max-w-sm text-pretty text-white/70">
            Cada pilar es un espacio para aportar y crecer. Puedes participar en el que más te
            interese, o en todos.
          </p>
        </Revelar>

        {/* Móvil y tableta: tarjetas deslizables. */}
        <Revelar className="mt-10 lg:hidden">
          <div
            role="region"
            aria-label="Pilares del Colectivo"
            tabIndex={0}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-naranja sm:-mx-6 sm:scroll-px-6 sm:px-6"
          >
            {pilares.map((pilar, indice) => {
              const Icono = iconos[pilar.clave]
              return (
                <article
                  key={pilar.clave}
                  className="flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 sm:w-[46%]"
                >
                  <div className="relative aspect-16/10">
                    <Image src={pilar.imagen} alt="" fill sizes="(min-width: 640px) 46vw, 85vw" className="object-cover" />
                    <div aria-hidden className="absolute inset-0 bg-linear-to-t from-azul-profundo/80 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-naranja">
                        <Icono className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs text-white/50 tabular-nums">0{indice + 1}</p>
                        <h3 className="font-heading text-2xl leading-none font-semibold uppercase">{pilar.titulo}</h3>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-white/75">{pilar.descripcion}</p>
                    <ListaEnfoques enfoques={pilar.enfoques} />
                  </div>
                </article>
              )
            })}
          </div>
          <p aria-hidden className="mt-3 flex items-center gap-2 text-sm text-white/50">
            Desliza para ver los {pilares.length} pilares
            <ArrowRightIcon className="size-4 motion-safe:animate-pulse" />
          </p>
        </Revelar>

        {/* Escritorio: pestañas verticales con panel de detalle. */}
        <Revelar className="mt-14 hidden lg:block">
          <Tabs defaultValue={pilares[0].clave} orientation="vertical" className="items-stretch gap-8">
            <TabsList variant="line" aria-label="Pilares del Colectivo" className="w-80 shrink-0 gap-2 p-0">
              {pilares.map((pilar, indice) => {
                const Icono = iconos[pilar.clave]
                return (
                  <TabsTrigger
                    key={pilar.clave}
                    value={pilar.clave}
                    className="h-auto w-full flex-none justify-start gap-4 rounded-2xl border-white/10 px-4 py-4 text-left whitespace-normal text-white/60 after:hidden hover:bg-white/5 hover:text-white data-active:border-white/20 data-active:bg-white/10 data-active:text-white"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors duration-300 in-data-active:bg-naranja">
                      <Icono className="size-5" aria-hidden />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-heading text-lg leading-none tracking-wide uppercase">
                        <span className="mr-2 font-sans text-xs text-white/40 tabular-nums">0{indice + 1}</span>
                        {pilar.titulo}
                      </span>
                      <span className="text-xs font-normal text-white/50">{pilar.resumen}</span>
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {pilares.map((pilar) => (
              <TabsContent
                key={pilar.clave}
                value={pilar.clave}
                className="relative min-h-132 overflow-hidden rounded-3xl text-base motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in"
              >
                <Image src={pilar.imagen} alt="" fill sizes="60vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-linear-to-t from-azul-profundo via-azul-profundo/75 to-azul-profundo/10" />
                <div className="absolute inset-0 flex flex-col justify-end gap-5 p-10">
                  <h3 className="font-heading text-5xl leading-none font-bold uppercase">{pilar.titulo}</h3>
                  <p className="max-w-xl text-lg leading-relaxed text-pretty text-white/85">{pilar.descripcion}</p>
                  <ListaEnfoques enfoques={pilar.enfoques} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Revelar>
      </div>
    </section>
  )
}

function ListaEnfoques({ enfoques }: { enfoques: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm text-white/85 lg:flex-row lg:flex-wrap lg:gap-2.5">
      {enfoques.map((enfoque) => (
        <li key={enfoque} className="flex items-center gap-2 lg:rounded-full lg:bg-white/10 lg:px-3.5 lg:py-1.5 lg:backdrop-blur">
          <CheckIcon className="size-4 shrink-0 text-naranja" aria-hidden />
          {enfoque}
        </li>
      ))}
    </ul>
  )
}
