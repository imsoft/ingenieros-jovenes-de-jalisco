"use client"

import { useActionState, useEffect, useRef } from "react"
import { UserPlusIcon } from "lucide-react"

import { addBoardMember } from "@/actions/board"
import { Notice } from "@/components/site/notice"
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
import { roleDescriptions } from "@/lib/panel/roles"
import type { AddBoardMemberFormState } from "@/lib/validations/board"

const initialState: AddBoardMemberFormState = { status: "idle" }

export function BoardMemberForm() {
  const [state, formAction, isPending] = useActionState(addBoardMember, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const errors = state.status === "error" ? state.errors : {}

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={errors.fullName ? true : undefined}>
          <FieldLabel htmlFor="board-full-name">Nombre</FieldLabel>
          <Input id="board-full-name" name="fullName" required maxLength={120} className="h-11 rounded-xl px-4" aria-invalid={errors.fullName ? true : undefined} />
          <FieldError>{errors.fullName?.[0]}</FieldError>
        </Field>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="board-email">Correo</FieldLabel>
          <Input
            id="board-email"
            name="email"
            type="email"
            required
            spellCheck={false}
            className="h-11 rounded-xl px-4"
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email?.[0]}</FieldError>
        </Field>
      </div>

      <FieldSet>
        <FieldLegend variant="label">Rol</FieldLegend>
        <RadioGroup name="role" defaultValue="reviewer" className="grid gap-3 sm:grid-cols-2">
          {(["reviewer", "admin"] as const).map((role) => (
            <FieldLabel key={role} htmlFor={`board-role-${role}`} className="rounded-2xl!">
              <Field orientation="horizontal" className="p-4!">
                <FieldContent>
                  <FieldTitle className="text-brand-blue">{roleDescriptions[role].name}</FieldTitle>
                  <FieldDescription>{roleDescriptions[role].summary}</FieldDescription>
                </FieldContent>
                <RadioGroupItem id={`board-role-${role}`} value={role} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <FieldError>{errors.role?.[0]}</FieldError>
      </FieldSet>

      {state.status !== "idle" ? <Notice variant={state.status}>{state.message}</Notice> : null}

      <Button type="submit" size="lg" disabled={isPending} className="h-11 w-fit">
        {isPending ? <Spinner data-icon="inline-start" /> : <UserPlusIcon data-icon="inline-start" aria-hidden />}
        Agregar al Consejo
      </Button>
    </form>
  )
}
