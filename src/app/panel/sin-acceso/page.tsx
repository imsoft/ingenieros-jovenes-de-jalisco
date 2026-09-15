import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"

import { cerrarSesionPanel } from "@/acciones/panel"
import { Button } from "@/components/ui/button"
import { obtenerAccesoPanel } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Sin acceso" }

export default async function PaginaSinAcceso() {
  const acceso = await obtenerAccesoPanel()
  if (acceso.tipo === "anonimo") redirect("/panel/ingresar")
  if (acceso.tipo === "miembro") redirect("/panel")

  return (
    <main id="contenido" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 shadow-azul/5 ring-azul/10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-naranja/15">
          <ShieldAlertIcon className="size-7 text-naranja" aria-hidden />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-azul uppercase">Tu cuenta no tiene acceso</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Iniciaste sesión{acceso.correo ? ` como ${acceso.correo}` : ""}, pero tu cuenta no está
          registrada como integrante activo del Consejo. Pide a un administrador que te dé acceso.
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <form action={cerrarSesionPanel}>
            <Button type="submit" variant="outline" size="xl" className="w-full">
              Cerrar sesión
            </Button>
          </form>
          <Link href="/" className="rounded-md py-2 text-sm font-medium text-azul hover:underline">
            Volver al sitio
          </Link>
        </div>
      </div>
    </main>
  )
}
