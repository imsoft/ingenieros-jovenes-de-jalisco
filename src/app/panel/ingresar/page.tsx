import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import { FormularioIngreso } from "@/components/panel/formulario-ingreso"
import { DecoracionPuente } from "@/components/sitio/decoracion-puente"
import { obtenerAccesoPanel } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Ingresar" }

export default async function PaginaIngreso({ searchParams }: PageProps<"/panel/ingresar">) {
  const acceso = await obtenerAccesoPanel()
  if (acceso.tipo === "miembro") redirect("/panel")

  const { siguiente } = await searchParams
  const destino =
    typeof siguiente === "string" && siguiente.startsWith("/panel") && !siguiente.startsWith("//")
      ? siguiente
      : "/panel"

  return (
    <main
      id="contenido"
      className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-azul-profundo px-4 py-12"
    >
      <DecoracionPuente className="absolute -bottom-10 -left-24 -z-10 w-4xl max-w-none text-white opacity-[0.06]" />

      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.svg" alt="" width={48} height={48} className="size-12" />
          <div>
            <p className="text-xs font-semibold tracking-widest text-naranja uppercase">Ingenieros Jóvenes de Jalisco</p>
            <h1 className="font-heading text-2xl leading-tight font-semibold text-azul uppercase">Panel del Consejo</h1>
          </div>
        </div>
        <p className="mt-5 mb-7 text-sm leading-relaxed text-muted-foreground">
          Acceso exclusivo para integrantes del Consejo Directivo. Si necesitas una cuenta, pídesela
          a un administrador del panel.
        </p>

        <FormularioIngreso siguiente={destino} />

        <Link href="/" className="mt-6 inline-flex rounded-md text-sm font-medium text-azul hover:underline">
          ← Volver al sitio
        </Link>
      </div>
    </main>
  )
}
