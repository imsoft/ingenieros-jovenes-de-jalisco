"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDaysIcon, ExternalLinkIcon, InboxIcon, LayoutDashboardIcon } from "lucide-react"
import { cn } from "cn"

const enlaces = [
  { href: "/panel", etiqueta: "Resumen", icono: LayoutDashboardIcon, exacto: true },
  { href: "/panel/solicitudes", etiqueta: "Solicitudes", icono: InboxIcon, exacto: false },
  { href: "/panel/eventos", etiqueta: "Eventos", icono: CalendarDaysIcon, exacto: false },
] as const

export function NavegacionPanel({ className }: { className?: string }) {
  const ruta = usePathname()

  return (
    <nav aria-label="Secciones del panel" className={cn("flex items-center gap-1", className)}>
      {enlaces.map(({ href, etiqueta, icono: Icono, exacto }) => {
        const activo = exacto ? ruta === href : ruta.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activo ? "bg-azul/10 text-azul" : "text-foreground/65 hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icono className="size-4" aria-hidden />
            {etiqueta}
          </Link>
        )
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/65 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ExternalLinkIcon className="size-4" aria-hidden />
        Ver sitio
      </a>
    </nav>
  )
}
