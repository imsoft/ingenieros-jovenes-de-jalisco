"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CircleCheckIcon, MapPinIcon, SendIcon, TriangleAlertIcon } from "lucide-react"

import { submitMembershipApplication } from "@/actions/membership-application"
import { InstagramIcon } from "@/components/site/social-icons"
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { site, suggestedMunicipalities } from "@/content/site"
import type { MembershipApplicationField, MembershipApplicationFormState } from "@/lib/validations/membership-application"

const initialState: MembershipApplicationFormState = { status: "idle" }

// Compares ignoring accents and case: "tonala" matches "Tonalá".
const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const matchesMunicipality = (municipality: string, query: string) => normalize(municipality).includes(normalize(query))

export function MembershipForm() {
  const [state, formAction, isPending] = useActionState(submitMembershipApplication, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  // Controlled so the typed value is kept if the submission comes back with errors.
  const [municipality, setMunicipality] = useState("")

  // After a submission with errors, move focus to the first invalid field.
  useEffect(() => {
    if (state.status !== "error") return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [state])

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 py-8 text-center motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:zoom-in-95"
      >
        <span className="flex size-18 items-center justify-center rounded-full bg-brand-orange/10">
          <CircleCheckIcon className="size-10 text-brand-orange" aria-hidden />
        </span>
        <p className="font-heading text-3xl font-semibold text-brand-blue uppercase">
          ¡Gracias, {state.fullName.split(" ")[0]}!
        </p>
        <p className="max-w-sm leading-relaxed text-muted-foreground">
          Recibimos tu solicitud. El Consejo Directivo la revisará y te contactará por correo o
          WhatsApp. Mientras tanto, conoce lo que hacemos en redes.
        </p>
        <a
          href={site.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "accent", size: "xl" })}
        >
          <InstagramIcon className="size-5" />
          Seguir en Instagram
        </a>
      </div>
    )
  }

  const errors = state.status === "error" ? state.errors : {}
  const values = state.status === "error" ? state.values : undefined

  const errorProps = (field: MembershipApplicationField) =>
    errors[field]?.length ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {}

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6" noValidate>
      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <FieldGroup>
        <FormField id="fullName" label="Nombre completo" error={errors.fullName}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Tu nombre y apellidos…"
            required
            maxLength={120}
            defaultValue={values?.fullName}
            className="h-12 rounded-xl px-4"
            {...errorProps("fullName")}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="email" label="Correo electrónico" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="nombre@correo.com…"
              required
              defaultValue={values?.email}
              className="h-12 rounded-xl px-4"
              {...errorProps("email")}
            />
          </FormField>
          <FormField id="phone" label="Teléfono / WhatsApp" error={errors.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="33 1234 5678…"
              required
              defaultValue={values?.phone}
              className="h-12 rounded-xl px-4"
              {...errorProps("phone")}
            />
          </FormField>
        </div>

        <FormField id="municipality" label="Municipio" error={errors.municipality}>
          <Autocomplete
            items={suggestedMunicipalities}
            value={municipality}
            onValueChange={setMunicipality}
            filter={matchesMunicipality}
            openOnInputClick
          >
            <AutocompleteInput
              id="municipality"
              name="municipality"
              autoComplete="off"
              placeholder="Escribe o elige tu municipio…"
              required
              className="h-12 rounded-xl px-4"
              {...errorProps("municipality")}
            />
            <AutocompleteContent>
              <AutocompleteEmpty>Puedes escribir cualquier municipio de Jalisco.</AutocompleteEmpty>
              <AutocompleteList>
                {(option: string) => (
                  <AutocompleteItem key={option} value={option}>
                    <MapPinIcon aria-hidden />
                    {option}
                  </AutocompleteItem>
                )}
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </FormField>
      </FieldGroup>

      {/* Honeypot field for bots, hidden from people and screen readers. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-4">
        <ConsentCheckbox id="confirmsLegalAge" error={errors.confirmsLegalAge}>
          Confirmo que soy mayor de 18 años.
        </ConsentCheckbox>
        <ConsentCheckbox id="acceptsPrivacyNotice" error={errors.acceptsPrivacyNotice}>
          He leído y acepto el{" "}
          <Link
            href="/aviso-de-privacidad"
            className="font-medium text-brand-blue underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aviso de privacidad
          </Link>
          .
        </ConsentCheckbox>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" variant="accent" size="xl" disabled={isPending} className="w-full">
          {isPending ? (
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

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      <FieldError id={`${id}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}

function ConsentCheckbox({
  id,
  error,
  children,
}: {
  id: MembershipApplicationField
  error?: string[]
  children: React.ReactNode
}) {
  const hasError = Boolean(error?.length)

  return (
    <Field data-invalid={hasError || undefined} className="gap-1">
      {/* The label wraps the checkbox so the text and the control share the click area. */}
      <FieldLabel className="w-full cursor-pointer items-start gap-3 font-normal text-foreground/80">
        <input
          id={id}
          name={id}
          type="checkbox"
          required
          className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-brand-blue"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </FieldLabel>
      <FieldError id={`${id}-error`} className="pl-7.5">
        {error?.[0]}
      </FieldError>
    </Field>
  )
}
