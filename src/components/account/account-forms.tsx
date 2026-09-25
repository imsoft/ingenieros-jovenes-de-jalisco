"use client"

import { useActionState, useEffect, useRef } from "react"
import Link from "next/link"

import { requestPasswordReset, resetPassword, signInMember, signUpMember } from "@/actions/account"
import { Notice } from "@/components/site/notice"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { AccountField, AccountFormState } from "@/lib/validations/account"

const initialState: AccountFormState = { status: "idle" }

function useFocusOnError(state: AccountFormState) {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status !== "error") return
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ;(invalid ?? formRef.current?.querySelector<HTMLElement>("input:not([type=hidden])"))?.focus()
  }, [state])
  return formRef
}

function FormNotice({ state }: { state: AccountFormState }) {
  if (state.status === "idle") return null
  return <Notice variant={state.status}>{state.message}</Notice>
}

function TextField({
  id,
  name,
  label,
  error,
  description,
  ...props
}: React.ComponentProps<"input"> & {
  name: AccountField
  label: string
  error?: string[]
  description?: React.ReactNode
}) {
  const fieldId = id ?? `account-${name}`
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Input
        id={fieldId}
        name={name}
        className="h-12 rounded-xl px-4"
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={error?.length ? `${fieldId}-error` : undefined}
        {...props}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError id={`${fieldId}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}

function FormSubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <Button type="submit" variant="accent" size="xl" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  )
}

export function MemberSignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInMember, initialState)
  const formRef = useFocusOnError(state)
  const values = state.status === "error" ? state.values : {}

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <FormNotice state={state} />
      <input type="hidden" name="next" defaultValue={next} />
      <FieldGroup className="gap-4">
        <TextField name="email" label="Correo electrónico" type="email" autoComplete="email" spellCheck={false} required defaultValue={values.email} />
        <TextField
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          description={
            <Link href="/recuperar" className="font-medium text-brand-blue underline-offset-4 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />
      </FieldGroup>
      <FormSubmitButton pending={pending} label="Ingresar" pendingLabel="Ingresando…" />
    </form>
  )
}

export function MemberSignUpForm() {
  const [state, formAction, pending] = useActionState(signUpMember, initialState)
  const formRef = useFocusOnError(state)

  if (state.status === "success") return <FormNotice state={state} />

  const values = state.status === "error" ? state.values : {}
  const errors = state.status === "error" ? state.errors : {}

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <FormNotice state={state} />
      <FieldGroup className="gap-4">
        <TextField name="fullName" label="Nombre completo" autoComplete="name" required maxLength={120} defaultValue={values.fullName} error={errors.fullName} />
        <TextField
          name="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
          defaultValue={values.email}
          error={errors.email}
          description="Usa el mismo correo con el que enviaste tu solicitud de afiliación."
        />
        <TextField name="password" label="Contraseña" type="password" autoComplete="new-password" required minLength={8} error={errors.password} description="Mínimo 8 caracteres." />
        <TextField name="confirmation" label="Confirma tu contraseña" type="password" autoComplete="new-password" required error={errors.confirmation} />
      </FieldGroup>

      <Field orientation="horizontal" data-invalid={errors.acceptsPrivacyNotice?.length ? true : undefined}>
        <Checkbox
          id="account-acceptsPrivacyNotice"
          name="acceptsPrivacyNotice"
          aria-invalid={errors.acceptsPrivacyNotice?.length ? true : undefined}
          aria-describedby={errors.acceptsPrivacyNotice?.length ? "account-acceptsPrivacyNotice-error" : undefined}
        />
        <FieldContent>
          <FieldLabel htmlFor="account-acceptsPrivacyNotice" className="font-normal text-foreground/80">
            <span>
              Acepto el{" "}
              <Link href="/aviso-de-privacidad" className="font-medium text-brand-blue underline" target="_blank" rel="noopener noreferrer">
                aviso de privacidad
              </Link>
              .
            </span>
          </FieldLabel>
          <FieldError id="account-acceptsPrivacyNotice-error">{errors.acceptsPrivacyNotice?.[0]}</FieldError>
        </FieldContent>
      </Field>

      <FormSubmitButton pending={pending} label="Crear cuenta" pendingLabel="Creando cuenta…" />
    </form>
  )
}

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState)
  const formRef = useFocusOnError(state)

  if (state.status === "success") return <FormNotice state={state} />

  const errors = state.status === "error" ? state.errors : {}
  const values = state.status === "error" ? state.values : {}

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <FormNotice state={state} />
      <TextField name="email" label="Correo electrónico" type="email" autoComplete="email" spellCheck={false} required defaultValue={values.email} error={errors.email} />
      <FormSubmitButton pending={pending} label="Enviar enlace" pendingLabel="Enviando…" />
    </form>
  )
}

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState)
  const formRef = useFocusOnError(state)
  const errors = state.status === "error" ? state.errors : {}

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <FormNotice state={state} />
      <FieldGroup className="gap-4">
        <TextField name="password" label="Nueva contraseña" type="password" autoComplete="new-password" required minLength={8} error={errors.password} description="Mínimo 8 caracteres." />
        <TextField name="confirmation" label="Confirma la contraseña" type="password" autoComplete="new-password" required error={errors.confirmation} />
      </FieldGroup>
      <FormSubmitButton pending={pending} label="Guardar contraseña" pendingLabel="Guardando…" />
    </form>
  )
}
