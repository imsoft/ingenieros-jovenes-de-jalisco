"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { enviarCorreo } from "@/lib/correo/enviar"
import { correoInvitacionConsejo } from "@/lib/correo/plantillas"
import { exigirAdminConsejo } from "@/lib/panel/sesion"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"
import { obtenerUrlSitio } from "@/lib/url-sitio"
import {
  esquemaAgregarConsejo,
  mensajeDeErrorConsejo,
  type EstadoAgregarConsejo,
} from "@/lib/validaciones/consejo"

type Resultado = { ok: true } | { ok: false; mensaje: string }

const esUuid = (valor: string) => z.uuid().safeParse(valor).success
const esRol = (valor: string): valor is "admin" | "revisor" => valor === "admin" || valor === "revisor"

function revalidarConsejo() {
  revalidatePath("/panel", "layout")
  revalidatePath("/miembros", "layout")
}

export async function agregarAlConsejo(
  _estadoPrevio: EstadoAgregarConsejo,
  formData: FormData
): Promise<EstadoAgregarConsejo> {
  const admin = await exigirAdminConsejo()

  const resultado = esquemaAgregarConsejo.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    rol: formData.get("rol"),
  })
  if (!resultado.success) {
    return { tipo: "error", mensaje: "Revisa los campos marcados.", errores: z.flattenError(resultado.error).fieldErrors }
  }

  const { nombre, correo, rol } = resultado.data
  const supabase = await crearClienteSupabaseConSesion()
  const { data, error } = await supabase.rpc("agregar_consejo", { p_correo: correo, p_nombre: nombre, p_rol: rol })

  if (error) {
    console.error("[panel] No se pudo agregar al Consejo:", error.code, error.message)
    return { tipo: "error", mensaje: mensajeDeErrorConsejo(error.message, "No se pudo agregar. Inténtalo de nuevo."), errores: {} }
  }

  revalidarConsejo()

  if (data === "invitado") {
    after(() =>
      enviarCorreo(correo, correoInvitacionConsejo({ nombre, rol, invitadoPor: admin.nombre }, obtenerUrlSitio().toString()))
    )
    return {
      tipo: "exito",
      mensaje: `${nombre} aún no tiene cuenta. Quedó invitado: en cuanto cree su cuenta con ${correo} en /registro, entrará al Consejo.`,
    }
  }
  return { tipo: "exito", mensaje: `${nombre} ya tiene acceso al panel.` }
}

export async function actualizarIntegrante(usuarioId: string, rol: string, activo: boolean): Promise<Resultado> {
  await exigirAdminConsejo()
  if (!esUuid(usuarioId) || !esRol(rol)) return { ok: false, mensaje: "Solicitud no válida." }

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.rpc("actualizar_consejo", { p_usuario_id: usuarioId, p_rol: rol, p_activo: activo })
  if (error) {
    return { ok: false, mensaje: mensajeDeErrorConsejo(error.message, "No se pudo guardar el cambio. Inténtalo de nuevo.") }
  }

  revalidarConsejo()
  return { ok: true }
}

export async function cancelarInvitacion(correo: string): Promise<Resultado> {
  await exigirAdminConsejo()
  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.rpc("cancelar_invitacion_consejo", { p_correo: correo })
  if (error) return { ok: false, mensaje: mensajeDeErrorConsejo(error.message, "No se pudo cancelar la invitación.") }

  revalidarConsejo()
  return { ok: true }
}

// Oculta (o restaura) un perfil del directorio por moderación. El dueño no puede revertirlo.
export async function moderarPerfil(usuarioId: string, suspendido: boolean): Promise<Resultado> {
  await exigirAdminConsejo()
  if (!esUuid(usuarioId)) return { ok: false, mensaje: "Perfil no válido." }

  const supabase = await crearClienteSupabaseConSesion()
  const { error } = await supabase.rpc("moderar_perfil", { p_usuario_id: usuarioId, p_suspendido: suspendido })
  if (error) return { ok: false, mensaje: mensajeDeErrorConsejo(error.message, "No se pudo moderar el perfil.") }

  revalidarConsejo()
  revalidatePath(`/miembros/${usuarioId}`)
  return { ok: true }
}
