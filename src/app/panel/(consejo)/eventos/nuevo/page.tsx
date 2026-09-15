import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { FormularioEvento } from "@/components/panel/formulario-evento"
import { valoresEventoVacio } from "@/lib/eventos/formulario"

export const metadata: Metadata = { title: "Nuevo evento" }

export default function NuevoEvento() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/eventos" className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-azul hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver a eventos
      </Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">Nuevo evento</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Guárdalo como borrador y publícalo cuando esté listo. Después de crearlo podrás subir la portada y las fotos.
        </p>
      </div>
      <div className="rounded-3xl bg-white p-6 ring-1 ring-azul/10 sm:p-8">
        <FormularioEvento eventoId={null} valoresIniciales={valoresEventoVacio} />
      </div>
    </div>
  )
}
