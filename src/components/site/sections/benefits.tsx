import {
  CalendarDaysIcon,
  HeartHandshakeIcon,
  LightbulbIcon,
  MegaphoneIcon,
  TrendingUpIcon,
  UsersRoundIcon,
} from "lucide-react"

import { SectionHeading } from "@/components/site/section-heading"
import { Reveal } from "@/components/site/reveal"
import { benefits } from "@/content/site"

const icons = {
  network: UsersRoundIcon,
  growth: TrendingUpIcon,
  events: CalendarDaysIcon,
  learning: LightbulbIcon,
  voice: MegaphoneIcon,
  belonging: HeartHandshakeIcon,
} as const

export function Benefits() {
  return (
    <section id="beneficios" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl">
          <SectionHeading
            centered
            eyebrow="¿Por qué unirte?"
            title="Lo que ganas al ser parte"
            description="Ser miembro del Colectivo es sumarte a una red que impulsa tu carrera y, al mismo tiempo, a Jalisco."
          />
        </Reveal>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = icons[benefit.key]
            return (
              <Reveal key={benefit.key} as="li" delay={index * 80}>
                <div className="group h-full rounded-3xl bg-white p-7 ring-1 ring-brand-blue/5 transition-[translate,box-shadow] duration-300 hover:shadow-xl hover:shadow-brand-blue/10 motion-safe:hover:-translate-y-1">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange transition-colors duration-300 group-hover:bg-brand-orange group-hover:text-white">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-6 font-heading text-xl font-semibold text-brand-blue uppercase">{benefit.title}</h3>
                  <p className="mt-2 leading-relaxed text-pretty text-foreground/70">{benefit.description}</p>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
