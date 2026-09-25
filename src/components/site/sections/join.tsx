import { BridgeDecoration } from "@/components/site/bridge-decoration"
import { SectionHeading } from "@/components/site/section-heading"
import { MembershipForm } from "@/components/site/membership-form"
import { Reveal } from "@/components/site/reveal"
import { membershipSteps } from "@/content/site"

export function Join() {
  return (
    <section aria-labelledby="join-heading" className="relative isolate overflow-hidden bg-brand-blue py-20 text-white lg:py-28">
      <BridgeDecoration className="absolute -bottom-10 -left-32 -z-10 w-4xl max-w-none text-white opacity-[0.06]" />
      <div aria-hidden className="absolute -top-40 -right-40 -z-10 size-120 rounded-full bg-white/[0.07] blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-24">
          <SectionHeading
            light
            id="join-heading"
            eyebrow="Únete al Colectivo"
            title="Da el siguiente paso en tu carrera"
            description="Ser parte es sencillo. Así funciona:"
          />
          <ol className="mt-10 flex flex-col gap-8">
            {membershipSteps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-5 not-last:before:absolute not-last:before:top-12 not-last:before:left-5 not-last:before:h-[calc(100%-1rem)] not-last:before:w-px not-last:before:bg-white/20"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-orange font-heading text-lg font-bold shadow-lg shadow-brand-orange/30">
                  {index + 1}
                </span>
                <div className="pt-1">
                  <h3 className="font-heading text-xl font-semibold uppercase">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-white/70">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={120}>
          <div id="unete" className="rounded-3xl bg-white p-6 text-foreground shadow-2xl shadow-black/25 sm:p-9">
            <h3 className="font-heading text-2xl font-semibold text-brand-blue uppercase sm:text-3xl">
              Solicitud de afiliación
            </h3>
            <p className="mt-1 mb-7 text-sm text-muted-foreground">Te tomará menos de un minuto.</p>
            <MembershipForm />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
