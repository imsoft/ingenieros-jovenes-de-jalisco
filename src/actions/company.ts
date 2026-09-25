"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { companyLogoFolder, getOwnCompany, listCompaniesForUser } from "@/lib/members/companies"
import { getUnusedPhotoPaths } from "@/lib/members/photo-cleanup"
import { PROFILES_BUCKET } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import { companySchema, type CompanyFormState } from "@/lib/validations/company"

type Result = { ok: true } | { ok: false; message: string }

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const
const isUuid = (value: string) => z.uuid().safeParse(value).success
const isValidLogoPath = (userId: string, path: string) =>
  new RegExp(`^${userId}/companies/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(path)

function revalidateNetwork(userId: string) {
  revalidatePath("/mi-perfil")
  revalidatePath("/miembros", "layout")
  revalidatePath(`/miembros/${userId}`)
}

// Logo step 1: authorizes an upload to the member's companies folder, first clearing logos no company uses
// (uploads that were never saved).
export async function createCompanyLogoUpload(
  mimeType: string
): Promise<{ ok: true; path: string; token: string } | { ok: false; message: string }> {
  const member = await requireMember("/mi-perfil")
  const extension = EXTENSIONS[mimeType as keyof typeof EXTENSIONS]
  if (!extension) return { ok: false, message: "Formato no permitido. Usa JPG, PNG o WebP." }

  const supabase = await createSessionSupabaseClient()
  const folder = companyLogoFolder(member.userId)
  const [{ data: files }, companies] = await Promise.all([
    supabase.storage.from(PROFILES_BUCKET).list(folder, { limit: 100 }),
    listCompaniesForUser(member.userId),
  ])
  const inUse = new Set(companies.map((company) => company.logo_path).filter(Boolean))
  const unused = getUnusedPhotoPaths(folder, (files ?? []).filter((file) => file.id).map((file) => file.name), null).filter(
    (path) => !inUse.has(path)
  )
  if (unused.length > 0) await supabase.storage.from(PROFILES_BUCKET).remove(unused)

  const { data, error } = await supabase.storage.from(PROFILES_BUCKET).createSignedUploadUrl(`${folder}/${randomUUID()}.${extension}`)
  if (error || !data) {
    console.error("[company] Could not create the upload URL:", error?.message)
    return { ok: false, message: "No se pudo preparar la subida. Inténtalo de nuevo." }
  }
  return { ok: true, path: data.path, token: data.token }
}

const getText = (formData: FormData, field: string) => {
  const value = formData.get(field)
  return typeof value === "string" ? value : ""
}

// Creates (companyId null) or updates one of the member's companies, then returns to /mi-perfil.
export async function saveCompany(companyId: string | null, _prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const member = await requireMember("/mi-perfil")
  if (companyId && !isUuid(companyId)) return { status: "error", message: "Empresa no válida.", errors: {} }

  const result = companySchema.safeParse({
    name: getText(formData, "name"),
    role: getText(formData, "role"),
    jobTitle: getText(formData, "jobTitle"),
    sector: getText(formData, "sector"),
    description: getText(formData, "description"),
    services: getText(formData, "services"),
    municipality: getText(formData, "municipality"),
    address: getText(formData, "address"),
    linkedinUrl: getText(formData, "linkedinUrl"),
    instagramHandle: getText(formData, "instagramHandle"),
    facebookUrl: getText(formData, "facebookUrl"),
    websiteUrl: getText(formData, "websiteUrl"),
    logoPath: getText(formData, "logoPath"),
  })
  if (!result.success) {
    return { status: "error", message: "Revisa los campos marcados.", errors: z.flattenError(result.error).fieldErrors }
  }

  const data = result.data
  if (data.logoPath && !isValidLogoPath(member.userId, data.logoPath)) {
    return { status: "error", message: "El logo no es válido. Súbelo de nuevo.", errors: {} }
  }

  const row = {
    name: data.name,
    role: data.role,
    job_title: data.jobTitle,
    sector: data.sector,
    description: data.description,
    services: data.services,
    municipality: data.municipality,
    address: data.address,
    website_url: data.websiteUrl,
    linkedin_url: data.linkedinUrl,
    instagram_handle: data.instagramHandle,
    facebook_url: data.facebookUrl,
    logo_path: data.logoPath,
  }

  const supabase = await createSessionSupabaseClient()
  let previousLogo: string | null = null

  if (companyId) {
    const previous = await getOwnCompany(member.userId, companyId)
    if (!previous) return { status: "error", message: "No encontramos esa empresa.", errors: {} }
    previousLogo = previous.logo_path
    const { error } = await supabase.from("member_companies").update(row).eq("id", companyId).eq("user_id", member.userId)
    if (error) {
      console.error("[company] Could not update:", error.code, error.message)
      return { status: "error", message: "No pudimos guardar la empresa. Inténtalo de nuevo.", errors: {} }
    }
  } else {
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("user_id", member.userId).maybeSingle()
    if (!profile) return { status: "error", message: "Primero guarda tu perfil y después agrega tus empresas.", errors: {} }

    const { error } = await supabase.from("member_companies").insert({ ...row, user_id: member.userId })
    if (error) {
      if (error.message.includes("TOO_MANY_COMPANIES")) {
        return { status: "error", message: "Puedes registrar hasta 5 empresas. Elimina una para agregar otra.", errors: {} }
      }
      console.error("[company] Could not create:", error.code, error.message)
      return { status: "error", message: "No pudimos guardar la empresa. Inténtalo de nuevo.", errors: {} }
    }
  }

  if (previousLogo && previousLogo !== data.logoPath) {
    const { error } = await supabase.storage.from(PROFILES_BUCKET).remove([previousLogo])
    if (error) console.error("[company] Could not delete the previous logo:", error.message)
  }

  revalidateNetwork(member.userId)
  redirect(`/mi-perfil?notice=${companyId ? "company-updated" : "company-added"}`)
}

export async function deleteCompany(companyId: string): Promise<Result> {
  const member = await requireMember("/mi-perfil")
  if (!isUuid(companyId)) return { ok: false, message: "Empresa no válida." }

  const company = await getOwnCompany(member.userId, companyId)
  if (!company) return { ok: false, message: "No encontramos esa empresa." }

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase.from("member_companies").delete().eq("id", companyId).eq("user_id", member.userId)
  if (error) {
    console.error("[company] Could not delete:", error.code, error.message)
    return { ok: false, message: "No pudimos eliminar la empresa. Inténtalo de nuevo." }
  }
  if (company.logo_path) await supabase.storage.from(PROFILES_BUCKET).remove([company.logo_path])

  revalidateNetwork(member.userId)
  return { ok: true }
}
