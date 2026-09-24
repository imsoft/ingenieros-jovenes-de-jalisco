import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"

import { cerrarSesionMiembro } from "@/acciones/cuenta"
import { BotonFormulario } from "@/components/panel/boton-formulario"
import { obtenerAccesoMiembro } from "@/lib/miembros/sesion"

export const metadata: Metadata = { title: "Acceso restringido" }

export default async function PaginaAccesoRestringido() {
  const acceso = await obtenerAccesoMiembro()
  if (acceso.tipo === "anonimo") redirect("/ingresar")
  if (acceso.tipo === "miembro") redirect("/miembros")

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-naranja/15">
        <ShieldAlertIcon className="size-7 text-naranja" aria-hidden />
      </span>
      <div>
        <h1 className="font-heading text-2xl font-bold text-azul uppercase">La red es solo para miembros</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {acceso.correo ? `Iniciaste sesión como ${acceso.correo}, pero ese correo` : "Tu correo"} no tiene una solicitud de
          afiliación aprobada. Si ya la enviaste, el Consejo te contactará al revisarla.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/#unete"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-naranja px-6 font-semibold text-white shadow-lg shadow-naranja/25 transition-colors hover:bg-naranja/90"
        >
          Solicitar afiliación
        </Link>
        <form action={cerrarSesionMiembro}>
          <BotonFormulario variant="outline" size="xl" className="w-full">
            Cerrar sesión
          </BotonFormulario>
        </form>
      </div>
    </div>
  )
}
