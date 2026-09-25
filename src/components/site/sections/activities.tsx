import Image from "next/image"
import { cn } from "cn"

import { SectionHeading } from "@/components/site/section-heading"
import { InstagramIcon } from "@/components/site/social-icons"
import { Reveal } from "@/components/site/reveal"
import { buttonVariants } from "@/components/ui/button"
import { activities, site } from "@/content/site"

// Mosaic: the first activity is featured (2×2 on desktop) and the second spans two columns.
const layout = [
  { cell: "sm:col-span-2 lg:row-span-2", sizes: "(min-width: 1024px) 50vw, 100vw", titleClassName: "text-3xl sm:text-4xl" },
  { cell: "sm:col-span-2", sizes: "(min-width: 1024px) 50vw, 100vw", titleClassName: "text-2xl" },
  { cell: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw", titleClassName: "text-xl" },
  { cell: "", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw", titleClassName: "text-xl" },
]

export function Activities() {
  return (
    <section id="actividades" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Lo que hacemos" title="Comunidad que se vive" />
        <a
          href={site.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "xl" }),
            "w-fit shrink-0 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
          )}
        >
          <InstagramIcon className="size-5" />
          Ver más en Instagram
        </a>
      </Reveal>

      <ul className="mt-12 grid auto-rows-[17rem] gap-4 sm:grid-cols-2 lg:auto-rows-[15.5rem] lg:grid-cols-4">
        {activities.map((activity, index) => {
          const { cell, sizes, titleClassName } = layout[index] ?? layout[3]
          return (
            <Reveal key={activity.title} as="li" delay={index * 90} className={cell}>
              <article className="group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-3xl p-6 sm:p-7">
                <Image
                  src={activity.image}
                  alt=""
                  fill
                  sizes={sizes}
                  className="-z-20 object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-linear-to-t from-brand-navy/95 via-brand-navy/45 to-brand-navy/5 transition-opacity duration-500 group-hover:opacity-90"
                />
                <span aria-hidden className="mb-4 h-1 w-10 rounded-full bg-brand-orange transition-[width] duration-500 group-hover:w-16" />
                <h3 className={cn("font-heading leading-none font-semibold text-white uppercase", titleClassName)}>
                  {activity.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-pretty text-white/80">{activity.description}</p>
              </article>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}
