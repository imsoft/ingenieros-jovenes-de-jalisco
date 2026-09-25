"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { sendEmail } from "@/lib/email/send"
import { eventRegistrationEmail } from "@/lib/email/templates"
import { formatLongDate, formatPrice, formatTimeRange } from "@/lib/events/format"
import { getEventBySlug } from "@/lib/events/public"
import { getSiteUrl } from "@/lib/site-url"
import { createPublicSupabaseClient } from "@/lib/supabase/server"
import {
  eventRegistrationSchema,
  type EventRegistrationField,
  type EventRegistrationFormState,
  type EventRegistrationValues,
} from "@/lib/validations/event-registration"

function getText(formData: FormData, field: string) {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

type RegistrationResult = {
  confirmation_code: string
  amount_due: number | string
  is_member: boolean
  payment_instructions: string | null
}

const databaseErrorMessages: Record<string, string> = {
  EVENT_FULL: "Lo sentimos, el cupo de este evento se acaba de llenar.",
  REGISTRATION_CLOSED: "El registro para este evento ya está cerrado.",
  EVENT_UNAVAILABLE: "Este evento ya no está disponible.",
}

export async function registerForEvent(
  eventId: string,
  slug: string,
  _previousState: EventRegistrationFormState,
  formData: FormData
): Promise<EventRegistrationFormState> {
  const values: EventRegistrationValues = {
    fullName: getText(formData, "fullName"),
    email: getText(formData, "email"),
    phone: getText(formData, "phone"),
    organization: getText(formData, "organization"),
  }

  // Honeypot field: only bots fill it in.
  if (getText(formData, "website")) {
    return { status: "error", message: "No pudimos completar tu registro.", errors: {}, values }
  }

  const result = eventRegistrationSchema.safeParse({
    ...values,
    eventId,
    acceptsPrivacyNotice: formData.get("acceptsPrivacyNotice"),
  })

  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error)
    const errors: Partial<Record<EventRegistrationField, string[]>> = {
      fullName: fieldErrors.fullName,
      email: fieldErrors.email,
      phone: fieldErrors.phone,
      organization: fieldErrors.organization,
      acceptsPrivacyNotice: fieldErrors.acceptsPrivacyNotice,
    }
    return { status: "error", message: "Revisa los campos marcados.", errors, values }
  }

  const supabase = createPublicSupabaseClient()
  if (!supabase) {
    return { status: "error", message: "El registro no está disponible en este momento.", errors: {}, values }
  }

  const { fullName, email, phone, organization } = result.data
  const { data, error } = await supabase
    .rpc("register_for_event", {
      p_event_id: result.data.eventId,
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_organization: organization || null,
    })
    .single<RegistrationResult>()

  if (error) {
    const code = Object.keys(databaseErrorMessages).find((key) => error.message.includes(key))
    if (code) {
      revalidatePath(`/eventos/${slug}`)
      return { status: "error", message: databaseErrorMessages[code], errors: {}, values }
    }
    if (error.code === "23505" && error.message.includes("active_email")) {
      return {
        status: "error",
        message: "Ya hay un registro con este correo para este evento. Revisa tu folio o escríbenos por redes.",
        errors: { email: ["Este correo ya está registrado en el evento."] },
        values,
      }
    }
    console.error("[events] Could not register:", error.code, error.message)
    return {
      status: "error",
      message: "No pudimos completar tu registro. Intenta de nuevo en unos minutos.",
      errors: {},
      values,
    }
  }

  // Remaining capacity changed: refresh the pages that show it.
  revalidatePath(`/eventos/${slug}`)
  revalidatePath("/eventos")
  revalidatePath("/")

  const amount = Number(data.amount_due)
  after(async () => {
    const event = await getEventBySlug(slug)
    if (!event) return
    await sendEmail(
      email,
      eventRegistrationEmail(
        {
          fullName,
          confirmationCode: data.confirmation_code,
          event: {
            title: event.title,
            slug: event.slug,
            date: formatLongDate(event.starts_at),
            timeRange: formatTimeRange(event),
            venue: event.venue,
            address: event.address,
          },
          amount: formatPrice(amount),
          isFree: amount === 0,
          isMember: data.is_member,
          paymentInstructions: data.payment_instructions,
        },
        getSiteUrl().toString()
      ),
      { idempotencyKey: `registration-${data.confirmation_code}` }
    )
  })

  return {
    status: "success",
    confirmationCode: data.confirmation_code,
    amount,
    isMember: data.is_member,
    paymentInstructions: data.payment_instructions,
  }
}
