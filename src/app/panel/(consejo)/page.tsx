import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, InboxIcon } from "lucide-react"
import { cn } from "cn"

import { InsigniaEstado } from "@/components/panel/insignia-estado"
import { buttonVariants } from "@/components/ui/button"
import { estadosSolicitud, etiquetasEstado } from "@/lib/panel/estados"
import { formatearFecha, primerNombre } from "@/lib/panel/formato"
import { exigirMiembroConsejo } from "@/lib/panel/sesion"
import { contarSolicitudesPorEstado, listarSolicitudes } from "@/lib/panel/solicitudes"

export const metadata: Metadata = { title: "Resumen" }

export default async function Resumen() {
  const miembro = await exigirMiembroConsejo()
  const [conteos, { solicitudes: pendientes }] = await Promise.all([
    contarSolicitudesPorEstado(),
    listarSolicitudes({ estado: "pendiente", limite: 5 }),
  ])

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">
          Hola, {primerNombre(miembro.nombre)}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {conteos.pendiente === 0
            ? "No hay solicitudes pendientes por revisar."
            : `Hay ${conteos.pendiente} ${conteos.pendiente === 1 ? "solicitud pendiente" : "solicitudes pendientes"} por revisar.`}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {estadosSolicitud.map((estado) => (
          <li key={estado}>
            <Link
              href={`/panel/solicitudes?estado=${estado}`}
              className={cn(
                "group flex h-full flex-col gap-3 rounded-3xl p-6 ring-1 transition-shadow hover:shadow-lg",
                estado === "pendiente" ? "bg-azul text-white ring-azul" : "bg-white ring-azul/10 hover:shadow-azul/10"
              )}
            >
              <span className={cn("text-sm font-medium", estado === "pendiente" ? "text-white/75" : "text-muted-foreground")}>
                {etiquetasEstado[estado].plural}
              </span>
              <span className={cn("font-heading text-5xl leading-none font-bold tabular-nums", estado !== "pendiente" && "text-azul")}>
                {conteos[estado]}
              </span>
              <span className={cn("mt-auto flex items-center gap-1 text-sm font-medium", estado === "pendiente" ? "text-white" : "text-azul")}>
                Ver solicitudes
                <ArrowRightIcon className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="titulo-recientes" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-recientes" className="font-heading text-xl font-semibold text-azul uppercase">
            Pendientes más recientes
          </h2>
          {pendientes.length > 0 ? (
            <Link
              href="/panel/solicitudes?estado=pendiente"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-9")}
            >
              Ver todas
            </Link>
          ) : null}
        </div>

        {pendientes.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-secondary px-6 py-10 text-center">
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Todo al día. Las nuevas solicitudes aparecerán aquí.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-azul/10">
            {pendientes.map((solicitud) => (
              <li key={solicitud.id}>
                <Link
                  href={`/panel/solicitudes/${solicitud.id}`}
                  className="flex flex-col gap-1 rounded-xl px-2 py-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{solicitud.nombre}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {solicitud.municipio} · {solicitud.correo}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                    {formatearFecha(solicitud.created_at)}
                    <InsigniaEstado estado={solicitud.estado} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
