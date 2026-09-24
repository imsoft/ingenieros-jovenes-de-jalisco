"use client"

import { useActionState, useEffect, useRef } from "react"
import Link from "next/link"

import {
  iniciarSesionMiembro,
  registrarMiembro,
  restablecerContrasena,
  solicitarRecuperacion,
} from "@/acciones/cuenta"
import { Aviso as AvisoBase } from "@/components/sitio/aviso"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { CampoCuenta, EstadoFormularioCuenta } from "@/lib/validaciones/cuenta"

const estadoInicial: EstadoFormularioCuenta = { tipo: "inicial" }

function useEnfocarError(estado: EstadoFormularioCuenta) {
  const formularioRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (estado.tipo !== "error") return
    const invalido = formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ;(invalido ?? formularioRef.current?.querySelector<HTMLElement>("input:not([type=hidden])"))?.focus()
  }, [estado])
  return formularioRef
}

function Aviso({ estado }: { estado: EstadoFormularioCuenta }) {
  if (estado.tipo === "inicial") return null
  return <AvisoBase tipo={estado.tipo}>{estado.mensaje}</AvisoBase>
}

function Campo({
  id,
  nombre,
  etiqueta,
  error,
  descripcion,
  ...props
}: React.ComponentProps<"input"> & {
  nombre: CampoCuenta
  etiqueta: string
  error?: string[]
  descripcion?: React.ReactNode
}) {
  const idCampo = id ?? `cuenta-${nombre}`
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
      <Input
        id={idCampo}
        name={nombre}
        className="h-12 rounded-xl px-4"
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={error?.length ? `${idCampo}-error` : undefined}
        {...props}
      />
      {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
      <FieldError id={`${idCampo}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}

function BotonEnviar({ enviando, texto, textoEnviando }: { enviando: boolean; texto: string; textoEnviando: string }) {
  return (
    <Button type="submit" variant="acento" size="xl" disabled={enviando} className="w-full">
      {enviando ? (
        <>
          <Spinner data-icon="inline-start" />
          {textoEnviando}
        </>
      ) : (
        texto
      )}
    </Button>
  )
}

export function FormularioIngresoMiembro({ siguiente }: { siguiente: string }) {
  const [estado, accion, enviando] = useActionState(iniciarSesionMiembro, estadoInicial)
  const formularioRef = useEnfocarError(estado)
  const valores = estado.tipo === "error" ? estado.valores : {}

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-5" noValidate>
      <Aviso estado={estado} />
      <input type="hidden" name="siguiente" defaultValue={siguiente} />
      <FieldGroup className="gap-4">
        <Campo nombre="correo" etiqueta="Correo electrónico" type="email" autoComplete="email" spellCheck={false} required defaultValue={valores.correo} />
        <Campo
          nombre="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          descripcion={
            <Link href="/recuperar" className="font-medium text-azul underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />
      </FieldGroup>
      <BotonEnviar enviando={enviando} texto="Ingresar" textoEnviando="Ingresando…" />
    </form>
  )
}

export function FormularioRegistroMiembro() {
  const [estado, accion, enviando] = useActionState(registrarMiembro, estadoInicial)
  const formularioRef = useEnfocarError(estado)

  if (estado.tipo === "exito") return <Aviso estado={estado} />

  const valores = estado.tipo === "error" ? estado.valores : {}
  const errores = estado.tipo === "error" ? estado.errores : {}

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-5" noValidate>
      <Aviso estado={estado} />
      <FieldGroup className="gap-4">
        <Campo nombre="nombre" etiqueta="Nombre completo" autoComplete="name" required maxLength={120} defaultValue={valores.nombre} error={errores.nombre} />
        <Campo
          nombre="correo"
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
          defaultValue={valores.correo}
          error={errores.correo}
          descripcion="Usa el mismo correo con el que enviaste tu solicitud de afiliación."
        />
        <Campo nombre="contrasena" etiqueta="Contraseña" type="password" autoComplete="new-password" required minLength={8} error={errores.contrasena} descripcion="Mínimo 8 caracteres." />
        <Campo nombre="confirmacion" etiqueta="Confirma tu contraseña" type="password" autoComplete="new-password" required error={errores.confirmacion} />
      </FieldGroup>

      <Field orientation="horizontal" data-invalid={errores.aceptaAvisoPrivacidad?.length ? true : undefined}>
        <Checkbox
          id="cuenta-aceptaAvisoPrivacidad"
          name="aceptaAvisoPrivacidad"
          aria-invalid={errores.aceptaAvisoPrivacidad?.length ? true : undefined}
          aria-describedby={errores.aceptaAvisoPrivacidad?.length ? "cuenta-aceptaAvisoPrivacidad-error" : undefined}
        />
        <FieldContent>
          <FieldLabel htmlFor="cuenta-aceptaAvisoPrivacidad" className="font-normal text-foreground/80">
            <span>
              Acepto el{" "}
              <Link href="/aviso-de-privacidad" className="font-medium text-azul underline" target="_blank" rel="noopener noreferrer">
                aviso de privacidad
              </Link>
              .
            </span>
          </FieldLabel>
          <FieldError id="cuenta-aceptaAvisoPrivacidad-error">{errores.aceptaAvisoPrivacidad?.[0]}</FieldError>
        </FieldContent>
      </Field>

      <BotonEnviar enviando={enviando} texto="Crear cuenta" textoEnviando="Creando cuenta…" />
    </form>
  )
}

export function FormularioRecuperacion() {
  const [estado, accion, enviando] = useActionState(solicitarRecuperacion, estadoInicial)
  const formularioRef = useEnfocarError(estado)

  if (estado.tipo === "exito") return <Aviso estado={estado} />

  const errores = estado.tipo === "error" ? estado.errores : {}
  const valores = estado.tipo === "error" ? estado.valores : {}

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-5" noValidate>
      <Aviso estado={estado} />
      <Campo nombre="correo" etiqueta="Correo electrónico" type="email" autoComplete="email" spellCheck={false} required defaultValue={valores.correo} error={errores.correo} />
      <BotonEnviar enviando={enviando} texto="Enviar enlace" textoEnviando="Enviando…" />
    </form>
  )
}

export function FormularioRestablecer() {
  const [estado, accion, enviando] = useActionState(restablecerContrasena, estadoInicial)
  const formularioRef = useEnfocarError(estado)
  const errores = estado.tipo === "error" ? estado.errores : {}

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-5" noValidate>
      <Aviso estado={estado} />
      <FieldGroup className="gap-4">
        <Campo nombre="contrasena" etiqueta="Nueva contraseña" type="password" autoComplete="new-password" required minLength={8} error={errores.contrasena} descripcion="Mínimo 8 caracteres." />
        <Campo nombre="confirmacion" etiqueta="Confirma la contraseña" type="password" autoComplete="new-password" required error={errores.confirmacion} />
      </FieldGroup>
      <BotonEnviar enviando={enviando} texto="Guardar contraseña" textoEnviando="Guardando…" />
    </form>
  )
}
