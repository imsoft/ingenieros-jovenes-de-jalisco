"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlusIcon, ImageUpIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { addGalleryPhoto, confirmCoverImage, createImageUpload, removeCoverImage } from "@/actions/panel-events"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) return `“${file.name}” no es JPG, PNG ni WebP.`
  if (file.size > MAX_BYTES) return `“${file.name}” pesa más de 5 MB.`
  return null
}

// Uploads straight from the browser to Storage with a signed URL authorized by the server.
async function uploadFile(
  eventId: string,
  target: "cover" | "gallery",
  file: File
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const upload = await createImageUpload(eventId, target, file.type)
  if (!upload.ok) return upload

  const { error } = await createBrowserSupabaseClient()
    .storage.from("events")
    .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type, cacheControl: "31536000" })

  if (error) return { ok: false, message: `No se pudo subir “${file.name}”.` }
  return { ok: true, path: upload.path }
}

function FilePicker({
  label,
  multiple = false,
  disabled,
  onSelect,
}: {
  label: string
  multiple?: boolean
  disabled: boolean
  onSelect: (files: File[]) => void
}) {
  return (
    <label
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-10 cursor-pointer focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <ImagePlusIcon data-icon="inline-start" aria-hidden />
      {label}
      <input
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ""
          if (files.length > 0) onSelect(files)
        }}
      />
    </label>
  )
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

export function CoverImageUpload({
  eventId,
  coverUrl,
  title,
}: {
  eventId: string
  coverUrl: string | null
  title: string
}) {
  const router = useRouter()
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect([file]: File[]) {
    const invalid = validateFile(file)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    setIsBusy(true)
    const upload = await uploadFile(eventId, "cover", file)
    const result = upload.ok ? await confirmCoverImage(eventId, upload.path) : upload
    setIsBusy(false)
    if (!result.ok) setError(result.message)
    else router.refresh()
  }

  async function handleRemove() {
    setIsBusy(true)
    const result = await removeCoverImage(eventId)
    setIsBusy(false)
    if (!result.ok) setError(result.message)
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-secondary">
        {coverUrl ? (
          <Image src={coverUrl} alt={`Portada de ${title}`} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageUpIcon className="size-8" aria-hidden />
            <span className="text-sm">Sin portada</span>
          </div>
        )}
        {isBusy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70" aria-live="polite">
            <Spinner className="size-6 text-brand-blue" />
          </div>
        ) : null}
      </div>
      <ErrorMessage message={error} />
      <div className="flex flex-wrap gap-2">
        <FilePicker label={coverUrl ? "Cambiar portada" : "Subir portada"} disabled={isBusy} onSelect={handleSelect} />
        {coverUrl ? (
          <Button type="button" variant="ghost" size="lg" className="h-10 text-destructive" disabled={isBusy} onClick={handleRemove}>
            <Trash2Icon data-icon="inline-start" aria-hidden />
            Quitar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function GalleryUpload({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  async function handleSelect(files: File[]) {
    const newErrors: string[] = []
    const validFiles = files.filter((file) => {
      const invalid = validateFile(file)
      if (invalid) newErrors.push(invalid)
      return !invalid
    })

    for (const [index, file] of validFiles.entries()) {
      setProgress({ current: index + 1, total: validFiles.length })
      const upload = await uploadFile(eventId, "gallery", file)
      const result = upload.ok ? await addGalleryPhoto(eventId, upload.path) : upload
      if (!result.ok) newErrors.push(result.message)
    }

    setProgress(null)
    setErrors(newErrors)
    if (validFiles.length > 0) router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FilePicker label="Agregar fotos" multiple disabled={progress !== null} onSelect={handleSelect} />
        {progress ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Spinner />
            Subiendo {progress.current} de {progress.total}…
          </span>
        ) : null}
      </div>
      {errors.map((message) => (
        <ErrorMessage key={message} message={message} />
      ))}
    </div>
  )
}
