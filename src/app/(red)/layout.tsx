import type { Metadata } from "next"

import { BarraRed } from "@/components/miembros/barra-red"
import { Encabezado } from "@/components/sitio/encabezado"
import { Pie } from "@/components/sitio/pie"
import { obtenerAccesoMiembro } from "@/lib/miembros/sesion"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Cada página vuelve a exigir la membresía; aquí solo se decide si mostrar la barra.
export default async function LayoutRed({ children }: { children: React.ReactNode }) {
  const acceso = await obtenerAccesoMiembro()

  return (
    <>
      <Encabezado />
      {acceso.tipo === "miembro" ? <BarraRed esConsejo={acceso.miembro.esConsejo} /> : null}
      <main id="contenido" className="flex-1 bg-white">
        {children}
      </main>
      <Pie />
    </>
  )
}
