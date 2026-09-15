import { z } from "zod"

const casillaObligatoria = (mensaje: string) => z.literal("on", { error: mensaje })

export const esquemaSolicitudAfiliacion = z.object({
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
  municipio: z
    .string({ error: "Escribe tu municipio." })
    .trim()
    .min(2, "Escribe tu municipio.")
    .max(80, "El municipio es demasiado largo."),
  confirmaMayoriaEdad: casillaObligatoria("Debes ser mayor de 18 años para afiliarte."),
  aceptaAvisoPrivacidad: casillaObligatoria("Debes aceptar el aviso de privacidad."),
})

export type CampoAfiliacion = keyof z.input<typeof esquemaSolicitudAfiliacion>

export type ValoresAfiliacion = Record<"nombre" | "correo" | "telefono" | "municipio", string>

export type EstadoFormularioAfiliacion =
  | { tipo: "inicial" }
  | { tipo: "exito"; nombre: string }
  | {
      tipo: "error"
      mensaje: string
      errores: Partial<Record<CampoAfiliacion, string[]>>
      valores: ValoresAfiliacion
    }
