"use client"

import { useActionState } from "react"
import { CheckIcon, CircleCheckIcon, RotateCcwIcon, TriangleAlertIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { reviewApplication } from "@/actions/panel"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { ApplicationStatus } from "@/lib/panel/statuses"
import type { ReviewFormState } from "@/lib/validations/panel"

const initialState: ReviewFormState = { status: "idle" }

export function ReviewForm({
  id,
  currentStatus,
  notes,
}: {
  id: string
  currentStatus: ApplicationStatus
  notes: string | null
}) {
  const [state, formAction, isPending] = useActionState(reviewApplication.bind(null, id), initialState)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="notes">Notas internas</FieldLabel>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={1000}
          defaultValue={notes ?? ""}
          placeholder="Ej. Se le contactó por WhatsApp para darle la bienvenida…"
          className="rounded-xl px-4 py-3"
        />
        <FieldDescription>Solo las ve el Consejo. Se guardan junto con tu decisión.</FieldDescription>
      </Field>

      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
            state.status === "error" ? "bg-destructive/10 text-destructive" : "bg-brand-blue/10 text-brand-blue"
          )}
        >
          {state.status === "error" ? (
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {currentStatus !== "approved" ? (
          <Button type="submit" name="decision" value="approved" size="xl" disabled={isPending} className="sm:flex-1">
            {isPending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" aria-hidden />}
            Aprobar
          </Button>
        ) : null}
        {currentStatus !== "rejected" ? (
          <Button
            type="submit"
            name="decision"
            value="rejected"
            variant="destructive"
            size="xl"
            disabled={isPending}
            className="sm:flex-1"
          >
            <XIcon data-icon="inline-start" aria-hidden />
            Rechazar
          </Button>
        ) : null}
        {currentStatus !== "pending" ? (
          <Button
            type="submit"
            name="decision"
            value="pending"
            variant="outline"
            size="xl"
            disabled={isPending}
            className="sm:flex-1"
          >
            <RotateCcwIcon data-icon="inline-start" aria-hidden />
            Regresar a pendiente
          </Button>
        ) : null}
      </div>
    </form>
  )
}
