import { CircleCheckIcon, ShieldAlertIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const estilos = {
  error: { icono: TriangleAlertIcon, clase: "border-destructive/20 bg-destructive/5 text-destructive", rol: "alert" },
  exito: { icono: CircleCheckIcon, clase: "border-azul/15 bg-azul/5 text-azul", rol: "status" },
  advertencia: { icono: ShieldAlertIcon, clase: "border-naranja/25 bg-naranja/10 text-foreground *:[svg]:text-naranja", rol: "status" },
} as const

// Mensaje de formulario o de estado con el Alert de shadcn y los colores de la marca.
export function Aviso({
  tipo,
  titulo,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Alert>, "variant" | "title"> & {
  tipo: keyof typeof estilos
  titulo?: React.ReactNode
}) {
  const { icono: Icono, clase, rol } = estilos[tipo]
  return (
    <Alert role={rol} className={cn("rounded-xl px-4 py-3", clase, className)} {...props}>
      <Icono aria-hidden />
      {titulo ? <AlertTitle>{titulo}</AlertTitle> : null}
      <AlertDescription className="leading-relaxed text-current">{children}</AlertDescription>
    </Alert>
  )
}
