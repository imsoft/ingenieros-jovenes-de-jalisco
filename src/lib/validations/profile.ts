import { z } from "zod"

// Optional text field: trims whitespace and stores null when empty.
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((value) => value || null)

const withProtocol = (value: string) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value)

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre.").max(120, "Máximo 120 caracteres."),
  headline: optional(160),
  specialty: optional(120),
  company: optional(120),
  jobTitle: optional(120),
  municipality: optional(80),
  bio: optional(1000),
  linkedinUrl: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo.")
    .transform(withProtocol)
    .refine((value) => !value || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(value), {
      message: "Pega el enlace de tu perfil de LinkedIn (linkedin.com/in/…).",
    })
    .transform((value) => value || null),
  instagramHandle: z
    .string()
    .trim()
    .transform((value) => value.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, ""))
    .refine((value) => !value || /^[A-Za-z0-9._]{1,30}$/.test(value), { message: "Escribe tu usuario de Instagram." })
    .transform((value) => value || null),
  websiteUrl: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo.")
    .transform(withProtocol)
    .refine((value) => !value || z.url({ protocol: /^https?$/ }).safeParse(value).success, {
      message: "Escribe una dirección web válida.",
    })
    .transform((value) => value || null),
  isVisible: z.boolean(),
  photoPath: z
    .string()
    .trim()
    .transform((value) => value || null),
})

export type ProfileData = z.output<typeof profileSchema>

export type ProfileField = keyof ProfileData

export type ProfileFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; errors: Partial<Record<ProfileField, string[]>> }
