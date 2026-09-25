"use client"

import { useState } from "react"

import { createBrowserSupabaseClient } from "@/lib/supabase/browser"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 2 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ALLOWED_TYPES.join(",")

type UploadRequest = (mimeType: string) => Promise<{ ok: true; path: string; token: string } | { ok: false; message: string }>

// Uploads an image to the profiles bucket through a signed URL that a server action authorizes.
export function useImageUpload(requestUpload: UploadRequest) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File): Promise<{ path: string; url: string } | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Usa una imagen JPG, PNG o WebP.")
      return null
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen pesa más de 2 MB.")
      return null
    }

    setError(null)
    setUploading(true)
    const request = await requestUpload(file.type)
    if (!request.ok) {
      setUploading(false)
      setError(request.message)
      return null
    }

    const { error: uploadError } = await createBrowserSupabaseClient()
      .storage.from("profiles")
      .uploadToSignedUrl(request.path, request.token, file, { contentType: file.type, cacheControl: "31536000" })
    setUploading(false)

    if (uploadError) {
      setError("No se pudo subir la imagen. Inténtalo de nuevo.")
      return null
    }
    return { path: request.path, url: URL.createObjectURL(file) }
  }

  return { upload, uploading, error }
}
