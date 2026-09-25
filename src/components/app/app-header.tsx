"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDaysIcon, InboxIcon, LayoutDashboardIcon, ShieldCheckIcon, UserRoundPenIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { AccountDropdown, type AccountSummary } from "@/components/app/account-dropdown"

// Icons are referenced by name because server layouts can't pass components to a client component.
const icons = {
  directory: UsersRoundIcon,
  profile: UserRoundPenIcon,
  summary: LayoutDashboardIcon,
  applications: InboxIcon,
  events: CalendarDaysIcon,
  board: ShieldCheckIcon,
}

export type AppNavItem = { href: string; label: string; icon: keyof typeof icons; exact?: boolean }

// `compact` (mobile) spreads the sections evenly with the icon above the label, so they all fit without scrolling.
function AppNav({ items, className, label, compact = false }: { items: AppNavItem[]; className?: string; label: string; compact?: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label={label} className={cn(compact ? "grid auto-cols-fr grid-flow-col gap-1" : "flex items-center gap-1", className)}>
      {items.map(({ href, label: itemLabel, icon, exact }) => {
        const Icon = icons[icon]
        const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex rounded-lg font-medium whitespace-nowrap transition-colors",
              compact ? "min-w-0 flex-col items-center gap-1 px-1 py-1.5 text-xs" : "shrink-0 items-center gap-2 px-3 py-2 text-sm",
              isActive ? "bg-brand-blue/10 text-brand-blue" : "text-foreground/65 hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {itemLabel}
          </Link>
        )
      })}
    </nav>
  )
}

// Header of the signed-in areas (member network and Consejo panel): one bar with the area, its
// sections and the account menu. On mobile the sections move to an evenly spread row below.
export function AppHeader({
  area,
  homeHref,
  items,
  account,
}: {
  area: string
  homeHref: string
  items: AppNavItem[]
  account: AccountSummary
}) {
  const navLabel = `Secciones de ${area}`

  return (
    <header className="sticky top-0 z-40 border-b border-brand-blue/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={homeHref} className="flex shrink-0 items-center gap-3 rounded-lg">
          <Image src="/brand/logo.svg" alt="" width={36} height={36} className="size-9" />
          <span className="flex flex-col leading-tight">
            <span className="text-[0.65rem] font-semibold tracking-widest text-brand-orange uppercase">Ingenieros Jóvenes</span>
            <span className="font-heading text-sm font-semibold text-brand-blue uppercase">{area}</span>
          </span>
        </Link>

        <span className="hidden h-6 w-px bg-brand-blue/10 md:block" aria-hidden />
        <AppNav items={items} label={navLabel} className="hidden md:flex" />

        <AccountDropdown account={account} showName className="ml-auto" />
      </div>
      {items.length > 1 ? (
        <div className="border-t border-brand-blue/10 md:hidden">
          <AppNav items={items} label={navLabel} compact className="mx-auto max-w-6xl px-3 py-1.5" />
        </div>
      ) : null}
    </header>
  )
}
