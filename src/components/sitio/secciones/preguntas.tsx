import { cn } from "cn"

import { EncabezadoSeccion } from "@/components/sitio/encabezado-seccion"
import { IconoFacebook, IconoInstagram } from "@/components/sitio/iconos-redes"
import { Revelar } from "@/components/sitio/revelar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { preguntasFrecuentes, sitio } from "@/content/sitio"

export function Preguntas() {
  return (
    <section
      id="preguntas"
      className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.35fr] lg:gap-16 lg:py-28"
    >
      <Revelar className="lg:sticky lg:top-24">
        <EncabezadoSeccion
          antetitulo="Preguntas frecuentes"
          titulo="Resolvemos tus dudas"
          descripcion="Lo que más nos preguntan quienes quieren sumarse al Colectivo."
        />
        <div className="mt-8 rounded-3xl bg-azul p-6 text-white sm:p-7">
          <p className="font-heading text-xl font-semibold uppercase">¿No encontraste tu respuesta?</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Escríbenos por mensaje directo y con gusto te ayudamos.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={sitio.redes.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "claro", size: "lg" }), "h-10 gap-2 px-4")}
            >
              <IconoInstagram className="size-4" />
              Instagram
            </a>
            <a
              href={sitio.redes.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "claro", size: "lg" }), "h-10 gap-2 px-4")}
            >
              <IconoFacebook className="size-4" />
              Facebook
            </a>
          </div>
        </div>
      </Revelar>

      <Revelar retraso={100}>
        <Accordion
          defaultValue={["pregunta-0"]}
          className="rounded-3xl bg-white px-2 shadow-xl ring-1 shadow-azul/5 ring-azul/10 sm:px-4"
        >
          {preguntasFrecuentes.map((item, indice) => (
            <AccordionItem key={item.pregunta} value={`pregunta-${indice}`} className="border-azul/10">
              <AccordionTrigger className="gap-4 px-3 py-5 text-base font-semibold text-azul hover:no-underline sm:text-lg">
                {item.pregunta}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-5 text-base leading-relaxed text-foreground/70">
                {item.respuesta}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Revelar>
    </section>
  )
}
