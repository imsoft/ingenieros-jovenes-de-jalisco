"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getUnusedPhotoPaths } from "@/lib/members/photo-cleanup"
import { PROFILES_BUCKET } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import { profileSchema, type ProfileFormState } from "@/lib/validations/profile"

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const

const isValidPhotoPath = (userId: string, path: string) =>
  new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path)

type SessionClient = Awaited<ReturnType<typeof createSessionSupabaseClient>>

// Deletes the photos in the member's folder that their profile doesn't use: uploads that were never
// saved and replaced photos. Never fails the calling action; leftovers are cleaned on the next call.
async function removeUnusedPhotos(supabase: SessionClient, userId: string, keepPath: string | null) {
  const { data: files, error } = await supabase.storage.from(PROFILES_BUCKET).list(userId, { limit: 100 })
  if (error) {
    console.error("[profile] Could not list the photo folder:", error.message)
    return
  }

  const unused = getUnusedPhotoPaths(userId, (files ?? []).map((file) => file.name), keepPath)
  if (unused.length === 0) return

  const { error: removeError } = await supabase.storage.from(PROFILES_BUCKET).remove(unused)
  if (removeError) console.error("[profile] Could not delete unused photos:", removeError.message)
}

// Photo step 1: the server authorizes the upload to the member's own folder.
export async function createProfilePhotoUpload(
  mimeType: string
): Promise<{ ok: true; path: string; token: string } | { ok: false; message: string }> {
  const member = await requireMember("/mi-perfil")
  const extension = EXTENSIONS[mimeType as keyof typeof EXTENSIONS]
  if (!extension) return { ok: false, message: "Formato no permitido. Usa JPG, PNG o WebP." }

  const supabase = await createSessionSupabaseClient()

  // Clears photos from earlier uploads that were never saved, keeping the one the profile uses.
  const { data: profile } = await supabase.from("profiles").select("photo_path").eq("user_id", member.userId).maybeSingle()
  await removeUnusedPhotos(supabase, member.userId, profile?.photo_path ?? null)

  const { data, error } = await supabase.storage
    .from(PROFILES_BUCKET)
    .createSignedUploadUrl(`${member.userId}/${randomUUID()}.${extension}`)

  if (error || !data) {
    console.error("[profile] Could not create the upload URL:", error?.message)
    return { ok: false, message: "No se pudo preparar la subida. Inténtalo de nuevo." }
  }
  return { ok: true, path: data.path, token: data.token }
}

const getText = (formData: FormData, field: string) => {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

// Step 2 (and the only one for the rest of the data): saves the profile and deletes every photo it no longer uses.
export async function saveProfile(_prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const member = await requireMember("/mi-perfil")

  const result = profileSchema.safeParse({
    fullName: getText(formData, "fullName"),
    headline: getText(formData, "headline"),
    specialty: getText(formData, "specialty"),
    company: getText(formData, "company"),
    jobTitle: getText(formData, "jobTitle"),
    municipality: getText(formData, "municipality"),
    bio: getText(formData, "bio"),
    linkedinUrl: getText(formData, "linkedinUrl"),
    instagramHandle: getText(formData, "instagramHandle"),
    websiteUrl: getText(formData, "websiteUrl"),
    isVisible: formData.get("isVisible") === "on",
    photoPath: getText(formData, "photoPath"),
  })

  if (!result.success) {
    return { status: "error", message: "Revisa los campos marcados.", errors: z.flattenError(result.error).fieldErrors }
  }

  const data = result.data
  if (data.photoPath && !isValidPhotoPath(member.userId, data.photoPath)) {
    return { status: "error", message: "La foto no es válida. Súbela de nuevo.", errors: {} }
  }

  const row = {
    full_name: data.fullName,
    headline: data.headline,
    specialty: data.specialty,
    company: data.company,
    job_title: data.jobTitle,
    municipality: data.municipality,
    bio: data.bio,
    linkedin_url: data.linkedinUrl,
    instagram_handle: data.instagramHandle,
    website_url: data.websiteUrl,
    is_visible: data.isVisible,
    photo_path: data.photoPath,
  }

  const supabase = await createSessionSupabaseClient()
  const { data: previous } = await supabase
    .from("profiles")
    .select("photo_path")
    .eq("user_id", member.userId)
    .maybeSingle()

  // No upsert: user_id isn't updatable at the column level, so we decide between insert and update.
  const { error } = previous
    ? await supabase.from("profiles").update(row).eq("user_id", member.userId)
    : await supabase.from("profiles").insert({ ...row, user_id: member.userId })

  if (error) {
    console.error("[profile] Could not save:", error.code, error.message)
    return { status: "error", message: "No pudimos guardar tu perfil. Inténtalo de nuevo.", errors: {} }
  }

  await removeUnusedPhotos(supabase, member.userId, data.photoPath)

  revalidatePath("/miembros", "layout")
  revalidatePath("/mi-perfil")
  return {
    status: "success",
    message: data.isVisible
      ? "Perfil guardado. Ya apareces en el directorio de miembros."
      : "Perfil guardado. Está oculto: solo tú puedes verlo.",
  }
}
