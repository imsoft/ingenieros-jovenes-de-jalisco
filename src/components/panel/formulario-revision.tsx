"use client"

import { useActionState } from "react"
import { CheckIcon, CircleCheckIcon, RotateCcwIcon, TriangleAlertIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { revisarSolicitud } from "@/acciones/panel"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { EstadoSolicitud } from "@/lib/panel/estados"
import type { EstadoFormularioRevision } from "@/lib/validaciones/panel"

const estadoInicial: EstadoFormularioRevision = { tipo: "inicial" }

export function FormularioRevision({
  id,
  estadoActual,
  notas,
}: {
  id: string
  estadoActual: EstadoSolicitud
  notas: string | null
}) {
  const [estado, accion, enviando] = useActionState(revisarSolicitud.bind(null, id), estadoInicial)

  return (
    <form action={accion} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="notas">Notas internas</FieldLabel>
        <Textarea
          id="notas"
          name="notas"
          rows={4}
          maxLength={1000}
          defaultValue={notas ?? ""}
          placeholder="Ej. Se le contactó por WhatsApp para darle la bienvenida…"
          className="rounded-xl px-4 py-3"
        />
        <FieldDescription>Solo las ve el Consejo. Se guardan junto con tu decisión.</FieldDescription>
      </Field>

      {estado.tipo !== "inicial" ? (
        <p
          role={estado.tipo === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
            estado.tipo === "error" ? "bg-destructive/10 text-destructive" : "bg-azul/10 text-azul"
          )}
        >
          {estado.tipo === "error" ? (
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {estado.mensaje}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {estadoActual !== "aprobada" ? (
          <Button type="submit" name="decision" value="aprobada" size="xl" disabled={enviando} className="sm:flex-1">
            {enviando ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" aria-hidden />}
            Aprobar
          </Button>
        ) : null}
        {estadoActual !== "rechazada" ? (
          <Button
            type="submit"
            name="decision"
            value="rechazada"
            variant="destructive"
            size="xl"
            disabled={enviando}
            className="sm:flex-1"
          >
            <XIcon data-icon="inline-start" aria-hidden />
            Rechazar
          </Button>
        ) : null}
        {estadoActual !== "pendiente" ? (
          <Button
            type="submit"
            name="decision"
            value="pendiente"
            variant="outline"
            size="xl"
            disabled={enviando}
            className="sm:flex-1"
          >
            <RotateCcwIcon data-icon="inline-start" aria-hidden />
            Regresar a pendiente
          </Button>
        ) : null}
      </div>
    </form>
  )
}
