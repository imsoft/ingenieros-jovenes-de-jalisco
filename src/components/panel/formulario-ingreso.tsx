"use client"

import { useActionState } from "react"
import { TriangleAlertIcon } from "lucide-react"

import { ingresarAlPanel } from "@/acciones/panel"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { EstadoFormularioIngreso } from "@/lib/validaciones/panel"

const estadoInicial: EstadoFormularioIngreso = { tipo: "inicial" }

export function FormularioIngreso({ siguiente }: { siguiente: string }) {
  const [estado, accion, enviando] = useActionState(ingresarAlPanel, estadoInicial)

  return (
    <form action={accion} className="flex flex-col gap-6" noValidate>
      {estado.tipo === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {estado.mensaje}
        </p>
      ) : null}

      <input type="hidden" name="siguiente" defaultValue={siguiente} />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="correo">Correo electrónico</FieldLabel>
          <Input
            id="correo"
            name="correo"
            type="email"
            autoComplete="username"
            spellCheck={false}
            required
            defaultValue={estado.tipo === "error" ? estado.correo : undefined}
            className="h-12 rounded-xl px-4"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="contrasena">Contraseña</FieldLabel>
          <Input
            id="contrasena"
            name="contrasena"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 rounded-xl px-4"
          />
        </Field>
      </FieldGroup>

      <Button type="submit" variant="acento" size="xl" disabled={enviando} className="w-full">
        {enviando ? (
          <>
            <Spinner data-icon="inline-start" />
            Ingresando…
          </>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  )
}
