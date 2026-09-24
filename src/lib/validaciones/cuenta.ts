import { z } from "zod"

const correo = z
  .string({ error: "Escribe tu correo." })
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email("Escribe un correo válido."))

const contrasenaNueva = z
  .string({ error: "Escribe una contraseña." })
  .min(8, "Usa al menos 8 caracteres.")
  .max(72, "Máximo 72 caracteres.")

export const esquemaIngresoMiembro = z.object({
  correo,
  contrasena: z.string().min(1, "Escribe tu contraseña.").max(200),
})

export const esquemaRegistroMiembro = z
  .object({
    nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120, "Máximo 120 caracteres."),
    correo,
    contrasena: contrasenaNueva,
    confirmacion: z.string(),
    aceptaAvisoPrivacidad: z.literal("on", { error: "Debes aceptar el aviso de privacidad." }),
  })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  })

export const esquemaRecuperacion = z.object({ correo })

export const esquemaRestablecer = z
  .object({ contrasena: contrasenaNueva, confirmacion: z.string() })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden.",
  })

export type CampoCuenta = "nombre" | "correo" | "contrasena" | "confirmacion" | "aceptaAvisoPrivacidad"

export type EstadoFormularioCuenta =
  | { tipo: "inicial" }
  | { tipo: "exito"; mensaje: string }
  | {
      tipo: "error"
      mensaje: string
      errores: Partial<Record<CampoCuenta, string[]>>
      valores: Partial<Record<"nombre" | "correo", string>>
    }
