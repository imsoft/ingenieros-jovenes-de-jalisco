"use client"

import { useActionState, useEffect, useRef } from "react"
import Link from "next/link"
import { CircleCheckIcon, TicketIcon, TriangleAlertIcon } from "lucide-react"

import { registrarseEnEvento } from "@/acciones/eventos"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { formatearPrecio } from "@/lib/eventos/formato"
import type { CampoRegistroEvento, EstadoRegistroEvento } from "@/lib/validaciones/eventos"

const estadoInicial: EstadoRegistroEvento = { tipo: "inicial" }

export function FormularioRegistroEvento({ eventoId, slug }: { eventoId: string; slug: string }) {
  const [estado, accion, enviando] = useActionState(registrarseEnEvento.bind(null, eventoId, slug), estadoInicial)
  const formularioRef = useRef<HTMLFormElement>(null)
  const confirmacionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (estado.tipo === "error") {
      formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
    if (estado.tipo === "exito") confirmacionRef.current?.focus()
  }, [estado])

  if (estado.tipo === "exito") {
    const gratis = estado.monto === 0
    return (
      <div
        ref={confirmacionRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col gap-5 outline-none motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-naranja/10">
            <CircleCheckIcon className="size-7 text-naranja" aria-hidden />
          </span>
          <p className="font-heading text-2xl leading-tight font-semibold text-azul uppercase">¡Registro confirmado!</p>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary p-4">
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Folio</dt>
            <dd className="mt-1 font-mono text-lg font-bold tracking-wider text-azul">{estado.folio}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {gratis ? "Costo" : "Monto a pagar"}
            </dt>
            <dd className="mt-1 font-heading text-2xl font-bold text-azul tabular-nums">
              {gratis ? "Sin costo" : formatearPrecio(estado.monto)}
            </dd>
          </div>
        </dl>

        {!gratis ? (
          <p className="text-sm leading-relaxed text-foreground/80">
            {estado.esMiembro
              ? "Aplicamos tu precio de miembro del Colectivo."
              : "Se aplicó el precio público."}
          </p>
        ) : null}

        {!gratis && estado.instrucciones ? (
          <div className="rounded-2xl border border-azul/10 p-4">
            <p className="font-semibold text-azul">Cómo pagar</p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/80">{estado.instrucciones}</p>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Guarda tu folio: lo necesitarás para confirmar tu pago y en la entrada del evento.
        </p>

        {!estado.esMiembro ? (
          <p className="text-sm text-foreground/75">
            ¿Quieres precio de miembro en próximos eventos?{" "}
            <Link href="/#unete" className="font-medium text-azul underline">
              Únete al Colectivo
            </Link>
            .
          </p>
        ) : null}
      </div>
    )
  }

  const errores = estado.tipo === "error" ? estado.errores : {}
  const valores = estado.tipo === "error" ? estado.valores : undefined

  const propsError = (campo: CampoRegistroEvento) =>
    errores[campo]?.length ? { "aria-invalid": true, "aria-describedby": `registro-${campo}-error` } : {}

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-5" noValidate>
      {estado.tipo === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {estado.mensaje}
        </p>
      ) : null}

      <FieldGroup className="gap-4">
        <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
          <Input id="registro-nombre" name="nombre" autoComplete="name" required maxLength={120} defaultValue={valores?.nombre} className="h-11 rounded-xl px-4" {...propsError("nombre")} />
        </Campo>
        <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
          <Input id="registro-correo" name="correo" type="email" autoComplete="email" spellCheck={false} required defaultValue={valores?.correo} className="h-11 rounded-xl px-4" {...propsError("correo")} />
        </Campo>
        <Campo id="telefono" etiqueta="Teléfono / WhatsApp" error={errores.telefono}>
          <Input id="registro-telefono" name="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="33 1234 5678…" required defaultValue={valores?.telefono} className="h-11 rounded-xl px-4" {...propsError("telefono")} />
        </Campo>
        <Campo id="organizacion" etiqueta="Empresa o universidad (opcional)" error={errores.organizacion}>
          <Input id="registro-organizacion" name="organizacion" autoComplete="organization" maxLength={120} defaultValue={valores?.organizacion} className="h-11 rounded-xl px-4" {...propsError("organizacion")} />
        </Campo>
      </FieldGroup>

      {/* Campo trampa para bots, oculto a personas y lectores de pantalla. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="registro-sitio-web">Sitio web</label>
        <input id="registro-sitio-web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      <Field data-invalid={errores.aceptaAvisoPrivacidad?.length ? true : undefined} className="gap-1">
        <FieldLabel className="w-full cursor-pointer items-start gap-3 font-normal text-foreground/80">
          <input
            id="registro-aceptaAvisoPrivacidad"
            name="aceptaAvisoPrivacidad"
            type="checkbox"
            required
            className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-azul"
            {...propsError("aceptaAvisoPrivacidad")}
          />
          <span>
            Acepto el{" "}
            <Link href="/aviso-de-privacidad" className="font-medium text-azul underline" target="_blank" rel="noopener noreferrer">
              aviso de privacidad
            </Link>
            .
          </span>
        </FieldLabel>
        <FieldError id="registro-aceptaAvisoPrivacidad-error" className="pl-7.5">
          {errores.aceptaAvisoPrivacidad?.[0]}
        </FieldError>
      </Field>

      <Button type="submit" variant="acento" size="xl" disabled={enviando} className="w-full">
        {enviando ? (
          <>
            <Spinner data-icon="inline-start" />
            Registrando…
          </>
        ) : (
          <>
            <TicketIcon data-icon="inline-start" aria-hidden />
            Registrarme
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Si tu correo es de un miembro del Colectivo, se aplica automáticamente el precio de miembro.
      </p>
    </form>
  )
}

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: CampoRegistroEvento
  etiqueta: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={`registro-${id}`}>{etiqueta}</FieldLabel>
      {children}
      <FieldError id={`registro-${id}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}
