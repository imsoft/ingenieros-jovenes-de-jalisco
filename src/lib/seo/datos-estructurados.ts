import { preguntasFrecuentes, sitio } from "@/content/sitio"
import { obtenerUrlSitio } from "@/lib/url-sitio"

export function datosOrganizacion() {
  const url = obtenerUrlSitio().toString()
  const idOrganizacion = `${url}#organizacion`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NGO",
        "@id": idOrganizacion,
        name: sitio.nombre,
        alternateName: [sitio.nombreCorto, "CIJJ"],
        url,
        logo: {
          "@type": "ImageObject",
          url: `${url}brand/logo-512.png`,
          width: 512,
          height: 512,
        },
        description: sitio.descripcion,
        slogan: sitio.lema,
        foundingDate: `${sitio.fundacion}-01-01`,
        areaServed: {
          "@type": "State",
          name: "Jalisco",
          containedInPlace: { "@type": "Country", name: "México" },
        },
        knowsAbout: ["Ingeniería", "Desarrollo profesional", "Networking profesional", "Divulgación técnica"],
        sameAs: [sitio.redes.instagram, sitio.redes.facebook],
      },
      {
        "@type": "WebSite",
        "@id": `${url}#sitio`,
        url,
        name: sitio.nombreCorto,
        inLanguage: "es-MX",
        publisher: { "@id": idOrganizacion },
      },
    ],
  }
}

export function datosPreguntasFrecuentes() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntasFrecuentes.map((item) => ({
      "@type": "Question",
      name: item.pregunta,
      acceptedAnswer: { "@type": "Answer", text: item.respuesta },
    })),
  }
}
