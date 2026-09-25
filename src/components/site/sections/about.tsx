import Image from "next/image"
import { ArrowRightIcon, CheckIcon } from "lucide-react"

import { SectionHeading } from "@/components/site/section-heading"
import { Reveal } from "@/components/site/reveal"
import { site } from "@/content/site"

// Provisional: points derived from the official description and the pillars.
const commitments = [
  "Integración de todas las especialidades de la ingeniería",
  "Vinculación con empresas, universidades y sector público",
  "Comunidad activa en eventos, reuniones y redes",
]

export function About() {
  return (
    <section
      id="nosotros"
      className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-28"
    >
      <Reveal className="relative order-last lg:order-first">
        <div aria-hidden className="absolute -bottom-4 -left-4 h-2/3 w-2/3 rounded-3xl bg-brand-orange/15 sm:-bottom-6 sm:-left-6" />
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl shadow-2xl shadow-brand-blue/15 sm:aspect-4/3 lg:aspect-4/5">
          <Image
            src="/images/stock/construction-site.jpg"
            alt="Ingenieros trabajando en una obra"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-xs">
            <p className="font-heading text-lg leading-snug font-semibold text-brand-blue uppercase">{site.tagline}</p>
            <p className="mt-1 text-sm text-foreground/60">El lema que nos une</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <SectionHeading eyebrow="Nosotros" title="Una década uniendo a la ingeniería joven" />
        <p className="mt-6 text-lg leading-relaxed text-pretty text-foreground/80">{site.description}</p>
        <p className="mt-4 leading-relaxed text-pretty text-foreground/65">
          Hoy, bajo el {site.currentBoard}, seguimos sumando a ingenieros y estudiantes que quieren
          aportar su talento al desarrollo de Jalisco y crecer junto a una red de colegas.
        </p>
        <ul className="mt-8 flex flex-col gap-3">
          {commitments.map((commitment) => (
            <li key={commitment} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white">
                <CheckIcon className="size-3.5" aria-hidden />
              </span>
              <span className="text-foreground/80">{commitment}</span>
            </li>
          ))}
        </ul>
        <a
          href="#unete"
          className="group mt-9 inline-flex items-center gap-2 rounded-md font-semibold text-brand-blue underline-offset-4 hover:underline"
        >
          Súmate al Colectivo
          <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
        </a>
      </Reveal>
    </section>
  )
}
