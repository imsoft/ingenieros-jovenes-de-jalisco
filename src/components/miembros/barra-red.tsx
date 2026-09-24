"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOutIcon, UserRoundPenIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { cerrarSesionMiembro } from "@/acciones/cuenta"
import { BotonFormulario } from "@/components/panel/boton-formulario"

const enlaces = [
  { href: "/miembros", etiqueta: "Directorio", icono: UsersRoundIcon },
  { href: "/mi-perfil", etiqueta: "Mi perfil", icono: UserRoundPenIcon },
]

// Navegación secundaria de la red de miembros, debajo del encabezado del sitio.
export function BarraRed({ esConsejo }: { esConsejo: boolean }) {
  const ruta = usePathname()

  return (
    <div className="border-b border-azul/10 bg-secondary/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <nav aria-label="Red de miembros" className="-mb-px flex gap-1 overflow-x-auto">
          {enlaces.map(({ href, etiqueta, icono: Icono }) => {
            const activo = href === "/miembros" ? ruta === "/miembros" || ruta.startsWith("/miembros/") : ruta === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  activo ? "border-naranja text-azul" : "border-transparent text-foreground/65 hover:text-azul"
                )}
              >
                <Icono className="size-4" aria-hidden />
                {etiqueta}
              </Link>
            )
          })}
          {esConsejo ? (
            <Link
              href="/panel"
              prefetch={false}
              className="flex h-12 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-foreground/65 transition-colors hover:text-azul"
            >
              <span className="sm:hidden">Consejo</span>
              <span className="hidden sm:inline">Panel del Consejo</span>
            </Link>
          ) : null}
        </nav>
        <form action={cerrarSesionMiembro}>
          <BotonFormulario variant="ghost" size="sm" className="text-foreground/65 hover:text-azul">
            <LogOutIcon data-icon="inline-start" aria-hidden />
            <span className="sr-only sm:not-sr-only">Salir</span>
          </BotonFormulario>
        </form>
      </div>
    </div>
  )
}
