import { JsonLd } from "@/components/seo/json-ld"
import { MobileCtaBar } from "@/components/site/mobile-cta-bar"
import { Header } from "@/components/site/header"
import { Footer } from "@/components/site/footer"
import { Activities } from "@/components/site/sections/activities"
import { Benefits } from "@/components/site/sections/benefits"
import { Stats } from "@/components/site/sections/stats"
import { About } from "@/components/site/sections/about"
import { Pillars } from "@/components/site/sections/pillars"
import { Hero } from "@/components/site/sections/hero"
import { Faq } from "@/components/site/sections/faq"
import { UpcomingEvents } from "@/components/site/sections/upcoming-events"
import { Join } from "@/components/site/sections/join"
import { getFaqStructuredData } from "@/lib/seo/structured-data"

// The home page shows upcoming events: it is regenerated every 5 minutes and when publishing from the panel.
export const revalidate = 300

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="contenido" className="flex-1">
        <Hero />
        <Stats />
        <About />
        <Pillars />
        <Activities />
        <UpcomingEvents />
        <Benefits />
        <Faq />
        <Join />
      </main>
      <Footer />
      <MobileCtaBar />
      <JsonLd data={getFaqStructuredData()} />
    </>
  )
}
