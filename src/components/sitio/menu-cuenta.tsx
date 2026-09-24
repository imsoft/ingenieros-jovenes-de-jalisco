"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDownIcon, LogOutIcon, ShieldCheckIcon, UserRoundIcon, UserRoundPenIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { cerrarSesionMiembro } from "@/acciones/cuenta"
import { AvatarMiembro } from "@/components/miembros/avatar-miembro"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SesionEncabezado } from "@/lib/cuenta/tipos"

// Solo consulta la sesión si existe la cookie de Supabase: a los visitantes anónimos no les cuesta nada.
export function useSesionEncabezado() {
  const [sesion, setSesion] = useState<SesionEncabezado>(null)

  useEffect(() => {
    if (!document.cookie.includes("-auth-token")) return
    const controlador = new AbortController()
    fetch("/auth/sesion", { signal: controlador.signal, cache: "no-store" })
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then(setSesion)
      .catch(() => {})
    return () => controlador.abort()
  }, [])

  return sesion
}

export function MenuCuenta({ sesion }: { sesion: SesionEncabezado }) {
  const [saliendo, iniciarSalida] = useTransition()

  if (!sesion) {
    return (
      <Link
        href="/ingresar"
        prefetch={false}
        className={cn(buttonVariants({ variant: "ghost" }), "hidden h-10 gap-2 px-3 text-azul hover:bg-azul/5 hover:text-azul sm:inline-flex")}
      >
        <UserRoundIcon aria-hidden />
        <span className="sr-only xl:not-sr-only">Ingresar</span>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hidden h-10 items-center gap-1.5 rounded-full py-1 pr-2 pl-1 text-azul transition-colors outline-none hover:bg-azul/5 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-azul/5 sm:inline-flex"
        aria-label="Menú de tu cuenta"
      >
        <AvatarMiembro nombre={sesion.nombre} fotoUrl={sesion.fotoUrl} tamano={32} />
        <ChevronDownIcon className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate font-medium text-foreground">{sesion.nombre}</span>
            {sesion.correo && sesion.correo !== sesion.nombre ? (
              <span className="truncate text-xs font-normal text-muted-foreground">{sesion.correo}</span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {sesion.esMiembro ? (
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/miembros" />}>
              <UsersRoundIcon aria-hidden />
              Directorio
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/mi-perfil" />}>
              <UserRoundPenIcon aria-hidden />
              Mi perfil
            </DropdownMenuItem>
            {sesion.esConsejo ? (
              <DropdownMenuItem render={<Link href="/panel" prefetch={false} />}>
                <ShieldCheckIcon aria-hidden />
                Panel del Consejo
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        ) : null}
        {sesion.esMiembro ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem disabled={saliendo} onClick={() => iniciarSalida(() => cerrarSesionMiembro())}>
          <LogOutIcon aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
