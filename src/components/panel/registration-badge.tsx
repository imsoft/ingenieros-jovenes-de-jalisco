import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { registrationStatusLabels, type RegistrationStatus } from "@/lib/events/registrations"

const styles: Record<RegistrationStatus, { badge: string; dot: string }> = {
  pending_payment: { badge: "bg-brand-orange/15 text-foreground", dot: "bg-brand-orange" },
  paid: { badge: "bg-brand-blue/10 text-brand-blue", dot: "bg-brand-blue" },
  cancelled: { badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
}

export function RegistrationStatusBadge({ status, className }: { status: RegistrationStatus; className?: string }) {
  return (
    <Badge className={cn("h-6 gap-1.5 px-2.5", styles[status].badge, className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", styles[status].dot)} />
      {registrationStatusLabels[status]}
    </Badge>
  )
}
