"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { enviarCorreo } from "@/lib/correo/enviar"
import { correoRegistroEvento } from "@/lib/correo/plantillas"
import { formatearFechaLarga, formatearHorario, formatearPrecio } from "@/lib/eventos/formato"
import { obtenerEventoPorSlug } from "@/lib/eventos/publico"
import { crearClienteSupabasePublico } from "@/lib/supabase/servidor"
import {
  esquemaRegistroEvento,
  type CampoRegistroEvento,
  type EstadoRegistroEvento,
  type ValoresRegistroEvento,
} from "@/lib/validaciones/eventos"
import { obtenerUrlSitio } from "@/lib/url-sitio"

function textoDe(formData: FormData, campo: string) {
  const valor = formData.get(campo)
  return typeof valor === "string" ? valor : ""
}

type ResultadoRegistro = {
  folio: string
  monto: number | string
  es_miembro: boolean
  instrucciones_pago: string | null
}

const mensajesDeLaBase: Record<string, string> = {
  CUPO_LLENO: "Lo sentimos, el cupo de este evento se acaba de llenar.",
  REGISTRO_CERRADO: "El registro para este evento ya está cerrado.",
  EVENTO_NO_DISPONIBLE: "Este evento ya no está disponible.",
}

export async function registrarseEnEvento(
  eventoId: string,
  slug: string,
  _estadoPrevio: EstadoRegistroEvento,
  formData: FormData
): Promise<EstadoRegistroEvento> {
  const valores: ValoresRegistroEvento = {
    nombre: textoDe(formData, "nombre"),
    correo: textoDe(formData, "correo"),
    telefono: textoDe(formData, "telefono"),
    organizacion: textoDe(formData, "organizacion"),
  }

  // Campo trampa: solo los bots lo llenan.
  if (textoDe(formData, "sitio_web")) {
    return { tipo: "error", mensaje: "No pudimos completar tu registro.", errores: {}, valores }
  }

  const resultado = esquemaRegistroEvento.safeParse({
    ...valores,
    eventoId,
    aceptaAvisoPrivacidad: formData.get("aceptaAvisoPrivacidad"),
  })

  if (!resultado.success) {
    const { fieldErrors } = z.flattenError(resultado.error)
    const errores: Partial<Record<CampoRegistroEvento, string[]>> = {
      nombre: fieldErrors.nombre,
      correo: fieldErrors.correo,
      telefono: fieldErrors.telefono,
      organizacion: fieldErrors.organizacion,
      aceptaAvisoPrivacidad: fieldErrors.aceptaAvisoPrivacidad,
    }
    return { tipo: "error", mensaje: "Revisa los campos marcados.", errores, valores }
  }

  const supabase = crearClienteSupabasePublico()
  if (!supabase) {
    return { tipo: "error", mensaje: "El registro no está disponible en este momento.", errores: {}, valores }
  }

  const { nombre, correo, telefono, organizacion } = resultado.data
  const { data, error } = await supabase
    .rpc("registrar_en_evento", {
      p_evento_id: resultado.data.eventoId,
      p_nombre: nombre,
      p_correo: correo,
      p_telefono: telefono,
      p_organizacion: organizacion || null,
    })
    .single<ResultadoRegistro>()

  if (error) {
    const clave = Object.keys(mensajesDeLaBase).find((codigo) => error.message.includes(codigo))
    if (clave) {
      revalidatePath(`/eventos/${slug}`)
      return { tipo: "error", mensaje: mensajesDeLaBase[clave], errores: {}, valores }
    }
    if (error.code === "23505" && error.message.includes("correo_activo")) {
      return {
        tipo: "error",
        mensaje: "Ya hay un registro con este correo para este evento. Revisa tu folio o escríbenos por redes.",
        errores: { correo: ["Este correo ya está registrado en el evento."] },
        valores,
      }
    }
    console.error("[eventos] No se pudo registrar:", error.code, error.message)
    return { tipo: "error", mensaje: "No pudimos completar tu registro. Intenta de nuevo en unos minutos.", errores: {}, valores }
  }

  // El cupo restante cambió: refresca las páginas que lo muestran.
  revalidatePath(`/eventos/${slug}`)
  revalidatePath("/eventos")
  revalidatePath("/")

  const monto = Number(data.monto)
  after(async () => {
    const evento = await obtenerEventoPorSlug(slug)
    if (!evento) return
    await enviarCorreo(
      correo,
      correoRegistroEvento(
        {
          nombre,
          folio: data.folio,
          evento: {
            titulo: evento.titulo,
            slug: evento.slug,
            fecha: formatearFechaLarga(evento.inicia_en),
            horario: formatearHorario(evento),
            lugar: evento.lugar,
            direccion: evento.direccion,
          },
          monto: formatearPrecio(monto),
          esGratis: monto === 0,
          esMiembro: data.es_miembro,
          instrucciones: data.instrucciones_pago,
        },
        obtenerUrlSitio().toString()
      ),
      { idempotencia: `registro-${data.folio}` }
    )
  })

  return {
    tipo: "exito",
    folio: data.folio,
    monto,
    esMiembro: data.es_miembro,
    instrucciones: data.instrucciones_pago,
  }
}
