import type { Metadata } from "next"
import Link from "next/link"

import { FormularioRecuperacion } from "@/components/cuenta/formularios-cuenta"

export const metadata: Metadata = { title: "Recuperar contraseña" }

export default function PaginaRecuperar() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-azul uppercase">Recupera tu acceso</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Te enviaremos un enlace para crear una nueva contraseña. Si entras con Google, no necesitas contraseña.
        </p>
      </div>
      <FormularioRecuperacion />
      <Link href="/ingresar" className="w-fit text-sm font-medium text-azul underline-offset-4 hover:underline">
        ← Volver a ingresar
      </Link>
    </div>
  )
}
