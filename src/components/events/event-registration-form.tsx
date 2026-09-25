"use client"

import { useActionState, useEffect, useRef } from "react"
import Link from "next/link"
import { CircleCheckIcon, TicketIcon, TriangleAlertIcon } from "lucide-react"

import { registerForEvent } from "@/actions/events"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { formatPrice } from "@/lib/events/format"
import type { EventRegistrationField, EventRegistrationFormState } from "@/lib/validations/event-registration"

const initialState: EventRegistrationFormState = { status: "idle" }

export function EventRegistrationForm({ eventId, slug }: { eventId: string; slug: string }) {
  const [state, formAction, isPending] = useActionState(registerForEvent.bind(null, eventId, slug), initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
    if (state.status === "success") confirmationRef.current?.focus()
  }, [state])

  if (state.status === "success") {
    const isFree = state.amount === 0
    return (
      <div
        ref={confirmationRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col gap-5 outline-none motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-orange/10">
            <CircleCheckIcon className="size-7 text-brand-orange" aria-hidden />
          </span>
          <p className="font-heading text-2xl leading-tight font-semibold text-brand-blue uppercase">¡Registro confirmado!</p>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary p-4">
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Folio</dt>
            <dd className="mt-1 font-mono text-lg font-bold tracking-wider text-brand-blue">{state.confirmationCode}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {isFree ? "Costo" : "Monto a pagar"}
            </dt>
            <dd className="mt-1 font-heading text-2xl font-bold text-brand-blue tabular-nums">
              {isFree ? "Sin costo" : formatPrice(state.amount)}
            </dd>
          </div>
        </dl>

        {!isFree ? (
          <p className="text-sm leading-relaxed text-foreground/80">
            {state.isMember
              ? "Aplicamos tu precio de miembro del Colectivo."
              : "Se aplicó el precio público."}
          </p>
        ) : null}

        {!isFree && state.paymentInstructions ? (
          <div className="rounded-2xl border border-brand-blue/10 p-4">
            <p className="font-semibold text-brand-blue">Cómo pagar</p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/80">{state.paymentInstructions}</p>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Guarda tu folio: lo necesitarás para confirmar tu pago y en la entrada del evento.
        </p>

        {!state.isMember ? (
          <p className="text-sm text-foreground/75">
            ¿Quieres precio de miembro en próximos eventos?{" "}
            <Link href="/#unete" className="font-medium text-brand-blue underline">
              Únete al Colectivo
            </Link>
            .
          </p>
        ) : null}
      </div>
    )
  }

  const errors = state.status === "error" ? state.errors : {}
  const values = state.status === "error" ? state.values : undefined

  const errorProps = (field: EventRegistrationField) =>
    errors[field]?.length ? { "aria-invalid": true, "aria-describedby": `registration-${field}-error` } : {}

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <FieldGroup className="gap-4">
        <FormField id="fullName" label="Nombre completo" error={errors.fullName}>
          <Input id="registration-fullName" name="fullName" autoComplete="name" required maxLength={120} defaultValue={values?.fullName} className="h-11 rounded-xl px-4" {...errorProps("fullName")} />
        </FormField>
        <FormField id="email" label="Correo electrónico" error={errors.email}>
          <Input id="registration-email" name="email" type="email" autoComplete="email" spellCheck={false} required defaultValue={values?.email} className="h-11 rounded-xl px-4" {...errorProps("email")} />
        </FormField>
        <FormField id="phone" label="Teléfono / WhatsApp" error={errors.phone}>
          <Input id="registration-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="33 1234 5678…" required defaultValue={values?.phone} className="h-11 rounded-xl px-4" {...errorProps("phone")} />
        </FormField>
        <FormField id="organization" label="Empresa o universidad (opcional)" error={errors.organization}>
          <Input id="registration-organization" name="organization" autoComplete="organization" maxLength={120} defaultValue={values?.organization} className="h-11 rounded-xl px-4" {...errorProps("organization")} />
        </FormField>
      </FieldGroup>

      {/* Honeypot field for bots, hidden from people and screen readers. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="registration-website">Sitio web</label>
        <input id="registration-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Field data-invalid={errors.acceptsPrivacyNotice?.length ? true : undefined} className="gap-1">
        <FieldLabel className="w-full cursor-pointer items-start gap-3 font-normal text-foreground/80">
          <input
            id="registration-acceptsPrivacyNotice"
            name="acceptsPrivacyNotice"
            type="checkbox"
            required
            className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-brand-blue"
            {...errorProps("acceptsPrivacyNotice")}
          />
          <span>
            Acepto el{" "}
            <Link href="/aviso-de-privacidad" className="font-medium text-brand-blue underline" target="_blank" rel="noopener noreferrer">
              aviso de privacidad
            </Link>
            .
          </span>
        </FieldLabel>
        <FieldError id="registration-acceptsPrivacyNotice-error" className="pl-7.5">
          {errors.acceptsPrivacyNotice?.[0]}
        </FieldError>
      </Field>

      <Button type="submit" variant="accent" size="xl" disabled={isPending} className="w-full">
        {isPending ? (
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

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: EventRegistrationField
  label: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={`registration-${id}`}>{label}</FieldLabel>
      {children}
      <FieldError id={`registration-${id}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}
