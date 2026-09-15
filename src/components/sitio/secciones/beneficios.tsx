import {
  CalendarDaysIcon,
  HeartHandshakeIcon,
  LightbulbIcon,
  MegaphoneIcon,
  TrendingUpIcon,
  UsersRoundIcon,
} from "lucide-react"

import { EncabezadoSeccion } from "@/components/sitio/encabezado-seccion"
import { Revelar } from "@/components/sitio/revelar"
import { beneficios } from "@/content/sitio"

const iconos = {
  red: UsersRoundIcon,
  crecimiento: TrendingUpIcon,
  eventos: CalendarDaysIcon,
  aprendizaje: LightbulbIcon,
  voz: MegaphoneIcon,
  pertenencia: HeartHandshakeIcon,
} as const

export function Beneficios() {
  return (
    <section id="beneficios" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Revelar className="mx-auto max-w-2xl">
          <EncabezadoSeccion
            centrado
            antetitulo="¿Por qué unirte?"
            titulo="Lo que ganas al ser parte"
            descripcion="Ser miembro del Colectivo es sumarte a una red que impulsa tu carrera y, al mismo tiempo, a Jalisco."
          />
        </Revelar>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {beneficios.map((beneficio, indice) => {
            const Icono = iconos[beneficio.clave]
            return (
              <Revelar key={beneficio.clave} como="li" retraso={indice * 80}>
                <div className="group h-full rounded-3xl bg-white p-7 ring-1 ring-azul/5 transition-[translate,box-shadow] duration-300 hover:shadow-xl hover:shadow-azul/10 motion-safe:hover:-translate-y-1">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-naranja/10 text-naranja transition-colors duration-300 group-hover:bg-naranja group-hover:text-white">
                    <Icono className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-6 font-heading text-xl font-semibold text-azul uppercase">{beneficio.titulo}</h3>
                  <p className="mt-2 leading-relaxed text-pretty text-foreground/70">{beneficio.descripcion}</p>
                </div>
              </Revelar>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
