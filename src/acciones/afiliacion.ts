"use server"

import { after } from "next/server"
import { z } from "zod"

import { correosDelConsejo, enviarCorreo } from "@/lib/correo/enviar"
import { correoNuevaSolicitud } from "@/lib/correo/plantillas"
import { crearClienteSupabasePublico } from "@/lib/supabase/servidor"
import {
  esquemaSolicitudAfiliacion,
  type EstadoFormularioAfiliacion,
  type ValoresAfiliacion,
} from "@/lib/validaciones/afiliacion"
import { obtenerUrlSitio } from "@/lib/url-sitio"

function textoDe(formData: FormData, campo: string) {
  const valor = formData.get(campo)
  return typeof valor === "string" ? valor : ""
}

export async function enviarSolicitudAfiliacion(
  _estadoPrevio: EstadoFormularioAfiliacion,
  formData: FormData
): Promise<EstadoFormularioAfiliacion> {
  const valores: ValoresAfiliacion = {
    nombre: textoDe(formData, "nombre"),
    correo: textoDe(formData, "correo"),
    telefono: textoDe(formData, "telefono"),
    municipio: textoDe(formData, "municipio"),
  }

  // Campo trampa: solo los bots lo llenan. Se responde como éxito sin guardar nada.
  if (textoDe(formData, "sitio_web")) {
    return { tipo: "exito", nombre: valores.nombre }
  }

  const resultado = esquemaSolicitudAfiliacion.safeParse({
    ...valores,
    confirmaMayoriaEdad: formData.get("confirmaMayoriaEdad"),
    aceptaAvisoPrivacidad: formData.get("aceptaAvisoPrivacidad"),
  })

  if (!resultado.success) {
    return {
      tipo: "error",
      mensaje: "Revisa los campos marcados.",
      errores: z.flattenError(resultado.error).fieldErrors,
      valores,
    }
  }

  const { nombre, correo, telefono, municipio } = resultado.data
  const supabase = crearClienteSupabasePublico()

  if (!supabase) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[afiliación] Supabase sin configurar; solicitud de ${correo} no guardada.`)
      return { tipo: "exito", nombre }
    }
    return {
      tipo: "error",
      mensaje:
        "Las solicitudes aún no están disponibles. Intenta más tarde o escríbenos por redes sociales.",
      errores: {},
      valores,
    }
  }

  const { error } = await supabase.from("solicitudes_afiliacion").insert({
    nombre,
    correo,
    telefono,
    municipio,
    confirma_mayoria_edad: true,
    acepta_aviso_privacidad: true,
  })

  if (error) {
    // 23505: ya existe una solicitud pendiente con este correo.
    if (error.code === "23505") {
      return {
        tipo: "error",
        mensaje: "Ya tenemos una solicitud pendiente con este correo. El Consejo te contactará pronto.",
        errores: { correo: ["Este correo ya tiene una solicitud pendiente."] },
        valores,
      }
    }
    console.error("[afiliación] No se pudo guardar la solicitud:", error.message)
    return {
      tipo: "error",
      mensaje: "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
      errores: {},
      valores,
    }
  }

  // Aviso al Consejo después de responder, para no hacer esperar al solicitante.
  after(() =>
    enviarCorreo(
      correosDelConsejo(),
      correoNuevaSolicitud({ nombre, correo, telefono, municipio }, obtenerUrlSitio().toString()),
      { responderA: correo }
    )
  )

  return { tipo: "exito", nombre }
}
