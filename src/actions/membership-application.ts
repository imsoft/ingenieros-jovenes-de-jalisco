"use server"

import { after } from "next/server"
import { z } from "zod"

import { getBoardNotificationEmails, sendEmail } from "@/lib/email/send"
import { newApplicationEmail } from "@/lib/email/templates"
import { createPublicSupabaseClient } from "@/lib/supabase/server"
import {
  membershipApplicationSchema,
  type MembershipApplicationFormState,
  type MembershipApplicationValues,
} from "@/lib/validations/membership-application"
import { getSiteUrl } from "@/lib/site-url"

function getText(formData: FormData, field: string) {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

export async function submitMembershipApplication(
  _previousState: MembershipApplicationFormState,
  formData: FormData
): Promise<MembershipApplicationFormState> {
  const values: MembershipApplicationValues = {
    fullName: getText(formData, "fullName"),
    email: getText(formData, "email"),
    phone: getText(formData, "phone"),
    municipality: getText(formData, "municipality"),
  }

  // Honeypot field: only bots fill it in. Respond as success without saving anything.
  if (getText(formData, "website")) {
    return { status: "success", fullName: values.fullName }
  }

  const result = membershipApplicationSchema.safeParse({
    ...values,
    confirmsLegalAge: formData.get("confirmsLegalAge"),
    acceptsPrivacyNotice: formData.get("acceptsPrivacyNotice"),
  })

  if (!result.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      errors: z.flattenError(result.error).fieldErrors,
      values,
    }
  }

  const { fullName, email, phone, municipality } = result.data
  const supabase = createPublicSupabaseClient()

  if (!supabase) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[membership] Supabase not configured; application from ${email} was not saved.`)
      return { status: "success", fullName }
    }
    return {
      status: "error",
      message:
        "Las solicitudes aún no están disponibles. Intenta más tarde o escríbenos por redes sociales.",
      errors: {},
      values,
    }
  }

  const { error } = await supabase.from("membership_applications").insert({
    full_name: fullName,
    email,
    phone,
    municipality,
    confirms_legal_age: true,
    accepts_privacy_notice: true,
  })

  if (error) {
    // 23505: a pending application with this email already exists.
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Ya tenemos una solicitud pendiente con este correo. El Consejo te contactará pronto.",
        errors: { email: ["Este correo ya tiene una solicitud pendiente."] },
        values,
      }
    }
    console.error("[membership] Could not save the application:", error.message)
    return {
      status: "error",
      message: "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
      errors: {},
      values,
    }
  }

  // Notify the Board after responding, so the applicant doesn't have to wait.
  after(() =>
    sendEmail(
      getBoardNotificationEmails(),
      newApplicationEmail({ fullName, email, phone, municipality }, getSiteUrl().toString()),
      { replyTo: email }
    )
  )

  return { status: "success", fullName }
}
