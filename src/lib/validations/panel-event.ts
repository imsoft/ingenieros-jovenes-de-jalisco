import { z } from "zod"

import type { EventFormValues } from "@/lib/events/form"

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null)

const amount = z
  .string()
  .trim()
  .transform((value) => value.replace(/[$,\s]/g, ""))
  .refine((value) => value === "" || /^\d{1,7}(\.\d{1,2})?$/.test(value), "Escribe un monto válido, por ejemplo 350.")
  .transform((value) => (value === "" ? null : Number(value)))

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Escribe el título (mínimo 3 caracteres).").max(120, "Máximo 120 caracteres."),
    summary: z.string().trim().min(10, "Escribe un resumen de al menos 10 caracteres.").max(300, "Máximo 300 caracteres."),
    description: z.string().trim().max(5000, "Máximo 5,000 caracteres."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha del evento."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora de inicio."),
    endTime: z.string().refine((value) => value === "" || /^\d{2}:\d{2}$/.test(value), "Hora no válida."),
    venue: z.string().trim().min(2, "Escribe el lugar.").max(160, "Máximo 160 caracteres."),
    address: optionalText(300, "Máximo 300 caracteres."),
    mapUrl: z
      .string()
      .trim()
      .max(500, "El enlace es demasiado largo.")
      .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "El enlace debe empezar con https://")
      .transform((value) => value || null),
    publicPrice: amount,
    memberPrice: amount,
    capacity: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{1,5}$/.test(value), "Escribe un número entero.")
      .transform((value) => (value === "" ? null : Number(value)))
      .refine((value) => value === null || value > 0, "El cupo debe ser mayor a 0."),
    paymentInstructions: optionalText(2000, "Máximo 2,000 caracteres."),
    registrationOpen: z.boolean(),
    isPublished: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.endTime && data.endTime <= data.startTime) {
      context.addIssue({ code: "custom", path: ["endTime"], message: "Debe ser después de la hora de inicio." })
    }
    if (data.memberPrice !== null && data.publicPrice === null) {
      context.addIssue({ code: "custom", path: ["memberPrice"], message: "Define primero el precio público." })
    }
  })

export type EventFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error"
      message: string
      errors: Partial<Record<keyof EventFormValues, string[]>>
      values: EventFormValues
    }
