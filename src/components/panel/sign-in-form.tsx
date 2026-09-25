"use client"

import { useActionState } from "react"
import { TriangleAlertIcon } from "lucide-react"

import { signInToPanel } from "@/actions/panel"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { PanelSignInFormState } from "@/lib/validations/panel"

const initialState: PanelSignInFormState = { status: "idle" }

export function PanelSignInForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(signInToPanel, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="next" defaultValue={next} />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            required
            defaultValue={state.status === "error" ? state.email : undefined}
            className="h-12 rounded-xl px-4"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 rounded-xl px-4"
          />
        </Field>
      </FieldGroup>

      <Button type="submit" variant="accent" size="xl" disabled={isPending} className="w-full">
        {isPending ? (
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
