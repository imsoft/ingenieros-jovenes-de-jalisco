import { Contador } from "@/components/sitio/contador"
import { Revelar } from "@/components/sitio/revelar"
import { pilares, sitio } from "@/content/sitio"

export function Cifras() {
  const cifras = [
    { valor: new Date().getFullYear() - sitio.fundacion, sufijo: "", etiqueta: "Años de trayectoria" },
    { valor: sitio.consejosDirectivos, sufijo: "", etiqueta: "Consejos directivos" },
    { valor: pilares.length, sufijo: "", etiqueta: "Pilares de trabajo" },
    { valor: 18, sufijo: "+", etiqueta: "Edad para unirte" },
  ]

  return (
    <section aria-label="El Colectivo en cifras" className="bg-azul text-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
        {cifras.map((cifra, indice) => (
          <Revelar
            key={cifra.etiqueta}
            retraso={indice * 100}
            className="flex flex-col items-center gap-1 border-white/10 py-9 text-center not-first:lg:border-l sm:py-12 [&:nth-child(-n+2)]:max-lg:border-b even:max-lg:border-l"
          >
            <dt className="text-sm text-white/70">{cifra.etiqueta}</dt>
            <dd className="order-first font-heading text-5xl leading-none font-bold sm:text-6xl">
              <Contador valor={cifra.valor} sufijo={cifra.sufijo} />
            </dd>
          </Revelar>
        ))}
      </dl>
    </section>
  )
}
