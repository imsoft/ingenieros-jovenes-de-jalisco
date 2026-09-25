import type { Metadata } from "next"
import Link from "next/link"

import { site } from "@/content/site"

const description = `Aviso de privacidad del ${site.name}: qué datos recabamos, para qué los usamos y cómo ejercer tus derechos ARCO.`

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description,
  alternates: { canonical: "/aviso-de-privacidad" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/aviso-de-privacidad",
    siteName: site.name,
    title: `Aviso de privacidad | ${site.shortName}`,
    description,
    // Defining openGraph here drops the image inherited from the layout, so it is declared again.
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name}: ${site.tagline}` }],
  },
}

// Provisional: drafted based on the LFPDPPP; the Board or a legal advisor must review it before publishing.
export default function PrivacyNoticePage() {
  return (
    <main id="contenido" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm font-medium text-brand-blue hover:underline">
        ← Volver al inicio
      </Link>
      <h1 className="mt-6 font-heading text-4xl font-semibold uppercase text-brand-blue">
        Aviso de privacidad
      </h1>
      <p className="mt-2 rounded-lg bg-brand-orange/10 px-3 py-2 text-sm text-foreground/80">
        Documento provisional, pendiente de revisión por el Consejo Directivo.
      </p>

      <div className="mt-8 flex flex-col gap-6 leading-relaxed text-foreground/85 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:text-brand-blue">
        <section>
          <h2>Responsable</h2>
          <p>
            El {site.name} (“el Colectivo”), con sede en el estado de Jalisco, México, es
            responsable del tratamiento de los datos personales que nos proporcionas.
          </p>
        </section>
        <section>
          <h2>Datos que recabamos</h2>
          <p>
            Nombre completo, correo electrónico, teléfono o WhatsApp, municipio de residencia y la
            confirmación de que eres mayor de edad. No recabamos datos personales sensibles.
          </p>
        </section>
        <section>
          <h2>Finalidades</h2>
          <p>
            Usamos tus datos para evaluar tu solicitud de afiliación, contactarte sobre su resultado
            e informarte de las actividades y eventos del Colectivo. No vendemos ni compartimos tus
            datos con terceros con fines comerciales.
          </p>
        </section>
        <section>
          <h2>Derechos ARCO</h2>
          <p>
            Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus
            datos, así como revocar tu consentimiento, escribiéndonos a través de nuestras redes
            oficiales en{" "}
            <a href={site.social.facebook} className="text-brand-blue underline" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>{" "}
            o{" "}
            <a href={site.social.instagram} className="text-brand-blue underline" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            .
          </p>
        </section>
        <section>
          <h2>Cambios al aviso</h2>
          <p>Cualquier modificación a este aviso se publicará en esta misma página.</p>
        </section>
      </div>
    </main>
  )
}
