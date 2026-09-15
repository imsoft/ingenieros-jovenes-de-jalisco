import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CheckIcon, MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"
import { cn } from "cn"

import { FormularioRevision } from "@/components/panel/formulario-revision"
import { InsigniaEstado } from "@/components/panel/insignia-estado"
import { buttonVariants } from "@/components/ui/button"
import { etiquetasEstado } from "@/lib/panel/estados"
import { enlaceWhatsApp, formatearFecha, primerNombre } from "@/lib/panel/formato"
import { obtenerSolicitud } from "@/lib/panel/solicitudes"

export const metadata: Metadata = { title: "Detalle de solicitud" }

export default async function DetalleSolicitud({ params }: PageProps<"/panel/solicitudes/[id]">) {
  const { id } = await params
  const resultado = await obtenerSolicitud(id)
  if (!resultado) notFound()

  const { solicitud, revisor } = resultado
  const asuntoCorreo = encodeURIComponent("Tu solicitud al Colectivo de Ingenieros Jóvenes de Jalisco")

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/panel/solicitudes?estado=${solicitud.estado}`}
        className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-azul hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver a {etiquetasEstado[solicitud.estado].plural.toLowerCase()}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold break-words text-azul uppercase sm:text-4xl">{solicitud.nombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recibida el {formatearFecha(solicitud.created_at)}</p>
        </div>
        <InsigniaEstado estado={solicitud.estado} className="h-7 text-sm" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="titulo-datos" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10 sm:p-8">
          <h2 id="titulo-datos" className="font-heading text-xl font-semibold text-azul uppercase">
            Datos del solicitante
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Dato etiqueta="Correo">
              <a href={`mailto:${solicitud.correo}`} className="break-all text-azul hover:underline">
                {solicitud.correo}
              </a>
            </Dato>
            <Dato etiqueta="Teléfono / WhatsApp">
              <a href={`tel:${solicitud.telefono}`} className="text-azul tabular-nums hover:underline">
                {solicitud.telefono}
              </a>
            </Dato>
            <Dato etiqueta="Municipio">{solicitud.municipio}</Dato>
            <Dato etiqueta="Confirmaciones">
              <ul className="flex flex-col gap-1 text-sm">
                <Confirmacion activa={solicitud.confirma_mayoria_edad}>Mayor de 18 años</Confirmacion>
                <Confirmacion activa={solicitud.acepta_aviso_privacidad}>Aceptó el aviso de privacidad</Confirmacion>
              </ul>
            </Dato>
          </dl>

          <div className="mt-7 flex flex-col gap-2 border-t border-azul/10 pt-6 sm:flex-row">
            <a
              href={enlaceWhatsApp(solicitud.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "acento", size: "xl" }), "sm:flex-1")}
            >
              <MessageCircleIcon data-icon="inline-start" aria-hidden />
              WhatsApp
            </a>
            <a
              href={`mailto:${solicitud.correo}?subject=${asuntoCorreo}`}
              className={cn(buttonVariants({ variant: "outline", size: "xl" }), "sm:flex-1")}
            >
              <MailIcon data-icon="inline-start" aria-hidden />
              Escribir correo
            </a>
            <a href={`tel:${solicitud.telefono}`} className={cn(buttonVariants({ variant: "outline", size: "xl" }), "sm:flex-1")}>
              <PhoneIcon data-icon="inline-start" aria-hidden />
              Llamar
            </a>
          </div>
        </section>

        <section aria-labelledby="titulo-revision" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10 sm:p-8">
          <h2 id="titulo-revision" className="font-heading text-xl font-semibold text-azul uppercase">
            Revisión
          </h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">
            {solicitud.estado === "pendiente" || !solicitud.revisado_en
              ? `Decide si ${primerNombre(solicitud.nombre)} se integra al Colectivo.`
              : `${etiquetasEstado[solicitud.estado].singular} por ${revisor ?? "un integrante del Consejo"} el ${formatearFecha(solicitud.revisado_en)}.`}
          </p>
          <FormularioRevision id={solicitud.id} estadoActual={solicitud.estado} notas={solicitud.notas_consejo} />
        </section>
      </div>
    </div>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Confirmacion({ activa, children }: { activa: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2", !activa && "text-destructive")}>
      <CheckIcon className="size-4 shrink-0" aria-hidden />
      {children}
    </li>
  )
}
