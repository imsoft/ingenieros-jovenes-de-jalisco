"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon, MenuIcon } from "lucide-react"
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
  const [conScroll, setConScroll] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null)

  useEffect(() => {
    const alDesplazar = () => setConScroll(window.scrollY > 8)
    window.addEventListener("scroll", alDesplazar, { passive: true })
    return () => window.removeEventListener("scroll", alDesplazar)
  }, [])

  // Resalta en el menú la sección que ocupa el centro de la pantalla.
  useEffect(() => {
    const secciones = ["#inicio", ...navegacion.map((enlace) => enlace.href)]
      .map((selector) => document.querySelector(selector))
      .filter((seccion): seccion is Element => seccion !== null)

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setSeccionActiva(`#${entrada.target.id}`)
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    secciones.forEach((seccion) => observador.observe(seccion))
    return () => observador.disconnect()
  }, [])

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
              const activo = seccionActiva === enlace.href
              return (
                <li key={enlace.href}>
                  <a
                    href={enlace.href}
                    aria-current={activo ? "location" : undefined}
                    className={cn(
                      "relative py-2 text-sm font-medium transition-colors hover:text-azul",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-naranja after:transition-transform after:duration-300",
                      activo ? "text-azul after:scale-x-100" : "text-foreground/65 after:scale-x-0"
                    )}
                  >
                    {enlace.etiqueta}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href="#unete" className={cn(buttonVariants({ variant: "acento" }), "hidden h-10 px-4 sm:inline-flex")}>
            Únete
          </a>

          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-lg" className="text-azul lg:hidden" />}
            >
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
                    render={<a href={enlace.href} />}
                    nativeButton={false}
                    className="group flex items-center justify-between rounded-xl px-3 py-3.5 font-heading text-xl text-azul uppercase transition-colors hover:bg-secondary"
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
                  render={<a href="#unete" />}
                  nativeButton={false}
                  className={cn(buttonVariants({ variant: "acento", size: "xl" }), "w-full")}
                >
                  Quiero ser miembro
                  <ArrowRightIcon data-icon="inline-end" aria-hidden />
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
