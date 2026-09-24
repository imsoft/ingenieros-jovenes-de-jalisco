import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { BotonGoogle } from "@/components/cuenta/boton-google"
import { SeparadorOpciones } from "@/components/cuenta/separador-opciones"
import { FormularioRegistroMiembro } from "@/components/cuenta/formularios-cuenta"
import { obtenerAccesoMiembro } from "@/lib/miembros/sesion"

export const metadata: Metadata = { title: "Crear cuenta" }

export default async function PaginaRegistro() {
  const acceso = await obtenerAccesoMiembro()
  if (acceso.tipo === "miembro") redirect("/mi-perfil")
  if (acceso.tipo === "sin-acceso") redirect("/acceso-restringido")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-azul uppercase">Crea tu cuenta</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Exclusivo para miembros: usa el correo con el que te aprobaron la solicitud de afiliación.
        </p>
      </div>

      <BotonGoogle siguiente="/mi-perfil" texto="Registrarme con Google" />

      <SeparadorOpciones />

      <FormularioRegistroMiembro />

      <p className="border-t border-azul/10 pt-5 text-sm text-foreground/75">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-azul underline-offset-4 hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  )
}
