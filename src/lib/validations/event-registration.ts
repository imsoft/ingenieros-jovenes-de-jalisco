import { z } from "zod"

export const eventRegistrationSchema = z.object({
  eventId: z.uuid(),
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
  organization: z.string().trim().max(120, "Máximo 120 caracteres.").optional().default(""),
  acceptsPrivacyNotice: z.literal("on", { error: "Debes aceptar el aviso de privacidad." }),
})

export type EventRegistrationField = Exclude<keyof z.input<typeof eventRegistrationSchema>, "eventId">

export type EventRegistrationValues = Record<"fullName" | "email" | "phone" | "organization", string>

export type EventRegistrationFormState =
  | { status: "idle" }
  | {
      status: "success"
      confirmationCode: string
      amount: number
      isMember: boolean
      paymentInstructions: string | null
    }
  | {
      status: "error"
      message: string
      errors: Partial<Record<EventRegistrationField, string[]>>
      values: EventRegistrationValues
    }
