import Image from "next/image"
import { cn } from "cn"

import { EncabezadoSeccion } from "@/components/sitio/encabezado-seccion"
import { IconoInstagram } from "@/components/sitio/iconos-redes"
import { Revelar } from "@/components/sitio/revelar"
import { buttonVariants } from "@/components/ui/button"
import { actividades, sitio } from "@/content/sitio"

// Mosaico: la primera actividad es la destacada (2×2 en escritorio) y la segunda ocupa dos columnas.
const disposicion = [
  { celda: "sm:col-span-2 lg:row-span-2", sizes: "(min-width: 1024px) 50vw, 100vw", titulo: "text-3xl sm:text-4xl" },
  { celda: "sm:col-span-2", sizes: "(min-width: 1024px) 50vw, 100vw", titulo: "text-2xl" },
  { celda: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw", titulo: "text-xl" },
  { celda: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw", titulo: "text-xl" },
]

export function Actividades() {
  return (
    <section id="actividades" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Revelar className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <EncabezadoSeccion antetitulo="Lo que hacemos" titulo="Comunidad que se vive" />
        <a
          href={sitio.redes.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "xl" }),
            "w-fit shrink-0 border-azul/20 text-azul hover:bg-azul/5 hover:text-azul"
          )}
        >
          <IconoInstagram className="size-5" />
          Ver más en Instagram
        </a>
      </Revelar>

      <ul className="mt-12 grid auto-rows-[17rem] gap-4 sm:grid-cols-2 lg:auto-rows-[15.5rem] lg:grid-cols-4">
        {actividades.map((actividad, indice) => {
          const { celda, sizes, titulo } = disposicion[indice] ?? disposicion[3]
          return (
            <Revelar key={actividad.titulo} como="li" retraso={indice * 90} className={celda}>
              <article className="group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-3xl p-6 sm:p-7">
                <Image
                  src={actividad.imagen}
                  alt=""
                  fill
                  sizes={sizes}
                  className="-z-20 object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-linear-to-t from-azul-profundo/95 via-azul-profundo/45 to-azul-profundo/5 transition-opacity duration-500 group-hover:opacity-90"
                />
                <span aria-hidden className="mb-4 h-1 w-10 rounded-full bg-naranja transition-[width] duration-500 group-hover:w-16" />
                <h3 className={cn("font-heading leading-none font-semibold text-white uppercase", titulo)}>
                  {actividad.titulo}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-pretty text-white/80">{actividad.descripcion}</p>
              </article>
            </Revelar>
          )
        })}
      </ul>
    </section>
  )
}
