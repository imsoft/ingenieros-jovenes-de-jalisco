import { Counter } from "@/components/site/counter"
import { Reveal } from "@/components/site/reveal"
import { pillars, site } from "@/content/site"

export function Stats() {
  const stats = [
    { value: new Date().getFullYear() - site.foundedYear, suffix: "", label: "Años de trayectoria" },
    { value: site.boardTerms, suffix: "", label: "Consejos directivos" },
    { value: pillars.length, suffix: "", label: "Pilares de trabajo" },
    { value: 18, suffix: "+", label: "Edad para unirte" },
  ]

  return (
    <section aria-label="El Colectivo en cifras" className="bg-brand-blue text-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Reveal
            key={stat.label}
            delay={index * 100}
            className="flex flex-col items-center gap-1 border-white/10 py-9 text-center not-first:lg:border-l sm:py-12 [&:nth-child(-n+2)]:max-lg:border-b even:max-lg:border-l"
          >
            <dt className="text-sm text-white/70">{stat.label}</dt>
            <dd className="order-first font-heading text-5xl leading-none font-bold sm:text-6xl">
              <Counter value={stat.value} suffix={stat.suffix} />
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  )
}
