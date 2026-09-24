"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { BUCKET_PERFILES } from "@/lib/miembros/perfiles"
import { exigirMiembro } from "@/lib/miembros/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"
import { esquemaPerfil, type EstadoFormularioPerfil } from "@/lib/validaciones/perfil"

const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const

const rutaFotoValida = (usuarioId: string, ruta: string) =>
  new RegExp(`^${usuarioId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(ruta)

// Paso 1 de la foto: el servidor autoriza la subida a la carpeta del propio miembro.
export async function crearSubidaFotoPerfil(
  tipoMime: string
): Promise<{ ok: true; ruta: string; token: string } | { ok: false; mensaje: string }> {
  const miembro = await exigirMiembro("/mi-perfil")
  const extension = EXTENSIONES[tipoMime as keyof typeof EXTENSIONES]
  if (!extension) return { ok: false, mensaje: "Formato no permitido. Usa JPG, PNG o WebP." }

  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase.storage
    .from(BUCKET_PERFILES)
    .createSignedUploadUrl(`${miembro.usuarioId}/${randomUUID()}.${extension}`)

  if (error || !data) {
    console.error("[perfil] No se pudo crear la URL de subida:", error?.message)
    return { ok: false, mensaje: "No se pudo preparar la subida. Inténtalo de nuevo." }
  }
  return { ok: true, ruta: data.path, token: data.token }
}

const textoDe = (formData: FormData, campo: string) => {
  const valor = formData.get(campo)
  return typeof valor === "string" ? valor : ""
}

// Paso 2 (y único para el resto de datos): guarda el perfil y, si cambió la foto, borra la anterior.
export async function guardarPerfil(
  _estadoPrevio: EstadoFormularioPerfil,
  formData: FormData
): Promise<EstadoFormularioPerfil> {
  const miembro = await exigirMiembro("/mi-perfil")

  const resultado = esquemaPerfil.safeParse({
    nombre: textoDe(formData, "nombre"),
    ocupacion: textoDe(formData, "ocupacion"),
    especialidad: textoDe(formData, "especialidad"),
    empresa: textoDe(formData, "empresa"),
    puesto: textoDe(formData, "puesto"),
    municipio: textoDe(formData, "municipio"),
    biografia: textoDe(formData, "biografia"),
    linkedin_url: textoDe(formData, "linkedin_url"),
    instagram: textoDe(formData, "instagram"),
    sitio_web: textoDe(formData, "sitio_web"),
    visible: formData.get("visible") === "on",
    foto_ruta: textoDe(formData, "foto_ruta"),
  })

  if (!resultado.success) {
    return { tipo: "error", mensaje: "Revisa los campos marcados.", errores: z.flattenError(resultado.error).fieldErrors }
  }

  const datos = resultado.data
  if (datos.foto_ruta && !rutaFotoValida(miembro.usuarioId, datos.foto_ruta)) {
    return { tipo: "error", mensaje: "La foto no es válida. Súbela de nuevo.", errores: {} }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const { data: previo } = await supabase
    .from("perfiles")
    .select("foto_ruta")
    .eq("usuario_id", miembro.usuarioId)
    .maybeSingle()

  // Sin upsert: usuario_id no es actualizable por columna, así que se decide insertar o actualizar.
  const { error } = previo
    ? await supabase.from("perfiles").update(datos).eq("usuario_id", miembro.usuarioId)
    : await supabase.from("perfiles").insert({ ...datos, usuario_id: miembro.usuarioId })

  if (error) {
    console.error("[perfil] No se pudo guardar:", error.code, error.message)
    return { tipo: "error", mensaje: "No pudimos guardar tu perfil. Inténtalo de nuevo.", errores: {} }
  }

  if (previo?.foto_ruta && previo.foto_ruta !== datos.foto_ruta) {
    const { error: errorBorrado } = await supabase.storage.from(BUCKET_PERFILES).remove([previo.foto_ruta])
    if (errorBorrado) console.error("[perfil] No se pudo borrar la foto anterior:", errorBorrado.message)
  }

  revalidatePath("/miembros", "layout")
  revalidatePath("/mi-perfil")
  return {
    tipo: "exito",
    mensaje: datos.visible
      ? "Perfil guardado. Ya apareces en el directorio de miembros."
      : "Perfil guardado. Está oculto: solo tú puedes verlo.",
  }
}
