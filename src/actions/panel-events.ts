"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { getEventSlug, localDateTimeToIso, type EventFormValues } from "@/lib/events/form"
import { isRegistrationStatus, type RegistrationStatus } from "@/lib/events/registrations"
import { requireBoardMember } from "@/lib/panel/session"
import { createSessionSupabaseClient } from "@/lib/supabase/session"
import { eventSchema, type EventFormState } from "@/lib/validations/panel-event"

const BUCKET = "events"
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const

type UploadTarget = "cover" | "gallery"

type ActionResult = { ok: true } | { ok: false; message: string }

const isUuid = (value: string) => z.uuid().safeParse(value).success

// Refreshes the public site and the panel after any change to events.
function revalidateEvents(...slugs: (string | null | undefined)[]) {
  revalidatePath("/")
  revalidatePath("/eventos")
  revalidatePath("/sitemap.xml")
  for (const slug of new Set(slugs)) if (slug) revalidatePath(`/eventos/${slug}`)
  revalidatePath("/panel", "layout")
}

function readValues(formData: FormData): EventFormValues {
  const text = (field: string) => {
    const value = formData.get(field)
    return typeof value === "string" ? value : ""
  }
  return {
    title: text("title"),
    // The slug is not entered: the server generates it when the event is created.
    slug: "",
    summary: text("summary"),
    description: text("description"),
    date: text("date"),
    startTime: text("startTime"),
    endTime: text("endTime"),
    venue: text("venue"),
    address: text("address"),
    mapUrl: text("mapUrl"),
    publicPrice: text("publicPrice"),
    memberPrice: text("memberPrice"),
    capacity: text("capacity"),
    paymentInstructions: text("paymentInstructions"),
    registrationOpen: formData.get("registrationOpen") === "on",
    isPublished: formData.get("isPublished") === "on",
  }
}

const isDuplicateSlug = (error: { code?: string; message: string }) =>
  error.code === "23505" && error.message.includes("slug")

function saveError(error: { code?: string; message: string }, values: EventFormValues): EventFormState {
  console.error("[panel] Could not save event:", error.code, error.message)
  return { status: "error", message: "No se pudo guardar el evento. Inténtalo de nuevo.", errors: {}, values }
}

export async function saveEvent(
  eventId: string | null,
  _previousState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const member = await requireBoardMember()
  const values = readValues(formData)

  if (eventId !== null && !isUuid(eventId)) {
    return { status: "error", message: "Evento no válido.", errors: {}, values }
  }

  const result = eventSchema.safeParse(values)
  if (!result.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      errors: z.flattenError(result.error).fieldErrors,
      values,
    }
  }

  const data = result.data

  const row = {
    title: data.title,
    summary: data.summary,
    description: data.description,
    starts_at: localDateTimeToIso(data.date, data.startTime),
    ends_at: data.endTime ? localDateTimeToIso(data.date, data.endTime) : null,
    venue: data.venue,
    address: data.address,
    map_url: data.mapUrl,
    public_price: data.publicPrice,
    member_price: data.memberPrice,
    capacity: data.capacity,
    payment_instructions: data.paymentInstructions,
    registration_open: data.registrationOpen,
    is_published: data.isPublished,
  }

  const supabase = await createSessionSupabaseClient()

  if (eventId === null) {
    // The slug comes from the title and year; if it already exists, a number is appended (-2, -3…).
    const base = getEventSlug(data.title, data.date)
    if (!base) {
      return {
        status: "error",
        message: "Revisa los campos marcados.",
        errors: { title: ["El título debe incluir letras o números."] },
        values,
      }
    }

    for (let attempt = 1; attempt <= 20; attempt++) {
      const slug = attempt === 1 ? base : `${base.slice(0, 76).replace(/-+$/, "")}-${attempt}`
      const { data: inserted, error } = await supabase
        .from("events")
        .insert({ ...row, slug, created_by: member.userId })
        .select("id")
        .single()

      if (error && isDuplicateSlug(error)) continue
      if (error) return saveError(error, values)

      revalidateEvents(slug)
      redirect(`/panel/eventos/${inserted.id}?created=1`)
    }

    return {
      status: "error",
      message: "Ya hay muchos eventos con ese título. Cámbialo un poco para distinguirlo.",
      errors: { title: ["Usa un título más específico."] },
      values,
    }
  }

  // When editing, the slug does not change so links already shared keep working.
  const { data: updated, error } = await supabase.from("events").update(row).eq("id", eventId).select("id, slug")
  if (error) return saveError(error, values)
  if (!updated?.length) {
    return {
      status: "error",
      message: "No encontramos el evento o ya no tienes permiso para editarlo.",
      errors: {},
      values,
    }
  }

  revalidateEvents(updated[0].slug)
  return {
    status: "success",
    message: data.isPublished
      ? "Cambios guardados y publicados en el sitio."
      : "Cambios guardados. El evento sigue como borrador.",
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const member = await requireBoardMember()
  if (member.role !== "admin") return { ok: false, message: "Solo un administrador puede eliminar eventos." }
  if (!isUuid(eventId)) return { ok: false, message: "Evento no válido." }

  const supabase = await createSessionSupabaseClient()
  const { data: event } = await supabase
    .from("events")
    .select("slug, cover_path, photos:event_photos(path)")
    .eq("id", eventId)
    .maybeSingle()
  if (!event) return { ok: false, message: "No encontramos el evento." }

  const { data, error } = await supabase.from("events").delete().eq("id", eventId).select("id")
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        message: "Este evento ya tiene registros, así que no se puede borrar. Despublícalo para ocultarlo del sitio.",
      }
    }
    console.error("[panel] Could not delete event:", error.message)
    return { ok: false, message: "No se pudo eliminar el evento. Inténtalo de nuevo." }
  }
  if (!data?.length) return { ok: false, message: "No tienes permiso para eliminar este evento." }

  const paths = [event.cover_path, ...((event.photos ?? []) as { path: string }[]).map((photo) => photo.path)].filter(
    (path): path is string => Boolean(path)
  )
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths)

  revalidateEvents(event.slug)
  redirect("/panel/eventos")
}

// Upload step 1: authorizes the browser to upload a file directly to Storage.
export async function createImageUpload(
  eventId: string,
  target: UploadTarget,
  mimeType: string
): Promise<{ ok: true; path: string; token: string } | { ok: false; message: string }> {
  await requireBoardMember()
  if (!isUuid(eventId) || (target !== "cover" && target !== "gallery")) {
    return { ok: false, message: "Solicitud de subida no válida." }
  }

  const extension = EXTENSIONS[mimeType as keyof typeof EXTENSIONS]
  if (!extension) return { ok: false, message: "Formato no permitido. Usa JPG, PNG o WebP." }

  const supabase = await createSessionSupabaseClient()
  const path = `${eventId}/${target}/${randomUUID()}.${extension}`
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)

  if (error || !data) {
    console.error("[panel] Could not create upload URL:", error?.message)
    return { ok: false, message: "No se pudo preparar la subida. Inténtalo de nuevo." }
  }
  return { ok: true, path: data.path, token: data.token }
}

const uploadedPathFormat = (eventId: string, target: UploadTarget) =>
  new RegExp(`^${eventId}/${target}/[0-9a-f-]{36}\\.(jpg|png|webp)$`)

// Step 2: saves the newly uploaded cover and deletes the previous one.
export async function confirmCoverImage(eventId: string, path: string): Promise<ActionResult> {
  await requireBoardMember()
  if (!isUuid(eventId) || !uploadedPathFormat(eventId, "cover").test(path)) {
    return { ok: false, message: "Imagen no válida." }
  }

  const supabase = await createSessionSupabaseClient()
  const { data: previous } = await supabase.from("events").select("slug, cover_path").eq("id", eventId).maybeSingle()
  if (!previous) return { ok: false, message: "No encontramos el evento." }

  const { error } = await supabase.from("events").update({ cover_path: path }).eq("id", eventId)
  if (error) {
    console.error("[panel] Could not save cover image:", error.message)
    return { ok: false, message: "No se pudo guardar la portada." }
  }

  if (previous.cover_path && previous.cover_path !== path) {
    await supabase.storage.from(BUCKET).remove([previous.cover_path])
  }

  revalidateEvents(previous.slug)
  return { ok: true }
}

export async function removeCoverImage(eventId: string): Promise<ActionResult> {
  await requireBoardMember()
  if (!isUuid(eventId)) return { ok: false, message: "Evento no válido." }

  const supabase = await createSessionSupabaseClient()
  const { data: previous } = await supabase.from("events").select("slug, cover_path").eq("id", eventId).maybeSingle()
  if (!previous) return { ok: false, message: "No encontramos el evento." }

  const { error } = await supabase.from("events").update({ cover_path: null }).eq("id", eventId)
  if (error) return { ok: false, message: "No se pudo quitar la portada." }

  if (previous.cover_path) await supabase.storage.from(BUCKET).remove([previous.cover_path])

  revalidateEvents(previous.slug)
  return { ok: true }
}

export async function addGalleryPhoto(eventId: string, path: string): Promise<ActionResult> {
  await requireBoardMember()
  if (!isUuid(eventId) || !uploadedPathFormat(eventId, "gallery").test(path)) {
    return { ok: false, message: "Imagen no válida." }
  }

  const supabase = await createSessionSupabaseClient()
  const [{ data: event }, { data: last }] = await Promise.all([
    supabase.from("events").select("slug").eq("id", eventId).maybeSingle(),
    supabase
      .from("event_photos")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (!event) return { ok: false, message: "No encontramos el evento." }

  const { error } = await supabase
    .from("event_photos")
    .insert({ event_id: eventId, path, sort_order: (last?.sort_order ?? -1) + 1 })
  if (error) {
    console.error("[panel] Could not add photo:", error.message)
    return { ok: false, message: "No se pudo agregar la foto a la galería." }
  }

  revalidateEvents(event.slug)
  return { ok: true }
}

export async function deleteGalleryPhoto(photoId: string): Promise<ActionResult> {
  await requireBoardMember()
  if (!isUuid(photoId)) return { ok: false, message: "Foto no válida." }

  const supabase = await createSessionSupabaseClient()
  const { data: photo } = await supabase
    .from("event_photos")
    .select("path, event:events(slug)")
    .eq("id", photoId)
    .maybeSingle()
  if (!photo) return { ok: false, message: "No encontramos la foto." }

  const { error } = await supabase.from("event_photos").delete().eq("id", photoId)
  if (error) return { ok: false, message: "No se pudo quitar la foto." }

  await supabase.storage.from(BUCKET).remove([photo.path])

  const event = photo.event as unknown as { slug: string } | null
  revalidateEvents(event?.slug)
  return { ok: true }
}

export async function updateRegistrationStatus(
  registrationId: string,
  eventId: string,
  status: RegistrationStatus
): Promise<void> {
  await requireBoardMember()
  if (!isUuid(registrationId) || !isUuid(eventId) || !isRegistrationStatus(status)) return

  const supabase = await createSessionSupabaseClient()
  const { error } = await supabase
    .from("event_registrations")
    .update({ status })
    .eq("id", registrationId)
    .eq("event_id", eventId)

  // 23505: when reactivating, another active registration with the same email already exists.
  if (error) console.error("[panel] Could not update registration status:", error.code, error.message)

  const { data: event } = await supabase.from("events").select("slug").eq("id", eventId).maybeSingle()
  revalidateEvents(event?.slug)
}
