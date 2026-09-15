import { z } from "zod"

import type { ValoresEvento } from "@/lib/eventos/formulario"

const textoOpcional = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => valor || null)

const monto = z
  .string()
  .trim()
  .transform((valor) => valor.replace(/[$,\s]/g, ""))
  .refine((valor) => valor === "" || /^\d{1,7}(\.\d{1,2})?$/.test(valor), "Escribe un monto válido, por ejemplo 350.")
  .transform((valor) => (valor === "" ? null : Number(valor)))

export const esquemaEvento = z
  .object({
    titulo: z.string().trim().min(3, "Escribe el título (mínimo 3 caracteres).").max(120, "Máximo 120 caracteres."),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80, "Máximo 80 caracteres.")
      .refine((valor) => valor === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(valor), "Usa solo minúsculas, números y guiones."),
    resumen: z.string().trim().min(10, "Escribe un resumen de al menos 10 caracteres.").max(300, "Máximo 300 caracteres."),
    descripcion: z.string().trim().max(5000, "Máximo 5,000 caracteres."),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha del evento."),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Elige la hora de inicio."),
    horaFin: z.string().refine((valor) => valor === "" || /^\d{2}:\d{2}$/.test(valor), "Hora no válida."),
    lugar: z.string().trim().min(2, "Escribe el lugar.").max(160, "Máximo 160 caracteres."),
    direccion: textoOpcional(300, "Máximo 300 caracteres."),
    mapaUrl: z
      .string()
      .trim()
      .max(500, "El enlace es demasiado largo.")
      .refine((valor) => valor === "" || /^https:\/\/\S+$/.test(valor), "El enlace debe empezar con https://")
      .transform((valor) => valor || null),
    precioPublico: monto,
    precioMiembro: monto,
    cupo: z
      .string()
      .trim()
      .refine((valor) => valor === "" || /^\d{1,5}$/.test(valor), "Escribe un número entero.")
      .transform((valor) => (valor === "" ? null : Number(valor)))
      .refine((valor) => valor === null || valor > 0, "El cupo debe ser mayor a 0."),
    instruccionesPago: textoOpcional(2000, "Máximo 2,000 caracteres."),
    registroAbierto: z.boolean(),
    publicado: z.boolean(),
  })
  .superRefine((datos, contexto) => {
    if (datos.horaFin && datos.horaFin <= datos.horaInicio) {
      contexto.addIssue({ code: "custom", path: ["horaFin"], message: "Debe ser después de la hora de inicio." })
    }
    if (datos.precioMiembro !== null && datos.precioPublico === null) {
      contexto.addIssue({ code: "custom", path: ["precioMiembro"], message: "Define primero el precio público." })
    }
  })

export type EstadoFormularioEvento =
  | { tipo: "inicial" }
  | { tipo: "exito"; mensaje: string }
  | {
      tipo: "error"
      mensaje: string
      errores: Partial<Record<keyof ValoresEvento, string[]>>
      valores: ValoresEvento
    }
