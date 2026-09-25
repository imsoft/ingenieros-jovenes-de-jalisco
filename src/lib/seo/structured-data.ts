import { faqs, site } from "@/content/site"
import { getEventImageUrl } from "@/lib/events/format"
import { getEventAvailability, getEventEnd, type Event } from "@/lib/events/types"
import { getSiteUrl } from "@/lib/site-url"

export function getEventStructuredData(event: Event) {
  const url = getSiteUrl()
  const eventUrl = new URL(`/eventos/${event.slug}`, url).toString()
  const cover = getEventImageUrl(event.cover_path)
  const availability = getEventAvailability(event)

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    url: eventUrl,
    startDate: event.starts_at,
    endDate: getEventEnd(event).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.address ?? "Jalisco, México",
    },
    ...(cover ? { image: [cover] } : {}),
    organizer: { "@type": "Organization", name: site.name, url: url.toString() },
    offers: {
      "@type": "Offer",
      url: eventUrl,
      price: event.public_price ?? 0,
      priceCurrency: "MXN",
      availability:
        availability.status === "open" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  }
}

export function getOrganizationStructuredData() {
  const url = getSiteUrl().toString()
  const organizationId = `${url}#organizacion`

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NGO",
        "@id": organizationId,
        name: site.name,
        alternateName: [site.shortName, "CIJJ"],
        url,
        logo: {
          "@type": "ImageObject",
          url: `${url}brand/logo-512.png`,
          width: 512,
          height: 512,
        },
        description: site.description,
        slogan: site.tagline,
        foundingDate: `${site.foundedYear}-01-01`,
        areaServed: {
          "@type": "State",
          name: "Jalisco",
          containedInPlace: { "@type": "Country", name: "México" },
        },
        knowsAbout: ["Ingeniería", "Desarrollo profesional", "Networking profesional", "Divulgación técnica"],
        sameAs: [site.social.instagram, site.social.facebook],
      },
      {
        "@type": "WebSite",
        "@id": `${url}#sitio`,
        url,
        name: site.shortName,
        inLanguage: "es-MX",
        publisher: { "@id": organizationId },
      },
    ],
  }
}

export function getFaqStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}
