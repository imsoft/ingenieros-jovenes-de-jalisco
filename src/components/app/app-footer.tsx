import Link from "next/link"

import { site } from "@/content/site"

// Slim footer for the signed-in areas; the full marketing footer stays on the public site.
export function AppFooter() {
  return (
    <footer className="border-t border-brand-blue/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <nav aria-label="Enlaces del pie" className="flex gap-4">
          <Link href="/" className="hover:text-brand-blue hover:underline">
            Sitio público
          </Link>
          <Link href="/aviso-de-privacidad" className="hover:text-brand-blue hover:underline">
            Aviso de privacidad
          </Link>
        </nav>
      </div>
    </footer>
  )
}
