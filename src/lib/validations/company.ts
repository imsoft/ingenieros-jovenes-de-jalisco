import { z } from "zod"

import { instagramHandleField, linkedinUrlField } from "@/lib/validations/profile"

// Optional text field: trims whitespace and stores null when empty.
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((value) => value || null)

const withProtocol = (value: string) => (value && !/^https?:\/\//i.test(value) ? `https://${value}` : value)

export const companyRoles = ["owner", "partner", "employee", "freelance"] as const
export type CompanyRole = (typeof companyRoles)[number]

export const companyRoleLabels: Record<CompanyRole, string> = {
  owner: "Dueño o fundador",
  partner: "Socio",
  employee: "Colaborador",
  freelance: "Independiente",
}

export const MAX_SERVICE_LENGTH = 60
export const MAX_COMPANIES = 5

// "Diseño estructural, supervisión; BIM" → ["Diseño estructural", "Supervisión", "BIM"] (unique, capitalized).
// The form sends one service per line; commas and semicolons are still accepted.
export function parseServices(value: string) {
  const seen = new Set<string>()
  const services: string[] = []
  for (const raw of value.split(/[,;\n]/)) {
    const service = raw.trim().replace(/\s+/g, " ")
    const key = service.toLowerCase()
    if (!service || seen.has(key)) continue
    seen.add(key)
    services.push(service.charAt(0).toUpperCase() + service.slice(1))
  }
  return services
}

export const companySchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la empresa.").max(120, "Máximo 120 caracteres."),
  role: z.enum(companyRoles, { error: "Elige tu relación con la empresa." }),
  jobTitle: optional(120),
  sector: optional(80),
  description: optional(600),
  services: z
    .string()
    .transform(parseServices)
    .refine((services) => services.every((service) => service.length <= MAX_SERVICE_LENGTH), {
      message: `Cada servicio debe tener máximo ${MAX_SERVICE_LENGTH} caracteres.`,
    }),
  municipality: optional(80),
  address: optional(200),
  websiteUrl: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo.")
    .transform(withProtocol)
    .refine((value) => !value || z.url({ protocol: /^https?$/ }).safeParse(value).success, {
      message: "Escribe una dirección web válida.",
    })
    .transform((value) => value || null),
  linkedinUrl: linkedinUrlField("Pega el enlace de la página de LinkedIn (linkedin.com/company/…)."),
  instagramHandle: instagramHandleField("Escribe el usuario de Instagram de la empresa."),
  facebookUrl: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo.")
    .transform(withProtocol)
    .refine((value) => !value || /^https:\/\/([a-z0-9-]+\.)?(facebook|fb)\.com\/./i.test(value), {
      message: "Pega el enlace de la página de Facebook (facebook.com/…).",
    })
    .transform((value) => value || null),
  logoPath: z
    .string()
    .trim()
    .transform((value) => value || null),
})

export type CompanyData = z.output<typeof companySchema>
export type CompanyField = keyof z.input<typeof companySchema>

export type CompanyFormState =
  | { status: "idle" }
  | { status: "error"; message: string; errors: Partial<Record<CompanyField, string[]>> }
