import { getImageProps } from "next/image"
import { cn } from "cn"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes
  return letras.map((parte) => parte[0]?.toUpperCase() ?? "").join("")
}

// Avatar de shadcn con la foto optimizada por next/image (getImageProps) y las iniciales como respaldo.
// Es decorativo: el nombre siempre aparece junto al avatar, así que no se repite a lectores de pantalla.
export function AvatarMiembro({
  nombre,
  fotoUrl,
  tamano = 64,
  className,
  prioridad = false,
}: {
  nombre: string
  fotoUrl: string | null
  tamano?: number
  className?: string
  prioridad?: boolean
}) {
  const imagen =
    fotoUrl && !fotoUrl.startsWith("blob:")
      ? getImageProps({
          src: fotoUrl,
          alt: "",
          width: tamano,
          height: tamano,
          loading: prioridad ? "eager" : "lazy",
          fetchPriority: prioridad ? "high" : undefined,
        }).props
      : null

  return (
    <Avatar
      className={cn("size-(--tamano) after:border-azul/10", className)}
      style={{ "--tamano": `${tamano}px` } as React.CSSProperties}
    >
      {imagen ? <AvatarImage {...imagen} /> : fotoUrl ? <AvatarImage src={fotoUrl} alt="" /> : null}
      <AvatarFallback
        className="bg-azul font-heading font-semibold text-white"
        style={{ fontSize: Math.round(tamano * 0.36) }}
      >
        <span aria-hidden>{iniciales(nombre || "?")}</span>
      </AvatarFallback>
    </Avatar>
  )
}
