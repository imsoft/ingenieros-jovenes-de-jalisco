import { CodeXmlIcon, ShieldCheckIcon } from "lucide-react"
import { cn } from "cn"

import type { BadgeKind, MemberBadge } from "@/lib/members/badges"

const styles: Record<BadgeKind, { icon: typeof ShieldCheckIcon; className: string; iconClassName: string }> = {
  board: { icon: ShieldCheckIcon, className: "bg-brand-navy text-white", iconClassName: "bg-brand-orange text-white" },
  platform_creator: {
    icon: CodeXmlIcon,
    className: "bg-linear-to-r from-brand-orange to-[#f0954f] text-white",
    iconClassName: "bg-white text-brand-orange",
  },
}

// Medal-like pills: Consejo position and special recognitions.
export function MemberBadges({ badges, size = "md", className }: { badges: MemberBadge[] | undefined; size?: "sm" | "md"; className?: string }) {
  if (!badges?.length) return null
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Distintivos">
      {badges.map((badge) => {
        const { icon: Icon, className: badgeClassName, iconClassName } = styles[badge.kind]
        return (
          <li
            key={`${badge.kind}-${badge.label}`}
            className={cn(
              "flex max-w-full items-center rounded-full font-semibold shadow-sm",
              size === "sm" ? "gap-1.5 py-0.5 pr-2.5 pl-0.5 text-xs" : "gap-2 py-1 pr-3.5 pl-1 text-sm",
              badgeClassName
            )}
          >
            <span className={cn("flex shrink-0 items-center justify-center rounded-full", size === "sm" ? "size-5" : "size-6", iconClassName)}>
              <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
            </span>
            <span className="truncate">{badge.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
