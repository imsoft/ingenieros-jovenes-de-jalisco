"use client"

import { useActionState, useEffect, useRef } from "react"
import { CircleCheckIcon, SaveIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { guardarEvento } from "@/acciones/eventos-panel"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { ValoresEvento } from "@/lib/eventos/formulario"
import type { EstadoFormularioEvento } from "@/lib/validaciones/evento-panel"

type CampoTexto = Exclude<keyof ValoresEvento, "registroAbierto" | "publicado">

const estadoInicial: EstadoFormularioEvento = { tipo: "inicial" }

export function FormularioEvento({
  eventoId,
  valoresIniciales,
}: {
  eventoId: string | null
  valoresIniciales: ValoresEvento
}) {
  const [estado, accion, enviando] = useActionState(guardarEvento.bind(null, eventoId), estadoInicial)
  const formularioRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.tipo === "error") {
      formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [estado])

  const valores = estado.tipo === "error" ? estado.valores : valoresIniciales
  const errores = estado.tipo === "error" ? estado.errores : {}

  const campo = (nombre: CampoTexto) => ({
    id: `evento-${nombre}`,
    name: nombre,
    defaultValue: valores[nombre],
    ...(errores[nombre]?.length ? { "aria-invalid": true, "aria-describedby": `evento-${nombre}-error` } : {}),
  })

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-10" noValidate>
      {estado.tipo === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {estado.mensaje}
        </p>
      ) : estado.tipo === "exito" ? (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-azul/10 px-4 py-3 text-sm text-azul">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {estado.mensaje}
        </p>
      ) : null}

      <Seccion titulo="Información">
        <Campo nombre="titulo" etiqueta="Título" error={errores.titulo}>
          <Input {...campo("titulo")} required maxLength={120} placeholder="Ej. Jalisco al Grito 2026…" className="h-11 rounded-xl px-4" />
        </Campo>
        <Campo
          nombre="slug"
          etiqueta="Dirección de la página"
          descripcion="Déjala vacía para generarla desde el título. Solo minúsculas, números y guiones."
          error={errores.slug}
        >
          <div className="flex items-stretch overflow-hidden rounded-xl border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="flex items-center bg-secondary px-3 text-sm text-muted-foreground select-none">/eventos/</span>
            <input
              {...campo("slug")}
              maxLength={80}
              spellCheck={false}
              autoComplete="off"
              placeholder="jalisco-al-grito-2026…"
              className="h-11 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
          </div>
        </Campo>
        <Campo nombre="resumen" etiqueta="Resumen" descripcion="Una o dos frases. Aparece en las tarjetas y al compartir el enlace." error={errores.resumen}>
          <Textarea {...campo("resumen")} rows={2} maxLength={300} className="rounded-xl px-4 py-3" />
        </Campo>
        <Campo nombre="descripcion" etiqueta="Descripción (opcional)" descripcion="Programa, invitados, código de vestimenta… Los saltos de línea se respetan." error={errores.descripcion}>
          <Textarea {...campo("descripcion")} rows={6} maxLength={5000} className="rounded-xl px-4 py-3" />
        </Campo>
      </Seccion>

      <Seccion titulo="Fecha y lugar" descripcion="Horario del centro de México.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo nombre="fecha" etiqueta="Fecha" error={errores.fecha}>
            <Input {...campo("fecha")} type="date" required className="h-11 rounded-xl px-4" />
          </Campo>
          <Campo nombre="horaInicio" etiqueta="Inicia" error={errores.horaInicio}>
            <Input {...campo("horaInicio")} type="time" required className="h-11 rounded-xl px-4" />
          </Campo>
          <Campo nombre="horaFin" etiqueta="Termina (opcional)" error={errores.horaFin}>
            <Input {...campo("horaFin")} type="time" className="h-11 rounded-xl px-4" />
          </Campo>
        </div>
        <Campo nombre="lugar" etiqueta="Lugar" error={errores.lugar}>
          <Input {...campo("lugar")} required maxLength={160} placeholder="Ej. Terraza Aguamarina…" className="h-11 rounded-xl px-4" />
        </Campo>
        <Campo nombre="direccion" etiqueta="Dirección (opcional)" error={errores.direccion}>
          <Input {...campo("direccion")} maxLength={300} autoComplete="off" placeholder="Calle, número, colonia, municipio…" className="h-11 rounded-xl px-4" />
        </Campo>
        <Campo nombre="mapaUrl" etiqueta="Enlace de Google Maps (opcional)" error={errores.mapaUrl}>
          <Input {...campo("mapaUrl")} type="url" inputMode="url" spellCheck={false} maxLength={500} placeholder="https://maps.app.goo.gl/…" className="h-11 rounded-xl px-4" />
        </Campo>
      </Seccion>

      <Seccion
        titulo="Precios y cupo"
        descripcion="Deja el precio público vacío si la entrada es libre. Si no hay precio especial para miembros, deja ese campo vacío."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <Campo nombre="precioPublico" etiqueta="Precio público" error={errores.precioPublico}>
            <Input {...campo("precioPublico")} inputMode="decimal" autoComplete="off" placeholder="350…" className="h-11 rounded-xl px-4" />
          </Campo>
          <Campo nombre="precioMiembro" etiqueta="Precio miembros" error={errores.precioMiembro}>
            <Input {...campo("precioMiembro")} inputMode="decimal" autoComplete="off" placeholder="300…" className="h-11 rounded-xl px-4" />
          </Campo>
          <Campo nombre="cupo" etiqueta="Cupo (opcional)" error={errores.cupo}>
            <Input {...campo("cupo")} inputMode="numeric" autoComplete="off" placeholder="Sin límite…" className="h-11 rounded-xl px-4" />
          </Campo>
        </div>
        <Campo
          nombre="instruccionesPago"
          etiqueta="Instrucciones de pago (opcional)"
          descripcion="Se muestran al confirmar el registro: datos de transferencia, pago en taquilla, a quién enviar el comprobante…"
          error={errores.instruccionesPago}
        >
          <Textarea {...campo("instruccionesPago")} rows={4} maxLength={2000} className="rounded-xl px-4 py-3" />
        </Campo>
      </Seccion>

      <Seccion titulo="Publicación">
        <div className="flex flex-col gap-3">
          <Casilla nombre="publicado" marcada={valores.publicado} titulo="Publicado" descripcion="Visible en el sitio. Si no, se guarda como borrador." />
          <Casilla nombre="registroAbierto" marcada={valores.registroAbierto} titulo="Registro abierto" descripcion="Permite registrarse en línea hasta que inicie el evento o se llene el cupo." />
        </div>
      </Seccion>

      <Button type="submit" variant="acento" size="xl" disabled={enviando} className="w-full sm:w-fit">
        {enviando ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" aria-hidden />}
        {eventoId ? "Guardar cambios" : "Crear evento"}
      </Button>
    </form>
  )
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 flex flex-col gap-1">
        <span className="font-heading text-lg font-semibold text-azul uppercase">{titulo}</span>
        {descripcion ? <span className="text-sm text-muted-foreground">{descripcion}</span> : null}
      </legend>
      {children}
    </fieldset>
  )
}

function Campo({
  nombre,
  etiqueta,
  descripcion,
  error,
  children,
}: {
  nombre: CampoTexto
  etiqueta: string
  descripcion?: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={`evento-${nombre}`}>{etiqueta}</FieldLabel>
      {children}
      {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
      <FieldError id={`evento-${nombre}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}

function Casilla({
  nombre,
  marcada,
  titulo,
  descripcion,
}: {
  nombre: "publicado" | "registroAbierto"
  marcada: boolean
  titulo: string
  descripcion: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-azul/10 p-4 transition-colors hover:bg-secondary",
        "has-checked:border-azul/30 has-checked:bg-azul/5"
      )}
    >
      <input name={nombre} type="checkbox" defaultChecked={marcada} className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-azul" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{titulo}</span>
        <span className="text-sm text-muted-foreground">{descripcion}</span>
      </span>
    </label>
  )
}
