import { z } from "zod"

export const esquemaRegistroEvento = z.object({
  eventoId: z.uuid(),
  nombre: z
    .string({ error: "Escribe tu nombre completo." })
    .trim()
    .min(3, "Escribe tu nombre completo.")
    .max(120, "El nombre es demasiado largo."),
  correo: z
    .string({ error: "Escribe tu correo." })
    .trim()
    .toLowerCase()
    .max(254, "El correo es demasiado largo.")
    .pipe(z.email("Escribe un correo válido.")),
  telefono: z
    .string({ error: "Escribe tu teléfono." })
    .trim()
    .transform((valor) => valor.replace(/[\s().-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{10,15}$/, "Escribe un teléfono de 10 dígitos.")),
  organizacion: z.string().trim().max(120, "Máximo 120 caracteres.").optional().default(""),
  aceptaAvisoPrivacidad: z.literal("on", { error: "Debes aceptar el aviso de privacidad." }),
})

export type CampoRegistroEvento = Exclude<keyof z.input<typeof esquemaRegistroEvento>, "eventoId">

export type ValoresRegistroEvento = Record<"nombre" | "correo" | "telefono" | "organizacion", string>

export type EstadoRegistroEvento =
  | { tipo: "inicial" }
  | {
      tipo: "exito"
      folio: string
      monto: number
      esMiembro: boolean
      instrucciones: string | null
    }
  | {
      tipo: "error"
      mensaje: string
      errores: Partial<Record<CampoRegistroEvento, string[]>>
      valores: ValoresRegistroEvento
    }
