"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDaysIcon, ExternalLinkIcon, InboxIcon, LayoutDashboardIcon, ShieldCheckIcon } from "lucide-react"
import { cn } from "cn"

const links = [
  { href: "/panel", label: "Resumen", icon: LayoutDashboardIcon, exact: true },
  { href: "/panel/solicitudes", label: "Solicitudes", icon: InboxIcon, exact: false },
  { href: "/panel/eventos", label: "Eventos", icon: CalendarDaysIcon, exact: false },
  { href: "/panel/consejo", label: "Consejo", icon: ShieldCheckIcon, exact: false, adminOnly: true },
] as const

export function PanelNav({ className, isAdmin }: { className?: string; isAdmin: boolean }) {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  // On mobile the menu scrolls sideways: make sure the current section stays in view.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [pathname])

  return (
    <nav ref={navRef} aria-label="Secciones del panel" className={cn("flex items-center gap-1", className)}>
      {links.filter((link) => isAdmin || !("adminOnly" in link)).map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-brand-blue/10 text-brand-blue" : "text-foreground/65 hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
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
