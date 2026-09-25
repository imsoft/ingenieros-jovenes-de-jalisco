import { CircleCheckIcon, ShieldAlertIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "cn"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const styles = {
  error: { icon: TriangleAlertIcon, className: "border-destructive/20 bg-destructive/5 text-destructive", role: "alert" },
  success: { icon: CircleCheckIcon, className: "border-brand-blue/15 bg-brand-blue/5 text-brand-blue", role: "status" },
  warning: { icon: ShieldAlertIcon, className: "border-brand-orange/25 bg-brand-orange/10 text-foreground *:[svg]:text-brand-orange", role: "status" },
} as const

// Form or status message using shadcn's Alert with the brand colors.
export function Notice({
  variant,
  title,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Alert>, "variant" | "title"> & {
  variant: keyof typeof styles
  title?: React.ReactNode
}) {
  const { icon: Icon, className: variantClassName, role } = styles[variant]
  return (
    <Alert role={role} className={cn("rounded-xl px-4 py-3", variantClassName, className)} {...props}>
      <Icon aria-hidden />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription className="leading-relaxed text-current">{children}</AlertDescription>
    </Alert>
  )
}
