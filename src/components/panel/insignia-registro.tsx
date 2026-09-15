import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { etiquetasRegistro, type EstadoRegistro } from "@/lib/eventos/registros"

const estilos: Record<EstadoRegistro, { insignia: string; punto: string }> = {
  pendiente_pago: { insignia: "bg-naranja/15 text-foreground", punto: "bg-naranja" },
  pagado: { insignia: "bg-azul/10 text-azul", punto: "bg-azul" },
  cancelado: { insignia: "bg-muted text-muted-foreground", punto: "bg-muted-foreground" },
}

export function InsigniaRegistro({ estado, className }: { estado: EstadoRegistro; className?: string }) {
  return (
    <Badge className={cn("h-6 gap-1.5 px-2.5", estilos[estado].insignia, className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", estilos[estado].punto)} />
      {etiquetasRegistro[estado]}
    </Badge>
  )
}
