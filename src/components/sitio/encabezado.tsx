"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRightIcon, MenuIcon, UserRoundIcon } from "lucide-react"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navegacion, sitio } from "@/content/sitio"

export function Encabezado() {
  const ruta = usePathname()
  const enInicio = ruta === "/"
  const [conScroll, setConScroll] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null)

  useEffect(() => {
    const alDesplazar = () => setConScroll(window.scrollY > 8)
    window.addEventListener("scroll", alDesplazar, { passive: true })
    return () => window.removeEventListener("scroll", alDesplazar)
  }, [])

  // En la portada, resalta la sección que ocupa el centro de la pantalla.
  useEffect(() => {
    if (!enInicio) return

    const ids = ["inicio", ...navegacion.map((enlace) => enlace.href.split("#")[1]).filter(Boolean)]
    const secciones = ids
      .map((id) => document.getElementById(id))
      .filter((seccion): seccion is HTMLElement => seccion !== null)

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setSeccionActiva(entrada.target.id)
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    secciones.forEach((seccion) => observador.observe(seccion))
    return () => observador.disconnect()
  }, [enInicio])

  const estaActivo = (href: string) => {
    const [camino, ancla] = href.split("#")
    if (ancla) return enInicio && seccionActiva === ancla
    return ruta.startsWith(camino)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        conScroll
          ? "border-azul/10 bg-white/85 shadow-lg shadow-azul/5 backdrop-blur-md"
          : "border-transparent bg-white"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
          <Image src="/brand/logo.svg" alt="" width={40} height={40} className="size-10 shrink-0" />
          <span className="font-heading text-sm leading-tight font-semibold text-azul uppercase" translate="no">
            Ingenieros Jóvenes
            <br />
            de Jalisco
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex gap-7">
            {navegacion.map((enlace) => {
              const activo = estaActivo(enlace.href)
              return (
                <li key={enlace.href}>
                  <Link
                    href={enlace.href}
                    aria-current={activo ? (enlace.href.includes("#") ? "location" : "page") : undefined}
                    className={cn(
                      "relative py-2 text-sm font-medium transition-colors hover:text-azul",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-naranja after:transition-transform after:duration-300",
                      activo ? "text-azul after:scale-x-100" : "text-foreground/65 after:scale-x-0"
                    )}
                  >
                    {enlace.etiqueta}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/panel"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden h-10 gap-2 px-3 text-azul hover:bg-azul/5 hover:text-azul sm:inline-flex"
            )}
          >
            <UserRoundIcon aria-hidden />
            <span className="sr-only xl:not-sr-only">Ingresar</span>
          </Link>
          <Link href="/#unete" className={cn(buttonVariants({ variant: "acento" }), "hidden h-10 px-4 sm:inline-flex")}>
            Únete
          </Link>

          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon-lg" className="text-azul lg:hidden" />}>
              <MenuIcon />
              <span className="sr-only">Abrir menú</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 bg-white sm:max-w-sm">
              <SheetHeader className="border-b border-azul/10 px-5 py-4">
                <SheetTitle className="font-heading text-lg text-azul uppercase">Menú</SheetTitle>
                <SheetDescription className="sr-only">Navegación principal del sitio</SheetDescription>
              </SheetHeader>

              <nav aria-label="Menú móvil" className="flex flex-col gap-1 p-3">
                {navegacion.map((enlace, indice) => (
                  <SheetClose
                    key={enlace.href}
                    render={<Link href={enlace.href} />}
                    nativeButton={false}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-3.5 font-heading text-xl text-azul uppercase transition-colors hover:bg-secondary",
                      estaActivo(enlace.href) && "bg-secondary"
                    )}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-sans text-xs text-naranja tabular-nums">0{indice + 1}</span>
                      {enlace.etiqueta}
                    </span>
                    <ArrowRightIcon className="size-4 text-azul/40 transition-transform group-hover:translate-x-1" aria-hidden />
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4 border-t border-azul/10 p-5">
                <SheetClose
                  render={<Link href="/#unete" />}
                  nativeButton={false}
                  className={cn(buttonVariants({ variant: "acento", size: "xl" }), "w-full")}
                >
                  Quiero ser miembro
                  <ArrowRightIcon data-icon="inline-end" aria-hidden />
                </SheetClose>
                <SheetClose
                  render={<Link href="/panel" prefetch={false} />}
                  nativeButton={false}
                  className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full text-azul")}
                >
                  <UserRoundIcon data-icon="inline-start" aria-hidden />
                  Acceso Consejo
                </SheetClose>
                <p className="text-center text-sm text-muted-foreground">
                  Síguenos en{" "}
                  <a href={sitio.redes.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-azul underline">
                    Instagram
                  </a>{" "}
                  y{" "}
                  <a href={sitio.redes.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-azul underline">
                    Facebook
                  </a>
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
