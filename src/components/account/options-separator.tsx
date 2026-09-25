import { Separator } from "@/components/ui/separator"

// Separates the Google button from the email form.
export function OptionsSeparator({ label = "o con tu correo" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      {label}
      <Separator className="flex-1" />
    </div>
  )
}
