"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { enviarCorreo } from "@/lib/correo/enviar"
import { correoSolicitudAprobada } from "@/lib/correo/plantillas"
import { exigirMiembroConsejo } from "@/lib/panel/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"
import { obtenerUrlSitio } from "@/lib/url-sitio"
import {
  esquemaIngreso,
  esquemaRevision,
  type EstadoFormularioIngreso,
  type EstadoFormularioRevision,
} from "@/lib/validaciones/panel"

// Solo se permite volver a rutas internas del panel después de ingresar.
function rutaDeRegreso(valor: FormDataEntryValue | null) {
  return typeof valor === "string" && valor.startsWith("/panel") && !valor.startsWith("//") ? valor : "/panel"
}

export async function ingresarAlPanel(
  _estadoPrevio: EstadoFormularioIngreso,
  formData: FormData
): Promise<EstadoFormularioIngreso> {
  const correo = typeof formData.get("correo") === "string" ? String(formData.get("correo")) : ""
  const resultado = esquemaIngreso.safeParse({ correo, contrasena: formData.get("contrasena") })

  if (!resultado.success) {
    return { tipo: "error", mensaje: "Escribe un correo válido y tu contraseña.", correo }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.auth.signInWithPassword({
    email: resultado.data.correo,
    password: resultado.data.contrasena,
  })

  if (error) {
    return {
      tipo: "error",
      mensaje:
        error.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "Correo o contraseña incorrectos.",
      correo,
    }
  }

  redirect(rutaDeRegreso(formData.get("siguiente")))
}

export async function cerrarSesionPanel() {
  const supabase = await crearClienteSupabaseConSesion()
  await supabase.auth.signOut()
  redirect("/panel/ingresar")
}

const mensajesDecision = {
  aprobada: "Solicitud aprobada.",
  rechazada: "Solicitud rechazada.",
  pendiente: "La solicitud regresó a pendiente.",
} as const

export async function revisarSolicitud(
  id: string,
  _estadoPrevio: EstadoFormularioRevision,
  formData: FormData
): Promise<EstadoFormularioRevision> {
  // Las server actions son endpoints públicos: se verifica el permiso aquí, no solo en la página.
  const miembro = await exigirMiembroConsejo()

  const resultado = esquemaRevision.safeParse({
    id,
    decision: formData.get("decision"),
    notas: formData.get("notas") ?? "",
  })
  if (!resultado.success) {
    return {
      tipo: "error",
      mensaje: resultado.error.issues[0]?.message ?? "No pudimos procesar la revisión. Recarga la página.",
    }
  }

  const { decision, notas } = resultado.data
  const regresaAPendiente = decision === "pendiente"

  const supabase = await crearClienteSupabaseConSesion()
  const { data: previa } = await supabase
    .from("solicitudes_afiliacion")
    .select("estado")
    .eq("id", resultado.data.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from("solicitudes_afiliacion")
    .update({
      estado: decision,
      notas_consejo: notas || null,
      revisado_por: regresaAPendiente ? null : miembro.usuarioId,
      revisado_en: regresaAPendiente ? null : new Date().toISOString(),
    })
    .eq("id", resultado.data.id)
    .select("id, nombre, correo")

  if (error) {
    if (error.code === "23505") {
      return {
        tipo: "error",
        mensaje: "Ya existe otra solicitud pendiente con este correo, así que esta no puede regresar a pendiente.",
      }
    }
    console.error("[panel] No se pudo revisar la solicitud:", error.message)
    return { tipo: "error", mensaje: "No se pudo guardar la revisión. Inténtalo de nuevo." }
  }

  // Sin filas afectadas: la solicitud no existe o RLS lo impidió.
  if (!data?.length) {
    return { tipo: "error", mensaje: "No encontramos la solicitud o ya no tienes permiso para revisarla." }
  }

  // Solo al pasar a aprobada (no al volver a guardar una ya aprobada) se da la bienvenida.
  const solicitud = data[0]
  if (decision === "aprobada" && previa?.estado !== "aprobada") {
    after(() =>
      enviarCorreo(solicitud.correo, correoSolicitudAprobada({ nombre: solicitud.nombre }, obtenerUrlSitio().toString()))
    )
  }

  revalidatePath("/panel", "layout")
  return { tipo: "exito", mensaje: mensajesDecision[decision] }
}
