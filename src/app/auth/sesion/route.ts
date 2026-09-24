import { NextResponse } from "next/server"

import type { SesionEncabezado } from "@/lib/cuenta/tipos"
import { obtenerPerfil, urlFotoPerfil } from "@/lib/miembros/perfiles"
import { obtenerAccesoMiembro } from "@/lib/miembros/sesion"

// Datos mínimos para el menú de cuenta del encabezado. Lo pide el navegador para que las
// páginas públicas sigan en caché (no leen cookies en el servidor).
export async function GET() {
  const acceso = await obtenerAccesoMiembro()
  let sesion: SesionEncabezado = null

  if (acceso.tipo === "sin-acceso") {
    sesion = { nombre: acceso.correo ?? "Mi cuenta", correo: acceso.correo, fotoUrl: null, esMiembro: false, esConsejo: false }
  } else if (acceso.tipo === "miembro") {
    const { miembro } = acceso
    const perfil = await obtenerPerfil(miembro.usuarioId)
    sesion = {
      nombre: perfil?.nombre ?? miembro.nombreSugerido,
      correo: miembro.correo,
      fotoUrl: urlFotoPerfil(perfil?.foto_ruta ?? null),
      esMiembro: true,
      esConsejo: miembro.esConsejo,
    }
  }

  return NextResponse.json(sesion, { headers: { "Cache-Control": "private, no-store" } })
}
