import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { BotonGoogle } from "@/components/cuenta/boton-google"
import { SeparadorOpciones } from "@/components/cuenta/separador-opciones"
import { ErrorEnEnlace } from "@/components/cuenta/error-en-enlace"
import { FormularioIngresoMiembro } from "@/components/cuenta/formularios-cuenta"
import { Aviso } from "@/components/sitio/aviso"
import { mensajesErrorIngreso, rutaSegura } from "@/lib/cuenta/rutas"
import { obtenerAccesoMiembro } from "@/lib/miembros/sesion"

export const metadata: Metadata = { title: "Ingresar" }

export default async function PaginaIngresar({ searchParams }: PageProps<"/ingresar">) {
  const { siguiente: siguienteParam, error, aviso } = await searchParams
  const siguiente = rutaSegura(siguienteParam)

  const acceso = await obtenerAccesoMiembro()
  if (acceso.tipo === "miembro") redirect(siguiente)
  if (acceso.tipo === "sin-acceso") redirect("/acceso-restringido")

  const mensajeError = typeof error === "string" ? (mensajesErrorIngreso[error] ?? null) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-azul uppercase">Ingresa a la red</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conecta con otros miembros del Colectivo: quiénes son, a qué se dedican y en qué empresas trabajan.
        </p>
      </div>

      {aviso === "cuenta-eliminada" ? (
        <Aviso tipo="exito">Tu cuenta y tu perfil se eliminaron. Si algún día quieres volver, puedes crear una cuenta nueva.</Aviso>
      ) : null}

      <ErrorEnEnlace mensajeServidor={mensajeError} />

      <BotonGoogle siguiente={siguiente} />

      <SeparadorOpciones />

      <FormularioIngresoMiembro siguiente={siguiente} />

      <div className="flex flex-col gap-2 border-t border-azul/10 pt-5 text-sm text-foreground/75">
        <p>
          ¿Primera vez?{" "}
          <Link href="/registro" className="font-medium text-azul underline-offset-4 hover:underline">
            Crea tu cuenta
          </Link>
        </p>
        <p>
          ¿Aún no eres miembro?{" "}
          <Link href="/#unete" className="font-medium text-azul underline-offset-4 hover:underline">
            Solicita tu afiliación
          </Link>
        </p>
      </div>
    </div>
  )
}
