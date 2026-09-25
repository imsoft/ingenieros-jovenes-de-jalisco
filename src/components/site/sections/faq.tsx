import { cn } from "cn"

import { SectionHeading } from "@/components/site/section-heading"
import { FacebookIcon, InstagramIcon } from "@/components/site/social-icons"
import { Reveal } from "@/components/site/reveal"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { faqs, site } from "@/content/site"

export function Faq() {
  return (
    <section
      id="preguntas"
      className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.35fr] lg:gap-16 lg:py-28"
    >
      <Reveal className="lg:sticky lg:top-24">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Resolvemos tus dudas"
          description="Lo que más nos preguntan quienes quieren sumarse al Colectivo."
        />
        <div className="mt-8 rounded-3xl bg-brand-blue p-6 text-white sm:p-7">
          <p className="font-heading text-xl font-semibold uppercase">¿No encontraste tu respuesta?</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Escríbenos por mensaje directo y con gusto te ayudamos.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "light", size: "lg" }), "h-10 gap-2 px-4")}
            >
              <InstagramIcon className="size-4" />
              Instagram
            </a>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "light", size: "lg" }), "h-10 gap-2 px-4")}
            >
              <FacebookIcon className="size-4" />
              Facebook
            </a>
          </div>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <Accordion
          defaultValue={["faq-0"]}
          className="rounded-3xl bg-white px-2 shadow-xl ring-1 shadow-brand-blue/5 ring-brand-blue/10 sm:px-4"
        >
          {faqs.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`} className="border-brand-blue/10">
              <AccordionTrigger className="gap-4 px-3 py-5 text-base font-semibold text-brand-blue hover:no-underline sm:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-5 text-base leading-relaxed text-foreground/70">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}
