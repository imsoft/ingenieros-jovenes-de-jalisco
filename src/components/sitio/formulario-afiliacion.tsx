"use client"

import { useActionState, useEffect, useRef } from "react"
import Link from "next/link"
import { CircleCheckIcon, SendIcon, TriangleAlertIcon } from "lucide-react"

import { enviarSolicitudAfiliacion } from "@/acciones/afiliacion"
import { IconoInstagram } from "@/components/sitio/iconos-redes"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { municipiosSugeridos, sitio } from "@/content/sitio"
import type { CampoAfiliacion, EstadoFormularioAfiliacion } from "@/lib/validaciones/afiliacion"

const estadoInicial: EstadoFormularioAfiliacion = { tipo: "inicial" }

export function FormularioAfiliacion() {
  const [estado, accion, enviando] = useActionState(enviarSolicitudAfiliacion, estadoInicial)
  const formularioRef = useRef<HTMLFormElement>(null)

  // Tras un envío con errores, lleva el foco al primer campo inválido.
  useEffect(() => {
    if (estado.tipo !== "error") return
    formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [estado])

  if (estado.tipo === "exito") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 py-8 text-center motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:zoom-in-95"
      >
        <span className="flex size-18 items-center justify-center rounded-full bg-naranja/10">
          <CircleCheckIcon className="size-10 text-naranja" aria-hidden />
        </span>
        <p className="font-heading text-3xl font-semibold text-azul uppercase">
          ¡Gracias, {estado.nombre.split(" ")[0]}!
        </p>
        <p className="max-w-sm leading-relaxed text-muted-foreground">
          Recibimos tu solicitud. El Consejo Directivo la revisará y te contactará por correo o
          WhatsApp. Mientras tanto, conoce lo que hacemos en redes.
        </p>
        <a
          href={sitio.redes.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "acento", size: "xl" })}
        >
          <IconoInstagram className="size-5" />
          Seguir en Instagram
        </a>
      </div>
    )
  }

  const errores = estado.tipo === "error" ? estado.errores : {}
  const valores = estado.tipo === "error" ? estado.valores : undefined

  const propsError = (campo: CampoAfiliacion) =>
    errores[campo]?.length ? { "aria-invalid": true, "aria-describedby": `${campo}-error` } : {}

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-6" noValidate>
      {estado.tipo === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {estado.mensaje}
        </p>
      ) : null}

      <FieldGroup>
        <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
          <Input
            id="nombre"
            name="nombre"
            autoComplete="name"
            placeholder="Tu nombre y apellidos…"
            required
            maxLength={120}
            defaultValue={valores?.nombre}
            className="h-12 rounded-xl px-4"
            {...propsError("nombre")}
          />
        </Campo>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
            <Input
              id="correo"
              name="correo"
              type="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="nombre@correo.com…"
              required
              defaultValue={valores?.correo}
              className="h-12 rounded-xl px-4"
              {...propsError("correo")}
            />
          </Campo>
          <Campo id="telefono" etiqueta="Teléfono / WhatsApp" error={errores.telefono}>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="33 1234 5678…"
              required
              defaultValue={valores?.telefono}
              className="h-12 rounded-xl px-4"
              {...propsError("telefono")}
            />
          </Campo>
        </div>

        <Campo id="municipio" etiqueta="Municipio" error={errores.municipio}>
          <Input
            id="municipio"
            name="municipio"
            list="municipios-jalisco"
            autoComplete="address-level2"
            placeholder="Ej. Zapopan…"
            required
            defaultValue={valores?.municipio}
            className="h-12 rounded-xl px-4"
            {...propsError("municipio")}
          />
          <datalist id="municipios-jalisco">
            {municipiosSugeridos.map((municipio) => (
              <option key={municipio} value={municipio} />
            ))}
          </datalist>
        </Campo>
      </FieldGroup>

      {/* Campo trampa para bots, oculto a personas y lectores de pantalla. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="sitio_web">Sitio web</label>
        <input id="sitio_web" name="sitio_web" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-4">
        <Casilla id="confirmaMayoriaEdad" error={errores.confirmaMayoriaEdad}>
          Confirmo que soy mayor de 18 años.
        </Casilla>
        <Casilla id="aceptaAvisoPrivacidad" error={errores.aceptaAvisoPrivacidad}>
          He leído y acepto el{" "}
          <Link
            href="/aviso-de-privacidad"
            className="font-medium text-azul underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aviso de privacidad
          </Link>
          .
        </Casilla>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" variant="acento" size="xl" disabled={enviando} className="w-full">
          {enviando ? (
            <>
              <Spinner data-icon="inline-start" />
              Enviando solicitud…
            </>
          ) : (
            <>
              Enviar solicitud
              <SendIcon data-icon="inline-end" aria-hidden />
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Tus datos solo se usan para dar seguimiento a tu solicitud.
        </p>
      </div>
    </form>
  )
}

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string
  etiqueta: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      {children}
      <FieldError id={`${id}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}

function Casilla({
  id,
  error,
  children,
}: {
  id: CampoAfiliacion
  error?: string[]
  children: React.ReactNode
}) {
  const conError = Boolean(error?.length)

  return (
    <Field data-invalid={conError || undefined} className="gap-1">
      {/* La etiqueta envuelve la casilla para que texto y control compartan el área de clic. */}
      <FieldLabel className="w-full cursor-pointer items-start gap-3 font-normal text-foreground/80">
        <input
          id={id}
          name={id}
          type="checkbox"
          required
          className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-azul"
          aria-invalid={conError || undefined}
          aria-describedby={conError ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </FieldLabel>
      <FieldError id={`${id}-error`} className="pl-7.5">
        {error?.[0]}
      </FieldError>
    </Field>
  )
}
