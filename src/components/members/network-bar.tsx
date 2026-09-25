"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOutIcon, UserRoundPenIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { signOutMember } from "@/actions/account"
import { SubmitButton } from "@/components/panel/submit-button"

const links = [
  { href: "/miembros", label: "Directorio", icon: UsersRoundIcon },
  { href: "/mi-perfil", label: "Mi perfil", icon: UserRoundPenIcon },
]

// Secondary navigation of the member network, below the site header.
export function NetworkBar({ isBoardMember }: { isBoardMember: boolean }) {
  const pathname = usePathname()

  return (
    <div className="border-b border-brand-blue/10 bg-secondary/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <nav aria-label="Red de miembros" className="-mb-px flex gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/miembros" ? pathname === "/miembros" || pathname.startsWith("/miembros/") : pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive ? "border-brand-orange text-brand-blue" : "border-transparent text-foreground/65 hover:text-brand-blue"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            )
          })}
          {isBoardMember ? (
            <Link
              href="/panel"
              prefetch={false}
              className="flex h-12 items-center border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap text-foreground/65 transition-colors hover:text-brand-blue"
            >
              <span className="sm:hidden">Consejo</span>
              <span className="hidden sm:inline">Panel del Consejo</span>
            </Link>
          ) : null}
        </nav>
        <form action={signOutMember}>
          <SubmitButton variant="ghost" size="sm" className="text-foreground/65 hover:text-brand-blue">
            <LogOutIcon data-icon="inline-start" aria-hidden />
            <span className="sr-only sm:not-sr-only">Salir</span>
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
