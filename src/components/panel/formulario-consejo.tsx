"use client"

import { useActionState, useEffect, useRef } from "react"
import { UserPlusIcon } from "lucide-react"

import { agregarAlConsejo } from "@/acciones/consejo"
import { Aviso } from "@/components/sitio/aviso"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { descripcionRoles } from "@/lib/panel/roles"
import type { EstadoAgregarConsejo } from "@/lib/validaciones/consejo"

const estadoInicial: EstadoAgregarConsejo = { tipo: "inicial" }

export function FormularioConsejo() {
  const [estado, accion, enviando] = useActionState(agregarAlConsejo, estadoInicial)
  const formularioRef = useRef<HTMLFormElement>(null)
  const errores = estado.tipo === "error" ? estado.errores : {}

  useEffect(() => {
    if (estado.tipo === "exito") formularioRef.current?.reset()
  }, [estado])

  return (
    <form ref={formularioRef} action={accion} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={errores.nombre ? true : undefined}>
          <FieldLabel htmlFor="consejo-nombre">Nombre</FieldLabel>
          <Input id="consejo-nombre" name="nombre" required maxLength={120} className="h-11 rounded-xl px-4" aria-invalid={errores.nombre ? true : undefined} />
          <FieldError>{errores.nombre?.[0]}</FieldError>
        </Field>
        <Field data-invalid={errores.correo ? true : undefined}>
          <FieldLabel htmlFor="consejo-correo">Correo</FieldLabel>
          <Input
            id="consejo-correo"
            name="correo"
            type="email"
            required
            spellCheck={false}
            className="h-11 rounded-xl px-4"
            aria-invalid={errores.correo ? true : undefined}
          />
          <FieldError>{errores.correo?.[0]}</FieldError>
        </Field>
      </div>

      <FieldSet>
        <FieldLegend variant="label">Rol</FieldLegend>
        <RadioGroup name="rol" defaultValue="revisor" className="grid gap-3 sm:grid-cols-2">
          {(["revisor", "admin"] as const).map((rol) => (
            <FieldLabel key={rol} htmlFor={`consejo-rol-${rol}`} className="rounded-2xl!">
              <Field orientation="horizontal" className="p-4!">
                <FieldContent>
                  <FieldTitle className="text-azul">{descripcionRoles[rol].nombre}</FieldTitle>
                  <FieldDescription>{descripcionRoles[rol].resumen}</FieldDescription>
                </FieldContent>
                <RadioGroupItem id={`consejo-rol-${rol}`} value={rol} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <FieldError>{errores.rol?.[0]}</FieldError>
      </FieldSet>

      {estado.tipo !== "inicial" ? <Aviso tipo={estado.tipo}>{estado.mensaje}</Aviso> : null}

      <Button type="submit" size="lg" disabled={enviando} className="h-11 w-fit">
        {enviando ? <Spinner data-icon="inline-start" /> : <UserPlusIcon data-icon="inline-start" aria-hidden />}
        Agregar al Consejo
      </Button>
    </form>
  )
}
