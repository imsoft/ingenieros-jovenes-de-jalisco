"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { rutaSegura } from "@/lib/cuenta/rutas"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"
import {
  esquemaIngresoMiembro,
  esquemaRecuperacion,
  esquemaRegistroMiembro,
  esquemaRestablecer,
  type EstadoFormularioCuenta,
} from "@/lib/validaciones/cuenta"

function textoDe(formData: FormData, campo: string) {
  const valor = formData.get(campo)
  return typeof valor === "string" ? valor : ""
}

// Origen de la petición actual (sirve igual en local, previews y producción).
// Supabase solo acepta redirecciones que estén en su lista de URLs permitidas.
async function origenPeticion() {
  const encabezados = await headers()
  const host = encabezados.get("x-forwarded-host") ?? encabezados.get("host") ?? "localhost:3000"
  const protocolo = encabezados.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${protocolo}://${host}`
}

const correoNoAutorizado = (mensaje: string) => mensaje.includes("CORREO_NO_AUTORIZADO")

export async function iniciarSesionMiembro(
  _estadoPrevio: EstadoFormularioCuenta,
  formData: FormData
): Promise<EstadoFormularioCuenta> {
  const correo = textoDe(formData, "correo")
  const resultado = esquemaIngresoMiembro.safeParse({ correo, contrasena: formData.get("contrasena") })
  if (!resultado.success) {
    return { tipo: "error", mensaje: "Escribe tu correo y tu contraseña.", errores: {}, valores: { correo } }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.auth.signInWithPassword({
    email: resultado.data.correo,
    password: resultado.data.contrasena,
  })

  if (error) {
    const mensaje =
      error.code === "email_not_confirmed"
        ? "Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada (y la de spam)."
        : error.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : "Correo o contraseña incorrectos."
    return { tipo: "error", mensaje, errores: {}, valores: { correo } }
  }

  redirect(rutaSegura(formData.get("siguiente")))
}

export async function iniciarConGoogle(formData: FormData) {
  const siguiente = rutaSegura(formData.get("siguiente"))
  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origenPeticion()}/auth/callback?siguiente=${encodeURIComponent(siguiente)}`,
      queryParams: { prompt: "select_account" },
    },
  })

  if (error || !data.url) {
    console.error("[cuenta] No se pudo iniciar con Google:", error?.message)
    redirect("/ingresar?error=google")
  }
  redirect(data.url)
}

export async function registrarMiembro(
  _estadoPrevio: EstadoFormularioCuenta,
  formData: FormData
): Promise<EstadoFormularioCuenta> {
  const valores = { nombre: textoDe(formData, "nombre"), correo: textoDe(formData, "correo") }
  const resultado = esquemaRegistroMiembro.safeParse({
    ...valores,
    contrasena: formData.get("contrasena"),
    confirmacion: formData.get("confirmacion"),
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

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.auth.signUp({
    email: resultado.data.correo,
    password: resultado.data.contrasena,
    options: {
      emailRedirectTo: `${await origenPeticion()}/auth/confirm?siguiente=/mi-perfil`,
      data: { full_name: resultado.data.nombre },
    },
  })

  if (error) {
    if (correoNoAutorizado(error.message)) {
      return {
        tipo: "error",
        mensaje:
          "Ese correo no tiene una solicitud de afiliación aprobada. Usa el mismo correo con el que te afiliaste o solicita tu afiliación primero.",
        errores: { correo: ["Correo sin solicitud aprobada."] },
        valores,
      }
    }
    if (error.code === "weak_password") {
      return {
        tipo: "error",
        mensaje: "Esa contraseña es muy débil. Usa una más larga o con más variedad de caracteres.",
        errores: { contrasena: ["Contraseña demasiado débil."] },
        valores,
      }
    }
    console.error("[cuenta] No se pudo crear la cuenta:", error.code, error.message)
    return { tipo: "error", mensaje: "No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos.", errores: {}, valores }
  }

  // Supabase no revela si el correo ya tenía cuenta: el mensaje es el mismo en ambos casos.
  return {
    tipo: "exito",
    mensaje: `Te enviamos un correo a ${resultado.data.correo} para confirmar tu cuenta. Abre el enlace para continuar (revisa también tu carpeta de spam).`,
  }
}

export async function solicitarRecuperacion(
  _estadoPrevio: EstadoFormularioCuenta,
  formData: FormData
): Promise<EstadoFormularioCuenta> {
  const correo = textoDe(formData, "correo")
  const resultado = esquemaRecuperacion.safeParse({ correo })
  if (!resultado.success) {
    return {
      tipo: "error",
      mensaje: "Escribe un correo válido.",
      errores: z.flattenError(resultado.error).fieldErrors,
      valores: { correo },
    }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.auth.resetPasswordForEmail(resultado.data.correo, {
    redirectTo: `${await origenPeticion()}/auth/confirm?siguiente=/restablecer`,
  })
  if (error && error.status !== 429) console.error("[cuenta] Recuperación:", error.code, error.message)

  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
  return {
    tipo: "exito",
    mensaje: "Si ese correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.",
  }
}

export async function restablecerContrasena(
  _estadoPrevio: EstadoFormularioCuenta,
  formData: FormData
): Promise<EstadoFormularioCuenta> {
  const resultado = esquemaRestablecer.safeParse({
    contrasena: formData.get("contrasena"),
    confirmacion: formData.get("confirmacion"),
  })
  if (!resultado.success) {
    return {
      tipo: "error",
      mensaje: "Revisa los campos marcados.",
      errores: z.flattenError(resultado.error).fieldErrors,
      valores: {},
    }
  }

  const supabase = await crearClienteSupabaseConSesion()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect("/ingresar?error=sesion")

  const { error } = await supabase.auth.updateUser({ password: resultado.data.contrasena })
  if (error) {
    const mensaje =
      error.code === "same_password"
        ? "La nueva contraseña debe ser distinta a la anterior."
        : error.code === "weak_password"
          ? "Esa contraseña es muy débil. Usa una más larga."
          : "No pudimos guardar tu nueva contraseña. Solicita un enlace nuevo."
    return { tipo: "error", mensaje, errores: {}, valores: {} }
  }

  redirect("/miembros")
}

export async function cerrarSesionMiembro() {
  const supabase = await crearClienteSupabaseConSesion()
  await supabase.auth.signOut()
  redirect("/")
}

// Borra la cuenta del miembro (derechos ARCO): primero sus fotos, luego la cuenta y, en cascada, su perfil.
export async function eliminarMiCuenta(): Promise<{ ok: false; mensaje: string } | void> {
  const supabase = await crearClienteSupabaseConSesion()
  const { data } = await supabase.auth.getClaims()
  const usuarioId = data?.claims?.sub
  if (!usuarioId) redirect("/ingresar")

  const { data: fotos } = await supabase.storage.from("perfiles").list(usuarioId, { limit: 100 })
  if (fotos?.length) {
    const { error: errorFotos } = await supabase.storage
      .from("perfiles")
      .remove(fotos.map((foto) => `${usuarioId}/${foto.name}`))
    if (errorFotos) console.error("[cuenta] No se pudieron borrar las fotos:", errorFotos.message)
  }

  const { error } = await supabase.rpc("eliminar_mi_cuenta")
  if (error) {
    if (error.message.includes("ES_CONSEJO")) {
      return {
        ok: false,
        mensaje: "Eres parte del Consejo. Pide a un administrador que te dé de baja del Consejo y luego elimina tu cuenta.",
      }
    }
    console.error("[cuenta] No se pudo eliminar la cuenta:", error.code, error.message)
    return { ok: false, mensaje: "No pudimos eliminar tu cuenta. Inténtalo de nuevo." }
  }

  // La cuenta ya no existe: solo se limpian las cookies de sesión de este navegador.
  await supabase.auth.signOut({ scope: "local" })
  revalidatePath("/miembros", "layout")
  redirect("/ingresar?aviso=cuenta-eliminada")
}
