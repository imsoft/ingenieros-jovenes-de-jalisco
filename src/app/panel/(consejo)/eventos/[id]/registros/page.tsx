import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, DownloadIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { cambiarEstadoRegistro } from "@/acciones/eventos-panel"
import { BotonFormulario } from "@/components/panel/boton-formulario"
import { InsigniaRegistro } from "@/components/panel/insignia-registro"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatearFechaLarga, formatearMonto, formatearPrecio } from "@/lib/eventos/formato"
import type { EstadoRegistro, RegistroEvento } from "@/lib/eventos/registros"
import { formatearFecha } from "@/lib/panel/formato"
import { listarRegistrosEvento, obtenerEventoPanel } from "@/lib/panel/eventos"

export const metadata: Metadata = { title: "Registros del evento" }

export default async function RegistrosEvento({ params }: PageProps<"/panel/eventos/[id]/registros">) {
  const { id } = await params
  const [evento, registros] = await Promise.all([obtenerEventoPanel(id), listarRegistrosEvento(id)])
  if (!evento) notFound()

  const activos = registros.filter((registro) => registro.estado !== "cancelado")
  const pagados = activos.filter((registro) => registro.estado === "pagado")
  const pendientes = activos.filter((registro) => registro.estado === "pendiente_pago")
  const suma = (lista: RegistroEvento[]) => lista.reduce((total, registro) => total + registro.monto, 0)

  const resumen = [
    { etiqueta: "Registrados", valor: `${activos.length}${evento.cupo !== null ? ` / ${evento.cupo}` : ""}` },
    { etiqueta: "Miembros", valor: String(activos.filter((registro) => registro.es_miembro).length) },
    { etiqueta: "Cobrado", valor: formatearMonto(suma(pagados)) },
    { etiqueta: "Por cobrar", valor: formatearMonto(suma(pendientes)) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/panel/eventos/${evento.id}`} className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-azul hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver al evento
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold break-words text-azul uppercase sm:text-4xl">Registros</h1>
          <p className="mt-2 text-muted-foreground">
            {evento.titulo} · {formatearFechaLarga(evento.inicia_en)}
          </p>
        </div>
        {registros.length > 0 ? (
          <a
            href={`/panel/eventos/${evento.id}/registros/csv`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 w-fit bg-white")}
          >
            <DownloadIcon data-icon="inline-start" aria-hidden />
            Descargar CSV
          </a>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumen.map((dato) => (
          <div key={dato.etiqueta} className="rounded-2xl bg-white p-5 ring-1 ring-azul/10">
            <dt className="text-sm text-muted-foreground">{dato.etiqueta}</dt>
            <dd className="mt-1 font-heading text-3xl font-bold text-azul tabular-nums">{dato.valor}</dd>
          </div>
        ))}
      </dl>

      {registros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-azul/10">
          <UsersRoundIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">Todavía no hay registros</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {evento.publicado ? "Comparte la página del evento para empezar a recibirlos." : "Publica el evento para abrir el registro."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl bg-white ring-1 ring-azul/10 lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Folio</TableHead>
                  <TableHead>Asistente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id} className={cn(registro.estado === "cancelado" && "opacity-60")}>
                    <TableCell className="py-4 pl-6 font-mono text-sm font-semibold">{registro.folio}</TableCell>
                    <TableCell className="max-w-72">
                      <span className="block truncate font-medium">{registro.nombre}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {registro.correo} · {registro.telefono}
                      </span>
                      {registro.organizacion ? <span className="block truncate text-xs text-muted-foreground">{registro.organizacion}</span> : null}
                      <span className="block text-xs text-muted-foreground">{formatearFecha(registro.created_at)}</span>
                    </TableCell>
                    <TableCell>{registro.es_miembro ? "Miembro" : "Público"}</TableCell>
                    <TableCell className="tabular-nums">{formatearPrecio(registro.monto)}</TableCell>
                    <TableCell>
                      <InsigniaRegistro estado={registro.estado} />
                    </TableCell>
                    <TableCell className="pr-6">
                      <AccionesRegistro registro={registro} eventoId={evento.id} className="justify-end" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 lg:hidden">
            {registros.map((registro) => (
              <li key={registro.id} className={cn("flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-azul/10", registro.estado === "cancelado" && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{registro.nombre}</p>
                    <p className="truncate text-sm text-muted-foreground">{registro.correo}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{registro.telefono}</p>
                  </div>
                  <InsigniaRegistro estado={registro.estado} />
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="font-mono font-semibold">{registro.folio}</span>
                  <span>{registro.es_miembro ? "Miembro" : "Público"}</span>
                  <span className="tabular-nums">{formatearPrecio(registro.monto)}</span>
                </p>
                <AccionesRegistro registro={registro} eventoId={evento.id} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

const accionesPorEstado: Record<EstadoRegistro, { estado: EstadoRegistro; etiqueta: string; variante: "default" | "outline" | "ghost" }[]> = {
  pendiente_pago: [
    { estado: "pagado", etiqueta: "Marcar pagado", variante: "default" },
    { estado: "cancelado", etiqueta: "Cancelar", variante: "ghost" },
  ],
  pagado: [
    { estado: "pendiente_pago", etiqueta: "Marcar pendiente", variante: "outline" },
    { estado: "cancelado", etiqueta: "Cancelar", variante: "ghost" },
  ],
  cancelado: [{ estado: "pendiente_pago", etiqueta: "Reactivar", variante: "outline" }],
}

function AccionesRegistro({
  registro,
  eventoId,
  className,
}: {
  registro: RegistroEvento
  eventoId: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {accionesPorEstado[registro.estado].map((accion) => (
        <form key={accion.estado} action={cambiarEstadoRegistro.bind(null, registro.id, eventoId, accion.estado)}>
          <BotonFormulario variant={accion.variante} size="sm" className="h-8 px-3">
            {accion.etiqueta}
          </BotonFormulario>
        </form>
      ))}
    </div>
  )
}
