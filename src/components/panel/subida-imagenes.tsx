"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlusIcon, ImageUpIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { agregarFoto, confirmarPortada, crearSubidaImagen, quitarPortada } from "@/acciones/eventos-panel"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { crearClienteSupabaseNavegador } from "@/lib/supabase/navegador"

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"]
const MAXIMO_BYTES = 5 * 1024 * 1024

function validarArchivo(archivo: File) {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return `“${archivo.name}” no es JPG, PNG ni WebP.`
  if (archivo.size > MAXIMO_BYTES) return `“${archivo.name}” pesa más de 5 MB.`
  return null
}

// Sube directo del navegador a Storage con una URL firmada que autoriza el servidor.
async function subirArchivo(
  eventoId: string,
  destino: "portada" | "galeria",
  archivo: File
): Promise<{ ok: true; ruta: string } | { ok: false; mensaje: string }> {
  const permiso = await crearSubidaImagen(eventoId, destino, archivo.type)
  if (!permiso.ok) return permiso

  const { error } = await crearClienteSupabaseNavegador()
    .storage.from("eventos")
    .uploadToSignedUrl(permiso.ruta, permiso.token, archivo, { contentType: archivo.type, cacheControl: "31536000" })

  if (error) return { ok: false, mensaje: `No se pudo subir “${archivo.name}”.` }
  return { ok: true, ruta: permiso.ruta }
}

function SelectorArchivos({
  etiqueta,
  multiple = false,
  deshabilitado,
  alElegir,
}: {
  etiqueta: string
  multiple?: boolean
  deshabilitado: boolean
  alElegir: (archivos: File[]) => void
}) {
  return (
    <label
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "h-10 cursor-pointer focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        deshabilitado && "pointer-events-none opacity-50"
      )}
    >
      <ImagePlusIcon data-icon="inline-start" aria-hidden />
      {etiqueta}
      <input
        type="file"
        accept={TIPOS_PERMITIDOS.join(",")}
        multiple={multiple}
        disabled={deshabilitado}
        className="sr-only"
        onChange={(evento) => {
          const archivos = Array.from(evento.target.files ?? [])
          evento.target.value = ""
          if (archivos.length > 0) alElegir(archivos)
        }}
      />
    </label>
  )
}

function MensajeError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {mensaje}
    </p>
  )
}

export function SubidaPortada({
  eventoId,
  portadaUrl,
  titulo,
}: {
  eventoId: string
  portadaUrl: string | null
  titulo: string
}) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function alElegir([archivo]: File[]) {
    const invalido = validarArchivo(archivo)
    if (invalido) {
      setError(invalido)
      return
    }
    setError(null)
    setOcupado(true)
    const subida = await subirArchivo(eventoId, "portada", archivo)
    const resultado = subida.ok ? await confirmarPortada(eventoId, subida.ruta) : subida
    setOcupado(false)
    if (!resultado.ok) setError(resultado.mensaje)
    else router.refresh()
  }

  async function alQuitar() {
    setOcupado(true)
    const resultado = await quitarPortada(eventoId)
    setOcupado(false)
    if (!resultado.ok) setError(resultado.mensaje)
    else router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-secondary">
        {portadaUrl ? (
          <Image src={portadaUrl} alt={`Portada de ${titulo}`} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageUpIcon className="size-8" aria-hidden />
            <span className="text-sm">Sin portada</span>
          </div>
        )}
        {ocupado ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70" aria-live="polite">
            <Spinner className="size-6 text-azul" />
          </div>
        ) : null}
      </div>
      <MensajeError mensaje={error} />
      <div className="flex flex-wrap gap-2">
        <SelectorArchivos etiqueta={portadaUrl ? "Cambiar portada" : "Subir portada"} deshabilitado={ocupado} alElegir={alElegir} />
        {portadaUrl ? (
          <Button type="button" variant="ghost" size="lg" className="h-10 text-destructive" disabled={ocupado} onClick={alQuitar}>
            <Trash2Icon data-icon="inline-start" aria-hidden />
            Quitar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function SubidaGaleria({ eventoId }: { eventoId: string }) {
  const router = useRouter()
  const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null)
  const [errores, setErrores] = useState<string[]>([])

  async function alElegir(archivos: File[]) {
    const nuevosErrores: string[] = []
    const validos = archivos.filter((archivo) => {
      const invalido = validarArchivo(archivo)
      if (invalido) nuevosErrores.push(invalido)
      return !invalido
    })

    for (const [indice, archivo] of validos.entries()) {
      setProgreso({ actual: indice + 1, total: validos.length })
      const subida = await subirArchivo(eventoId, "galeria", archivo)
      const resultado = subida.ok ? await agregarFoto(eventoId, subida.ruta) : subida
      if (!resultado.ok) nuevosErrores.push(resultado.mensaje)
    }

    setProgreso(null)
    setErrores(nuevosErrores)
    if (validos.length > 0) router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SelectorArchivos etiqueta="Agregar fotos" multiple deshabilitado={progreso !== null} alElegir={alElegir} />
        {progreso ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <Spinner />
            Subiendo {progreso.actual} de {progreso.total}…
          </span>
        ) : null}
      </div>
      {errores.map((mensaje) => (
        <MensajeError key={mensaje} mensaje={mensaje} />
      ))}
    </div>
  )
}
