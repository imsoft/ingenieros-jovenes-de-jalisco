import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"

export default function EventsLayout({ children }: LayoutProps<"/eventos">) {
  return (
    <>
      <Header />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
