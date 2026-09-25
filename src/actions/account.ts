"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { safeRedirectPath } from "@/lib/account/routes"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import {
  memberSignInSchema,
  memberSignUpSchema,
  newPasswordSchema,
  passwordResetRequestSchema,
  type AccountFormState,
} from "@/lib/validations/account"

function getText(formData: FormData, field: string) {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

// Origin of the current request (works the same locally, in previews and in production).
// Supabase only accepts redirects that are on its list of allowed URLs.
async function getRequestOrigin() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000"
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${protocol}://${host}`
}

const isEmailNotAuthorized = (message: string) => message.includes("EMAIL_NOT_AUTHORIZED")

export async function signInMember(_prevState: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const email = getText(formData, "email")
  const result = memberSignInSchema.safeParse({ email, password: formData.get("password") })
  if (!result.success) {
    return { status: "error", message: "Escribe tu correo y tu contraseña.", errors: {}, values: { email } }
  }

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada (y la de spam)."
        : error.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "Correo o contraseña incorrectos."
    return { status: "error", message, errors: {}, values: { email } }
  }

  redirect(safeRedirectPath(formData.get("next")))
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeRedirectPath(formData.get("next"))
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await getRequestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  })

  if (error || !data.url) {
    console.error("[account] Could not start Google sign-in:", error?.message)
    redirect("/ingresar?error=google")
  }
  redirect(data.url)
}

export async function signUpMember(_prevState: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const values = { fullName: getText(formData, "fullName"), email: getText(formData, "email") }
  const result = memberSignUpSchema.safeParse({
    ...values,
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
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

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${await getRequestOrigin()}/auth/confirm?next=/mi-perfil`,
      data: { full_name: result.data.fullName },
    },
  })

  if (error) {
    if (isEmailNotAuthorized(error.message)) {
      return {
        status: "error",
        message:
          "Ese correo no tiene una solicitud de afiliación aprobada. Usa el mismo correo con el que te afiliaste o solicita tu afiliación primero.",
        errors: { email: ["Correo sin solicitud aprobada."] },
        values,
      }
    }
    if (error.code === "weak_password") {
      return {
        status: "error",
        message: "Esa contraseña es muy débil. Usa una más larga o con más variedad de caracteres.",
        errors: { password: ["Contraseña demasiado débil."] },
        values,
      }
    }
    console.error("[account] Could not create the account:", error.code, error.message)
    return { status: "error", message: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos.", errors: {}, values }
  }

  // Supabase doesn't reveal whether the email already had an account: the message is the same in both cases.
  return {
    status: "success",
    message: `Te enviamos un correo a ${result.data.email} para confirmar tu cuenta. Abre el enlace para continuar (revisa también tu carpeta de spam).`,
  }
}

export async function requestPasswordReset(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const email = getText(formData, "email")
  const result = passwordResetRequestSchema.safeParse({ email })
  if (!result.success) {
    return {
      status: "error",
      message: "Escribe un correo válido.",
      errors: z.flattenError(result.error).fieldErrors,
      values: { email },
    }
  }

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${await getRequestOrigin()}/auth/confirm?next=/restablecer`,
  })
  if (error && error.status !== 429) console.error("[account] Password reset:", error.code, error.message)

  // Same message whether or not the account exists, so registered emails aren't revealed.
  return {
    status: "success",
    message: "Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.",
  }
}

export async function resetPassword(_prevState: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const result = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  })
  if (!result.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      errors: z.flattenError(result.error).fieldErrors,
      values: {},
    }
  }

  const supabase = await createSessionSupabaseClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect("/ingresar?error=session-expired")

  const { error } = await supabase.auth.updateUser({ password: result.data.password })
  if (error) {
    const message =
      error.code === "same_password"
        ? "La nueva contraseña debe ser distinta a la anterior."
        : error.code === "weak_password"
          ? "Esa contraseña es muy débil. Usa una más larga."
          : "No pudimos guardar tu nueva contraseña. Solicita un enlace nuevo."
    return { status: "error", message, errors: {}, values: {} }
  }

  redirect("/miembros")
}

export async function signOutMember() {
  const supabase = await createSessionSupabaseClient()
  await supabase.auth.signOut()
  redirect("/")
}

// Deletes the member's account (ARCO rights): first their photos, then the account and, by cascade, their profile.
export async function deleteMyAccount(): Promise<{ ok: false; message: string } | void> {
  const supabase = await createSessionSupabaseClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) redirect("/ingresar")

  // Profile photos live in {userId}/ and company logos in {userId}/companies/; folders list without an id.
  const files: string[] = []
  for (const folder of [userId, `${userId}/companies`]) {
    const { data } = await supabase.storage.from("profiles").list(folder, { limit: 100 })
    files.push(...(data ?? []).filter((file) => file.id).map((file) => `${folder}/${file.name}`))
  }
  if (files.length > 0) {
    const { error: photosError } = await supabase.storage.from("profiles").remove(files)
    if (photosError) console.error("[account] Could not delete the photos:", photosError.message)
  }

  const { error } = await supabase.rpc("delete_my_account")
  if (error) {
    if (error.message.includes("IS_BOARD_MEMBER")) {
      return {
        ok: false,
        message: "Eres parte del Consejo. Pide a un administrador que te dé de baja del Consejo y luego elimina tu cuenta.",
      }
    }
    console.error("[account] Could not delete the account:", error.code, error.message)
    return { ok: false, message: "No pudimos eliminar tu cuenta. Inténtalo de nuevo." }
  }

  // The account no longer exists: only this browser's session cookies are cleared.
  await supabase.auth.signOut({ scope: "local" })
  revalidatePath("/miembros", "layout")
  redirect("/ingresar?notice=account-deleted")
}
