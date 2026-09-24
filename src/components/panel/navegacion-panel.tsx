"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDaysIcon, ExternalLinkIcon, InboxIcon, LayoutDashboardIcon, ShieldCheckIcon } from "lucide-react"
import { cn } from "cn"

const enlaces = [
  { href: "/panel", etiqueta: "Resumen", icono: LayoutDashboardIcon, exacto: true },
  { href: "/panel/solicitudes", etiqueta: "Solicitudes", icono: InboxIcon, exacto: false },
  { href: "/panel/eventos", etiqueta: "Eventos", icono: CalendarDaysIcon, exacto: false },
  { href: "/panel/consejo", etiqueta: "Consejo", icono: ShieldCheckIcon, exacto: false, soloAdmin: true },
] as const

export function NavegacionPanel({ className, esAdmin }: { className?: string; esAdmin: boolean }) {
  const ruta = usePathname()
  const navRef = useRef<HTMLElement>(null)

  // En móvil el menú se desplaza de lado: asegura que la sección actual quede a la vista.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [ruta])

  return (
    <nav ref={navRef} aria-label="Secciones del panel" className={cn("flex items-center gap-1", className)}>
      {enlaces.filter((enlace) => esAdmin || !("soloAdmin" in enlace)).map(({ href, etiqueta, icono: Icono, exacto }) => {
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
