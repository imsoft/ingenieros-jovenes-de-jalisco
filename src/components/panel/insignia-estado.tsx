import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { etiquetasEstado, type EstadoSolicitud } from "@/lib/panel/estados"

const estilos: Record<EstadoSolicitud, string> = {
  pendiente: "bg-naranja/15 text-foreground",
  aprobada: "bg-azul/10 text-azul",
  rechazada: "bg-destructive/10 text-destructive",
}

const puntos: Record<EstadoSolicitud, string> = {
  pendiente: "bg-naranja",
  aprobada: "bg-azul",
  rechazada: "bg-destructive",
}

export function InsigniaEstado({ estado, className }: { estado: EstadoSolicitud; className?: string }) {
  return (
    <Badge className={cn("h-6 gap-1.5 px-2.5", estilos[estado], className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", puntos[estado])} />
      {etiquetasEstado[estado].singular}
    </Badge>
  )
}
