import { preguntasFrecuentes, sitio } from "@/content/sitio"
import { urlImagenEvento } from "@/lib/eventos/formato"
import { disponibilidadEvento, finDelEvento, type Evento } from "@/lib/eventos/tipos"
import { obtenerUrlSitio } from "@/lib/url-sitio"

export function datosEvento(evento: Evento) {
  const url = obtenerUrlSitio()
  const direccionEvento = new URL(`/eventos/${evento.slug}`, url).toString()
  const portada = urlImagenEvento(evento.portada_ruta)
  const disponibilidad = disponibilidadEvento(evento)

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.titulo,
    description: evento.resumen,
    url: direccionEvento,
    startDate: evento.inicia_en,
    endDate: finDelEvento(evento).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: evento.lugar,
      address: evento.direccion ?? "Jalisco, México",
    },
    ...(portada ? { image: [portada] } : {}),
    organizer: { "@type": "Organization", name: sitio.nombre, url: url.toString() },
    offers: {
      "@type": "Offer",
      url: direccionEvento,
      price: evento.precio_publico ?? 0,
      priceCurrency: "MXN",
      availability:
        disponibilidad.estado === "abierto" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  }
}

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
