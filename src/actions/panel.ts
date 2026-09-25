"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { sendEmail } from "@/lib/email/send"
import { applicationApprovedEmail } from "@/lib/email/templates"
import { requireBoardMember } from "@/lib/panel/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import { getSiteUrl } from "@/lib/site-url"
import {
  panelSignInSchema,
  reviewSchema,
  type PanelSignInFormState,
  type ReviewFormState,
} from "@/lib/validations/panel"

// After signing in, only internal panel routes are allowed as the return destination.
function getReturnPath(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/panel") && !value.startsWith("//") ? value : "/panel"
}

export async function signInToPanel(
  _previousState: PanelSignInFormState,
  formData: FormData
): Promise<PanelSignInFormState> {
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : ""
  const result = panelSignInSchema.safeParse({ email, password: formData.get("password") })

  if (!result.success) {
    return { status: "error", message: "Escribe un correo válido y tu contraseña.", email }
  }

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    return {
      status: "error",
      message:
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "Correo o contraseña incorrectos.",
      email,
    }
  }

  redirect(getReturnPath(formData.get("next")))
}

export async function signOutFromPanel() {
  const supabase = await createSessionSupabaseClient()
  await supabase.auth.signOut()
  redirect("/panel/ingresar")
}

const decisionMessages = {
  approved: "Solicitud aprobada.",
  rejected: "Solicitud rechazada.",
  pending: "La solicitud regresó a pendiente.",
} as const

export async function reviewApplication(
  id: string,
  _previousState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  // Server actions are public endpoints: permission is checked here, not only on the page.
  const member = await requireBoardMember()

  const result = reviewSchema.safeParse({
    id,
    decision: formData.get("decision"),
    notes: formData.get("notes") ?? "",
  })
  if (!result.success) {
    return {
      status: "error",
      message: result.error.issues[0]?.message ?? "No pudimos procesar la revisión. Recarga la página.",
    }
  }

  const { decision, notes } = result.data
  const isBackToPending = decision === "pending"

  const supabase = await createSessionSupabaseClient()
  const { data: previous } = await supabase
    .from("membership_applications")
    .select("status")
    .eq("id", result.data.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from("membership_applications")
    .update({
      status: decision,
      board_notes: notes || null,
      reviewed_by: isBackToPending ? null : member.userId,
      reviewed_at: isBackToPending ? null : new Date().toISOString(),
    })
    .eq("id", result.data.id)
    .select("id, full_name, email")

  if (error) {
    // membership_applications_pending_email_idx: only one pending application per email.
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Ya existe otra solicitud pendiente con este correo, así que esta no puede regresar a pendiente.",
      }
    }
    console.error("[panel] Could not review the application:", error.message)
    return { status: "error", message: "No se pudo guardar la revisión. Inténtalo de nuevo." }
  }

  // No affected rows: the application doesn't exist or RLS blocked it.
  if (!data?.length) {
    return { status: "error", message: "No encontramos la solicitud o ya no tienes permiso para revisarla." }
  }

  // The welcome email is sent only on the transition to approved (not when re-saving an approved one).
  const application = data[0]
  if (decision === "approved" && previous?.status !== "approved") {
    after(() =>
      sendEmail(application.email, applicationApprovedEmail({ fullName: application.full_name }, getSiteUrl().toString()))
    )
  }

  revalidatePath("/panel", "layout")
  return { status: "success", message: decisionMessages[decision] }
}
