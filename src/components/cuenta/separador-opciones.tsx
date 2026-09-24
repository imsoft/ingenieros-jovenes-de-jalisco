import { Separator } from "@/components/ui/separator"

// Divide el botón de Google del formulario de correo.
export function SeparadorOpciones({ texto = "o con tu correo" }: { texto?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      {texto}
      <Separator className="flex-1" />
    </div>
  )
}
