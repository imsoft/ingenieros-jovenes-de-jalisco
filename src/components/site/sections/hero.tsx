import Image from "next/image"
import { ArrowRightIcon, CheckIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import { pillars, site } from "@/content/site"

const highlights = ["Solo necesitas ser mayor de 18 años", "Solicitud en menos de un minuto"]

export function Hero() {
  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-white">
      {/* Background: technical grid and brand-colored halos. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-brand-blue)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-brand-blue)_1px,transparent_1px)] bg-size-[3.5rem_3.5rem] opacity-[0.05] mask-[radial-gradient(ellipse_at_top_right,black_20%,transparent_65%)]"
      />
      <div aria-hidden className="absolute -top-48 -right-40 -z-10 size-144 rounded-full bg-brand-orange/10 blur-3xl" />
      <div aria-hidden className="absolute top-1/2 -left-56 -z-10 size-112 rounded-full bg-brand-blue/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28">
        <div className="motion-safe:animate-in motion-safe:duration-700 motion-safe:fade-in motion-safe:slide-in-from-bottom-6">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-brand-blue/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-widest text-brand-blue uppercase shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-brand-orange opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-orange" />
            </span>
            {site.currentBoard} · Desde {site.foundedYear}
          </p>

          <h1 className="mt-6 font-heading text-5xl leading-[0.95] font-bold text-balance text-brand-blue uppercase sm:text-6xl xl:text-7xl">
            ¡Cuando la ingeniería se une,{" "}
            <span className="relative inline-block text-brand-orange">
              Jalisco avanza!
              <svg
                aria-hidden
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="absolute -bottom-2.5 left-0 h-3 w-full text-brand-orange/40"
              >
                <path d="M3 17 C 80 3, 220 3, 297 17" fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-pretty text-foreground/70">
            El Colectivo de Ingenieros Jóvenes de Jalisco es la comunidad que integra a ingenieros
            de todas las especialidades en Guadalajara y todo el estado para crecer en lo
            empresarial, gremial, académico, político y técnico.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#unete" className={buttonVariants({ variant: "accent", size: "xl" })}>
              Quiero ser miembro
              <ArrowRightIcon
                data-icon="inline-end"
                aria-hidden
                className="motion-safe:transition-transform motion-safe:group-hover/button:translate-x-1"
              />
            </a>
            <a
              href="#pilares"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "border-brand-blue/20 bg-white/70 text-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
              )}
            >
              Conoce los pilares
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-2 text-sm text-foreground/65 sm:flex-row sm:gap-6">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2">
                <CheckIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        {/* Collage */}
        <div className="relative mx-auto aspect-5/6 w-full max-w-md motion-safe:animate-in motion-safe:duration-1000 motion-safe:fade-in motion-safe:zoom-in-95 sm:aspect-6/5 sm:max-w-2xl lg:aspect-5/6 lg:max-w-none">
          <div aria-hidden className="absolute bottom-[6%] left-[4%] size-[40%] rounded-3xl bg-brand-orange" />
          <div className="absolute top-0 left-0 h-[64%] w-[74%] overflow-hidden rounded-3xl shadow-2xl shadow-brand-blue/25">
            <Image
              src="/images/stock/hero-engineers-site.jpg"
              alt="Equipo de ingenieros revisando una obra"
              fill
              sizes="(min-width: 1024px) 38vw, (min-width: 640px) 60vw, 90vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          </div>
          <div className="absolute right-0 bottom-0 h-[54%] w-[62%] overflow-hidden rounded-3xl border-[6px] border-white shadow-2xl shadow-brand-blue/25">
            <Image
              src="/images/stock/cad-design.jpg"
              alt="Ingeniero trabajando en un diseño asistido por computadora"
              fill
              sizes="(min-width: 1024px) 32vw, 58vw"
              className="object-cover"
            />
          </div>

          <div className="absolute top-[6%] right-0 rounded-2xl bg-brand-blue px-5 py-4 text-white shadow-xl shadow-brand-blue/30 motion-safe:animate-float sm:right-[3%]">
            <p className="font-heading text-3xl leading-none font-bold">{pillars.length} pilares</p>
            <p className="mt-1.5 text-xs text-white/70">de trabajo en ingeniería</p>
          </div>
          <div className="absolute top-[56%] left-0 rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 shadow-brand-blue/15 ring-brand-blue/5 motion-safe:animate-float motion-safe:[animation-delay:-3s] sm:left-[3%]">
            <p className="font-heading text-3xl leading-none font-bold text-brand-blue tabular-nums">{site.foundedYear}</p>
            <p className="mt-1.5 text-xs text-foreground/60">Año de fundación</p>
          </div>
        </div>
      </div>
    </section>
  )
}
