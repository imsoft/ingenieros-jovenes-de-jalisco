import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { applicationStatusLabels, type ApplicationStatus } from "@/lib/panel/statuses"

const badgeStyles: Record<ApplicationStatus, string> = {
  pending: "bg-brand-orange/15 text-foreground",
  approved: "bg-brand-blue/10 text-brand-blue",
  rejected: "bg-destructive/10 text-destructive",
}

const dotStyles: Record<ApplicationStatus, string> = {
  pending: "bg-brand-orange",
  approved: "bg-brand-blue",
  rejected: "bg-destructive",
}

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <Badge className={cn("h-6 gap-1.5 px-2.5", badgeStyles[status], className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", dotStyles[status])} />
      {applicationStatusLabels[status].singular}
    </Badge>
  )
}
