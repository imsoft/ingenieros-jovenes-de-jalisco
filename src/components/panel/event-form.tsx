"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { CircleCheckIcon, LockIcon, SaveIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { saveEvent } from "@/actions/panel-events"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { getEventSlug, type EventFormValues } from "@/lib/events/form"
import type { EventFormState } from "@/lib/validations/panel-event"

type TextField = Exclude<keyof EventFormValues, "registrationOpen" | "isPublished">

const initialState: EventFormState = { status: "idle" }

export function EventForm({
  eventId,
  initialValues,
}: {
  eventId: string | null
  initialValues: EventFormValues
}) {
  const [state, formAction, isPending] = useActionState(saveEvent.bind(null, eventId), initialState)
  const formRef = useRef<HTMLFormElement>(null)
  // Title and date are controlled to show a live preview of the slug that will be generated.
  const [title, setTitle] = useState(initialValues.title)
  const [date, setDate] = useState(initialValues.date)
  const slugPreview = eventId ? initialValues.slug : getEventSlug(title, date)

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state])

  const values = state.status === "error" ? state.values : initialValues
  const errors = state.status === "error" ? state.errors : {}

  const fieldProps = (name: TextField) => ({
    id: `event-${name}`,
    name,
    defaultValue: values[name],
    ...(errors[name]?.length ? { "aria-invalid": true, "aria-describedby": `event-${name}-error` } : {}),
  })

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-10" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : state.status === "success" ? (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-brand-blue/10 px-4 py-3 text-sm text-brand-blue">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <FormSection title="Información">
        <FormField name="title" label="Título" error={errors.title}>
          <Input
            {...fieldProps("title")}
            defaultValue={undefined}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="Ej. Jalisco al Grito…"
            className="h-11 rounded-xl px-4"
          />
        </FormField>
        <FormField
          name="slug"
          label="Dirección de la página"
          description={
            eventId
              ? "Se fijó al crear el evento para no romper los enlaces que ya se compartieron."
              : "Se genera automáticamente con el título y el año del evento."
          }
        >
          <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-secondary/70">
            <span className="flex items-center pl-4 text-sm text-muted-foreground select-none">/eventos/</span>
            <input
              id="event-slug"
              value={slugPreview}
              placeholder="se-genera-con-el-titulo"
              readOnly
              disabled
              className="h-11 min-w-0 flex-1 cursor-not-allowed truncate bg-transparent px-1 text-base text-foreground/70 outline-none placeholder:text-muted-foreground/70 md:text-sm"
            />
            <span className="flex items-center px-4 text-muted-foreground" title="Campo automático">
              <LockIcon className="size-4" aria-hidden />
            </span>
          </div>
        </FormField>
        <FormField name="summary" label="Resumen" description="Una o dos frases. Aparece en las tarjetas y al compartir el enlace." error={errors.summary}>
          <Textarea {...fieldProps("summary")} rows={2} maxLength={300} className="rounded-xl px-4 py-3" />
        </FormField>
        <FormField name="description" label="Descripción (opcional)" description="Programa, invitados, código de vestimenta… Los saltos de línea se respetan." error={errors.description}>
          <Textarea {...fieldProps("description")} rows={6} maxLength={5000} className="rounded-xl px-4 py-3" />
        </FormField>
      </FormSection>

      <FormSection title="Fecha y lugar" description="Horario del centro de México.">
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField name="date" label="Fecha" error={errors.date}>
            <Input
              {...fieldProps("date")}
              defaultValue={undefined}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              required
              className="h-11 rounded-xl px-4"
            />
          </FormField>
          <FormField name="startTime" label="Inicia" error={errors.startTime}>
            <Input {...fieldProps("startTime")} type="time" required className="h-11 rounded-xl px-4" />
          </FormField>
          <FormField name="endTime" label="Termina (opcional)" error={errors.endTime}>
            <Input {...fieldProps("endTime")} type="time" className="h-11 rounded-xl px-4" />
          </FormField>
        </div>
        <FormField name="venue" label="Lugar" error={errors.venue}>
          <Input {...fieldProps("venue")} required maxLength={160} placeholder="Ej. Terraza Aguamarina…" className="h-11 rounded-xl px-4" />
        </FormField>
        <FormField name="address" label="Dirección (opcional)" error={errors.address}>
          <Input {...fieldProps("address")} maxLength={300} autoComplete="off" placeholder="Calle, número, colonia, municipio…" className="h-11 rounded-xl px-4" />
        </FormField>
        <FormField name="mapUrl" label="Enlace de Google Maps (opcional)" error={errors.mapUrl}>
          <Input {...fieldProps("mapUrl")} type="url" inputMode="url" spellCheck={false} maxLength={500} placeholder="https://maps.app.goo.gl/…" className="h-11 rounded-xl px-4" />
        </FormField>
      </FormSection>

      <FormSection
        title="Precios y cupo"
        description="Deja el precio público vacío si la entrada es libre. Si no hay precio especial para miembros, deja ese campo vacío."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField name="publicPrice" label="Precio público" error={errors.publicPrice}>
            <Input {...fieldProps("publicPrice")} inputMode="decimal" autoComplete="off" placeholder="350…" className="h-11 rounded-xl px-4" />
          </FormField>
          <FormField name="memberPrice" label="Precio miembros" error={errors.memberPrice}>
            <Input {...fieldProps("memberPrice")} inputMode="decimal" autoComplete="off" placeholder="300…" className="h-11 rounded-xl px-4" />
          </FormField>
          <FormField name="capacity" label="Cupo (opcional)" error={errors.capacity}>
            <Input {...fieldProps("capacity")} inputMode="numeric" autoComplete="off" placeholder="Sin límite…" className="h-11 rounded-xl px-4" />
          </FormField>
        </div>
        <FormField
          name="paymentInstructions"
          label="Instrucciones de pago (opcional)"
          description="Se muestran al confirmar el registro: datos de transferencia, pago en taquilla, a quién enviar el comprobante…"
          error={errors.paymentInstructions}
        >
          <Textarea {...fieldProps("paymentInstructions")} rows={4} maxLength={2000} className="rounded-xl px-4 py-3" />
        </FormField>
      </FormSection>

      <FormSection title="Publicación">
        <div className="flex flex-col gap-3">
          <CheckboxCard name="isPublished" defaultChecked={values.isPublished} title="Publicado" description="Visible en el sitio. Si no, se guarda como borrador." />
          <CheckboxCard name="registrationOpen" defaultChecked={values.registrationOpen} title="Registro abierto" description="Permite registrarse en línea hasta que inicie el evento o se llene el cupo." />
        </div>
      </FormSection>

      <Button type="submit" variant="accent" size="xl" disabled={isPending} className="w-full sm:w-fit">
        {isPending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" aria-hidden />}
        {eventId ? "Guardar cambios" : "Crear evento"}
      </Button>
    </form>
  )
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 flex flex-col gap-1">
        <span className="font-heading text-lg font-semibold text-brand-blue uppercase">{title}</span>
        {description ? <span className="text-sm text-muted-foreground">{description}</span> : null}
      </legend>
      {children}
    </fieldset>
  )
}

function FormField({
  name,
  label,
  description,
  error,
  children,
}: {
  name: TextField
  label: string
  description?: string
  error?: string[]
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error?.length ? true : undefined}>
      <FieldLabel htmlFor={`event-${name}`}>{label}</FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError id={`event-${name}-error`}>{error?.[0]}</FieldError>
    </Field>
  )
}

function CheckboxCard({
  name,
  defaultChecked,
  title,
  description,
}: {
  name: "isPublished" | "registrationOpen"
  defaultChecked: boolean
  title: string
  description: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-blue/10 p-4 transition-colors hover:bg-secondary",
        "has-checked:border-brand-blue/30 has-checked:bg-brand-blue/5"
      )}
    >
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-brand-blue" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  )
}
