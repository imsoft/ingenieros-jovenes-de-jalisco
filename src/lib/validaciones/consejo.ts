import { z } from "zod"

export const esquemaAgregarConsejo = z.object({
  nombre: z.string().trim().min(2, "Escribe su nombre.").max(120, "Máximo 120 caracteres."),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "El correo es demasiado largo.")
    .pipe(z.email("Escribe un correo válido.")),
  rol: z.enum(["admin", "revisor"], { error: "Elige un rol." }),
})

export type CampoAgregarConsejo = keyof z.input<typeof esquemaAgregarConsejo>

export type EstadoAgregarConsejo =
  | { tipo: "inicial" }
  | { tipo: "exito"; mensaje: string }
  | { tipo: "error"; mensaje: string; errores: Partial<Record<CampoAgregarConsejo, string[]>> }

// Errores que lanza la base de datos (P0001) y su mensaje para el Consejo.
export const mensajesConsejo: Record<string, string> = {
  ULTIMO_ADMINISTRADOR: "El Consejo debe tener al menos un administrador activo. Nombra a otro antes de hacer este cambio.",
  SOLO_ADMINISTRADORES: "Solo un administrador puede hacer esto.",
  NO_ENCONTRADO: "No encontramos a esa persona. Recarga la página.",
}

export function mensajeDeErrorConsejo(mensajeBase: string, porDefecto: string) {
  const clave = Object.keys(mensajesConsejo).find((codigo) => mensajeBase.includes(codigo))
  return clave ? mensajesConsejo[clave] : porDefecto
}
