import { etiquetasRegistro } from "@/lib/eventos/registros"
import { listarRegistrosEvento, obtenerEventoPanel } from "@/lib/panel/eventos"
import { formatearFecha } from "@/lib/panel/formato"
import { obtenerAccesoPanel } from "@/lib/panel/sesion"

// Escapa cada celda y neutraliza fórmulas para que Excel no ejecute contenido de los asistentes.
function celda(valor: string) {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
  return `"${seguro.replace(/"/g, '""')}"`
}

export async function GET(_request: Request, { params }: RouteContext<"/panel/eventos/[id]/registros/csv">) {
  const acceso = await obtenerAccesoPanel()
  if (acceso.tipo !== "miembro") return new Response("No autorizado", { status: 401 })

  const { id } = await params
  const [evento, registros] = await Promise.all([obtenerEventoPanel(id), listarRegistrosEvento(id)])
  if (!evento) return new Response("Evento no encontrado", { status: 404 })

  const encabezados = ["Folio", "Nombre", "Correo", "Teléfono", "Empresa o universidad", "Tipo", "Monto", "Estado", "Registrado"]
  const filas = registros.map((registro) => [
    registro.folio,
    registro.nombre,
    registro.correo,
    registro.telefono,
    registro.organizacion ?? "",
    registro.es_miembro ? "Miembro" : "Público",
    registro.monto.toFixed(2),
    etiquetasRegistro[registro.estado],
    formatearFecha(registro.created_at),
  ])

  // BOM para que Excel reconozca los acentos.
  const csv = "﻿" + [encabezados, ...filas].map((fila) => fila.map(celda).join(",")).join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registros-${evento.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  })
}
