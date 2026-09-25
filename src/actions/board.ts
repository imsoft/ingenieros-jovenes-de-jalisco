"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { sendEmail } from "@/lib/email/send"
import { boardInvitationEmail } from "@/lib/email/templates"
import { requireBoardAdmin, type BoardRole } from "@/lib/panel/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import { getSiteUrl } from "@/lib/site-url"
import {
  addBoardMemberSchema,
  getBoardErrorMessage,
  type AddBoardMemberFormState,
} from "@/lib/validations/board"

type ActionResult = { ok: true } | { ok: false; message: string }

const isUuid = (value: string) => z.uuid().safeParse(value).success
const isBoardRole = (value: string): value is BoardRole => value === "admin" || value === "reviewer"

function revalidateBoard() {
  revalidatePath("/panel", "layout")
  revalidatePath("/miembros", "layout")
}

export async function addBoardMember(
  _previousState: AddBoardMemberFormState,
  formData: FormData
): Promise<AddBoardMemberFormState> {
  const admin = await requireBoardAdmin()

  const result = addBoardMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
  })
  if (!result.success) {
    return { status: "error", message: "Revisa los campos marcados.", errors: z.flattenError(result.error).fieldErrors }
  }

  const { fullName, email, role } = result.data
  const supabase = await createSessionSupabaseClient()
  const { data, error } = await supabase.rpc("add_board_member", { p_email: email, p_full_name: fullName, p_role: role })

  if (error) {
    console.error("[panel] Could not add board member:", error.code, error.message)
    return { status: "error", message: getBoardErrorMessage(error.message, "No se pudo agregar. Inténtalo de nuevo."), errors: {} }
  }

  revalidateBoard()

  if (data === "invited") {
    after(() =>
      sendEmail(email, boardInvitationEmail({ fullName, role, invitedBy: admin.name }, getSiteUrl().toString()))
    )
    return {
      status: "success",
      message: `${fullName} aún no tiene cuenta. Quedó invitado: en cuanto cree su cuenta con ${email} en /registro, entrará al Consejo.`,
    }
  }
  return { status: "success", message: `${fullName} ya tiene acceso al panel.` }
}

export async function updateBoardMember(userId: string, role: string, isActive: boolean): Promise<ActionResult> {
  await requireBoardAdmin()
  if (!isUuid(userId) || !isBoardRole(role)) return { ok: false, message: "Solicitud no válida." }

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.rpc("update_board_member", { p_user_id: userId, p_role: role, p_is_active: isActive })
  if (error) {
    return { ok: false, message: getBoardErrorMessage(error.message, "No se pudo guardar el cambio. Inténtalo de nuevo.") }
  }

  revalidateBoard()
  return { ok: true }
}

export async function cancelBoardInvitation(email: string): Promise<ActionResult> {
  await requireBoardAdmin()
  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.rpc("cancel_board_invitation", { p_email: email })
  if (error) return { ok: false, message: getBoardErrorMessage(error.message, "No se pudo cancelar la invitación.") }

  revalidateBoard()
  return { ok: true }
}

// Hides (or restores) a profile from the directory for moderation. The owner can't undo it.
export async function moderateProfile(userId: string, isSuspended: boolean): Promise<ActionResult> {
  await requireBoardAdmin()
  if (!isUuid(userId)) return { ok: false, message: "Perfil no válido." }

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.rpc("moderate_profile", { p_user_id: userId, p_is_suspended: isSuspended })
  if (error) return { ok: false, message: getBoardErrorMessage(error.message, "No se pudo moderar el perfil.") }

  revalidateBoard()
  revalidatePath(`/miembros/${userId}`)
  return { ok: true }
}
