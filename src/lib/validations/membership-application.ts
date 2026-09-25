import { z } from "zod"

const requiredCheckbox = (message: string) => z.literal("on", { error: message })

export const membershipApplicationSchema = z.object({
  fullName: z
    .string({ error: "Escribe tu nombre completo." })
    .trim()
    .min(3, "Escribe tu nombre completo.")
    .max(120, "El nombre es demasiado largo."),
  email: z
    .string({ error: "Escribe tu correo." })
    .trim()
    .toLowerCase()
    .max(254, "El correo es demasiado largo.")
    .pipe(z.email("Escribe un correo válido.")),
  phone: z
    .string({ error: "Escribe tu teléfono." })
    .trim()
    .transform((value) => value.replace(/[\s().-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{10,15}$/, "Escribe un teléfono de 10 dígitos.")),
  municipality: z
    .string({ error: "Escribe tu municipio." })
    .trim()
    .min(2, "Escribe tu municipio.")
    .max(80, "El municipio es demasiado largo."),
  confirmsLegalAge: requiredCheckbox("Debes ser mayor de 18 años para afiliarte."),
  acceptsPrivacyNotice: requiredCheckbox("Debes aceptar el aviso de privacidad."),
})

export type MembershipApplicationField = keyof z.input<typeof membershipApplicationSchema>

export type MembershipApplicationValues = Record<"fullName" | "email" | "phone" | "municipality", string>

export type MembershipApplicationFormState =
  | { status: "idle" }
  | { status: "success"; fullName: string }
  | {
      status: "error"
      message: string
      errors: Partial<Record<MembershipApplicationField, string[]>>
      values: MembershipApplicationValues
    }
