import { z } from "zod"

export const esquemaIngreso = z.object({
  correo: z.string().trim().toLowerCase().pipe(z.email()),
  contrasena: z.string().min(1).max(200),
})

export const decisionesRevision = ["aprobada", "rechazada", "pendiente"] as const

export const esquemaRevision = z.object({
  id: z.uuid(),
  decision: z.enum(decisionesRevision),
  notas: z.string().trim().max(1000, "Las notas no pueden superar 1,000 caracteres."),
})

export type EstadoFormularioIngreso =
  | { tipo: "inicial" }
  | { tipo: "error"; mensaje: string; correo: string }

export type EstadoFormularioRevision =
  | { tipo: "inicial" }
  | { tipo: "exito"; mensaje: string }
  | { tipo: "error"; mensaje: string }
