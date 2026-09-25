import { z } from "zod"

const email = z
  .string({ error: "Escribe tu correo." })
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email("Escribe un correo válido."))

const newPassword = z
  .string({ error: "Escribe una contraseña." })
  .min(8, "Usa al menos 8 caracteres.")
  .max(72, "Máximo 72 caracteres.")

export const memberSignInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
})

export const memberSignUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Escribe tu nombre.").max(120, "Máximo 120 caracteres."),
    email,
    password: newPassword,
    confirmation: z.string(),
    acceptsPrivacyNotice: z.literal("on", { error: "Debes aceptar el aviso de privacidad." }),
  })
  .refine((data) => data.password === data.confirmation, {
    path: ["confirmation"],
    message: "Las contraseñas no coinciden.",
  })

export const passwordResetRequestSchema = z.object({ email })

export const newPasswordSchema = z
  .object({ password: newPassword, confirmation: z.string() })
  .refine((data) => data.password === data.confirmation, {
    path: ["confirmation"],
    message: "Las contraseñas no coinciden.",
  })

export type AccountField = "fullName" | "email" | "password" | "confirmation" | "acceptsPrivacyNotice"

export type AccountFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error"
      message: string
      errors: Partial<Record<AccountField, string[]>>
      values: Partial<Record<"fullName" | "email", string>>
    }
