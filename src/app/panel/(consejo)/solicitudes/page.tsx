import type { Metadata } from "next"
import Form from "next/form"
import Link from "next/link"
import { ChevronRightIcon, InboxIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

import { InsigniaEstado } from "@/components/panel/insignia-estado"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { etiquetasEstado, leerFiltroEstado, type FiltroEstado } from "@/lib/panel/estados"
import { formatearFecha } from "@/lib/panel/formato"
import { contarSolicitudesPorEstado, listarSolicitudes } from "@/lib/panel/solicitudes"

export const metadata: Metadata = { title: "Solicitudes" }

export default async function PaginaSolicitudes({ searchParams }: PageProps<"/panel/solicitudes">) {
  const parametros = await searchParams
  const estado = leerFiltroEstado(parametros.estado)
  const busqueda = typeof parametros.q === "string" ? parametros.q.trim() : ""
  const hasta = typeof parametros.hasta === "string" ? parametros.hasta : undefined

  const [conteos, { solicitudes, siguienteCursor }] = await Promise.all([
    contarSolicitudesPorEstado(),
    listarSolicitudes({ estado, busqueda, hasta }),
  ])

  const filtros: { valor: FiltroEstado; etiqueta: string; total: number }[] = [
    { valor: "pendiente", etiqueta: etiquetasEstado.pendiente.plural, total: conteos.pendiente },
    { valor: "aprobada", etiqueta: etiquetasEstado.aprobada.plural, total: conteos.aprobada },
    { valor: "rechazada", etiqueta: etiquetasEstado.rechazada.plural, total: conteos.rechazada },
    { valor: "todas", etiqueta: "Todas", total: conteos.pendiente + conteos.aprobada + conteos.rechazada },
  ]

  const enlace = (cambios: { estado?: FiltroEstado; q?: string; hasta?: string }) => {
    const valores = { estado, q: busqueda || undefined, hasta: undefined, ...cambios }
    const consulta = new URLSearchParams()
    for (const [clave, valor] of Object.entries(valores)) if (valor) consulta.set(clave, valor)
    return `/panel/solicitudes?${consulta.toString()}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">Solicitudes de afiliación</h1>
        <p className="mt-2 text-muted-foreground">Revisa y da seguimiento a quienes quieren unirse al Colectivo.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {filtros.map((filtro) => {
            const activo = filtro.valor === estado
            return (
              <Link
                key={filtro.valor}
                href={enlace({ estado: filtro.valor, q: busqueda || undefined })}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors",
                  activo ? "bg-azul text-white ring-azul" : "bg-white text-foreground/70 ring-azul/10 hover:text-foreground"
                )}
              >
                {filtro.etiqueta}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs tabular-nums",
                    activo ? "bg-white/20" : "bg-secondary"
                  )}
                >
                  {filtro.total}
                </span>
              </Link>
            )
          })}
        </nav>

        <Form action="/panel/solicitudes" className="flex w-full gap-2 lg:max-w-sm">
          <input type="hidden" name="estado" value={estado} />
          <label htmlFor="busqueda" className="sr-only">
            Buscar por nombre, correo o municipio
          </label>
          <Input
            id="busqueda"
            name="q"
            type="search"
            defaultValue={busqueda}
            placeholder="Buscar nombre, correo o municipio…"
            autoComplete="off"
            className="h-10 rounded-xl bg-white px-4"
          />
          <Button type="submit" variant="outline" size="lg" className="h-10 bg-white px-3">
            <SearchIcon />
            <span className="sr-only">Buscar</span>
          </Button>
        </Form>
      </div>

      {busqueda ? (
        <p className="text-sm text-muted-foreground">
          Resultados para “{busqueda}”.{" "}
          <Link href={enlace({ q: undefined })} className="font-medium text-azul hover:underline">
            Quitar búsqueda
          </Link>
        </p>
      ) : null}

      {solicitudes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-azul/10">
          <InboxIcon className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-medium">No hay solicitudes en esta vista</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {busqueda ? "Prueba con otro término de búsqueda o cambia el filtro." : "Cuando lleguen nuevas solicitudes aparecerán aquí."}
          </p>
        </div>
      ) : (
        <>
          {/* Escritorio */}
          <div className="hidden overflow-hidden rounded-3xl bg-white ring-1 ring-azul/10 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Solicitante</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Recibida</TableHead>
                  <TableHead className="pr-6">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id} className="relative">
                    <TableCell className="max-w-72 py-4 pl-6">
                      <Link
                        href={`/panel/solicitudes/${solicitud.id}`}
                        className="block truncate font-medium text-azul after:absolute after:inset-0 hover:underline"
                      >
                        {solicitud.nombre}
                      </Link>
                      <span className="block truncate text-sm text-muted-foreground">{solicitud.correo}</span>
                    </TableCell>
                    <TableCell className="tabular-nums">{solicitud.telefono}</TableCell>
                    <TableCell>{solicitud.municipio}</TableCell>
                    <TableCell className="text-muted-foreground">{formatearFecha(solicitud.created_at)}</TableCell>
                    <TableCell className="pr-6">
                      <InsigniaEstado estado={solicitud.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Móvil */}
          <ul className="flex flex-col gap-3 md:hidden">
            {solicitudes.map((solicitud) => (
              <li key={solicitud.id}>
                <Link
                  href={`/panel/solicitudes/${solicitud.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-azul/10 transition-shadow hover:shadow-md"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate font-medium text-azul">{solicitud.nombre}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {solicitud.municipio} · {formatearFecha(solicitud.created_at)}
                    </span>
                    <InsigniaEstado estado={solicitud.estado} />
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {siguienteCursor || hasta ? (
        <div className="flex flex-wrap justify-center gap-2">
          {hasta ? (
            <Link href={enlace({ hasta: undefined })} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}>
              Volver a las más recientes
            </Link>
          ) : null}
          {siguienteCursor ? (
            <Link href={enlace({ hasta: siguienteCursor })} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}>
              Ver más antiguas
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
