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

import { BridgeDecoration } from "@/components/site/bridge-decoration"
import { SectionHeading } from "@/components/site/section-heading"
import { Reveal } from "@/components/site/reveal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pillars } from "@/content/site"

const icons = {
  business: BriefcaseBusinessIcon,
  guild: UsersRoundIcon,
  academic: GraduationCapIcon,
  policy: LandmarkIcon,
  technical: HardHatIcon,
} as const

export function Pillars() {
  return (
    <section id="pilares" className="relative isolate overflow-hidden bg-brand-navy py-20 text-white lg:py-28">
      <BridgeDecoration className="absolute -right-24 -bottom-8 -z-10 w-4xl max-w-none text-white opacity-[0.05]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading light eyebrow="Nuestros pilares" title="Cinco frentes para impulsar tu carrera" />
          <p className="max-w-sm text-pretty text-white/70">
            Cada pilar es un espacio para aportar y crecer. Puedes participar en el que más te
            interese, o en todos.
          </p>
        </Reveal>

        {/* Mobile and tablet: swipeable cards. */}
        <Reveal className="mt-10 lg:hidden">
          <div
            role="region"
            aria-label="Pilares del Colectivo"
            tabIndex={0}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-brand-orange sm:-mx-6 sm:scroll-px-6 sm:px-6"
          >
            {pillars.map((pillar, index) => {
              const Icon = icons[pillar.key]
              return (
                <article
                  key={pillar.key}
                  className="flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 sm:w-[46%]"
                >
                  <div className="relative aspect-16/10">
                    <Image src={pillar.image} alt="" fill sizes="(min-width: 640px) 46vw, 85vw" className="object-cover" />
                    <div aria-hidden className="absolute inset-0 bg-linear-to-t from-brand-navy/80 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-orange">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-xs text-white/50 tabular-nums">0{index + 1}</p>
                        <h3 className="font-heading text-2xl leading-none font-semibold uppercase">{pillar.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-white/75">{pillar.description}</p>
                    <FocusAreaList focusAreas={pillar.focusAreas} />
                  </div>
                </article>
              )
            })}
          </div>
          <p aria-hidden className="mt-3 flex items-center gap-2 text-sm text-white/50">
            Desliza para ver los {pillars.length} pilares
            <ArrowRightIcon className="size-4 motion-safe:animate-pulse" />
          </p>
        </Reveal>

        {/* Desktop: vertical tabs with a detail panel. */}
        <Reveal className="mt-14 hidden lg:block">
          <Tabs defaultValue={pillars[0].key} orientation="vertical" className="items-stretch gap-8">
            <TabsList variant="line" aria-label="Pilares del Colectivo" className="w-80 shrink-0 gap-2 p-0">
              {pillars.map((pillar, index) => {
                const Icon = icons[pillar.key]
                return (
                  <TabsTrigger
                    key={pillar.key}
                    value={pillar.key}
                    className="h-auto w-full flex-none justify-start gap-4 rounded-2xl border-white/10 px-4 py-4 text-left whitespace-normal text-white/60 after:hidden hover:bg-white/5 hover:text-white data-active:border-white/20 data-active:bg-white/10 data-active:text-white"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors duration-300 in-data-active:bg-brand-orange">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="font-heading text-lg leading-none tracking-wide uppercase">
                        <span className="mr-2 font-sans text-xs text-white/40 tabular-nums">0{index + 1}</span>
                        {pillar.title}
                      </span>
                      <span className="text-xs font-normal text-white/50">{pillar.summary}</span>
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {pillars.map((pillar) => (
              <TabsContent
                key={pillar.key}
                value={pillar.key}
                className="relative min-h-132 overflow-hidden rounded-3xl text-base motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in"
              >
                <Image src={pillar.image} alt="" fill sizes="60vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-linear-to-t from-brand-navy via-brand-navy/75 to-brand-navy/10" />
                <div className="absolute inset-0 flex flex-col justify-end gap-5 p-10">
                  <h3 className="font-heading text-5xl leading-none font-bold uppercase">{pillar.title}</h3>
                  <p className="max-w-xl text-lg leading-relaxed text-pretty text-white/85">{pillar.description}</p>
                  <FocusAreaList focusAreas={pillar.focusAreas} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>
      </div>
    </section>
  )
}

function FocusAreaList({ focusAreas }: { focusAreas: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm text-white/85 lg:flex-row lg:flex-wrap lg:gap-2.5">
      {focusAreas.map((focusArea) => (
        <li key={focusArea} className="flex items-center gap-2 lg:rounded-full lg:bg-white/10 lg:px-3.5 lg:py-1.5 lg:backdrop-blur">
          <CheckIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
          {focusArea}
        </li>
      ))}
    </ul>
  )
}
