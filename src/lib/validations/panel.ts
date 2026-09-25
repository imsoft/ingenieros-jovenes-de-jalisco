import { z } from "zod"

export const panelSignInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
})

export const reviewDecisions = ["approved", "rejected", "pending"] as const

export const reviewSchema = z.object({
  id: z.uuid(),
  decision: z.enum(reviewDecisions),
  notes: z.string().trim().max(1000, "Las notas no pueden superar 1,000 caracteres."),
})

export type PanelSignInFormState =
  | { status: "idle" }
  | { status: "error"; message: string; email: string }

export type ReviewFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string }
