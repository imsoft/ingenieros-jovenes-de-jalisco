import { z } from "zod"

// Campo de texto opcional: recorta espacios y guarda null si viene vacío.
const opcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Máximo ${maximo} caracteres.`)
    .transform((valor) => valor || null)

const conProtocolo = (valor: string) => (valor && !/^https?:\/\//i.test(valor) ? `https://${valor}` : valor)

export const esquemaPerfil = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120, "Máximo 120 caracteres."),
  ocupacion: opcional(160),
  especialidad: opcional(120),
  empresa: opcional(120),
  puesto: opcional(120),
  municipio: opcional(80),
  biografia: opcional(1000),
  linkedin_url: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo.")
    .transform(conProtocolo)
    .refine((valor) => !valor || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(valor), {
      message: "Pega el enlace de tu perfil de LinkedIn (linkedin.com/in/…).",
    })
    .transform((valor) => valor || null),
  instagram: z
    .string()
    .trim()
    .transform((valor) => valor.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, ""))
    .refine((valor) => !valor || /^[A-Za-z0-9._]{1,30}$/.test(valor), { message: "Escribe tu usuario de Instagram." })
    .transform((valor) => valor || null),
  sitio_web: z
    .string()
    .trim()
    .max(300, "El enlace es demasiado largo.")
    .transform(conProtocolo)
    .refine((valor) => !valor || z.url({ protocol: /^https?$/ }).safeParse(valor).success, {
      message: "Escribe una dirección web válida.",
    })
    .transform((valor) => valor || null),
  visible: z.boolean(),
  foto_ruta: z
    .string()
    .trim()
    .transform((valor) => valor || null),
})

export type DatosPerfil = z.output<typeof esquemaPerfil>

export type CampoPerfil = keyof DatosPerfil

export type EstadoFormularioPerfil =
  | { tipo: "inicial" }
  | { tipo: "exito"; mensaje: string }
  | { tipo: "error"; mensaje: string; errores: Partial<Record<CampoPerfil, string[]>> }
