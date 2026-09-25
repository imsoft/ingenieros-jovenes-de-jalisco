"use client"

import { useTransition } from "react"
import Link from "next/link"
import { ChevronDownIcon, GlobeIcon, LogOutIcon, ShieldCheckIcon, UserRoundPenIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { signOutMember } from "@/actions/account"
import { MemberAvatar } from "@/components/members/member-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { HeaderSession } from "@/lib/account/types"

export type AccountSummary = NonNullable<HeaderSession> & { roleLabel?: string }

// The personal menu behind the avatar, shared by the public header and the app areas.
// `showName` shows the first name next to the avatar (app areas, from sm up).
export function AccountDropdown({ account, showName = false, className }: { account: AccountSummary; showName?: boolean; className?: string }) {
  const [isSigningOut, startSignOut] = useTransition()
  const firstName = account.name.trim().split(/\s+/)[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full py-1 pr-2 pl-1 text-brand-blue transition-colors outline-none hover:bg-brand-blue/5 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-brand-blue/5",
          className
        )}
        aria-label="Menú de tu cuenta"
      >
        <MemberAvatar name={account.name} photoUrl={account.photoUrl} size={32} />
        {showName ? <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{firstName}</span> : null}
        <ChevronDownIcon className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">{account.name}</span>
            {account.email && account.email !== account.name ? (
              <span className="truncate text-xs font-normal text-muted-foreground">{account.email}</span>
            ) : null}
            {account.roleLabel ? (
              <span className="mt-1 w-fit rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs font-medium text-foreground">{account.roleLabel}</span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {account.isMember ? (
            <>
              <DropdownMenuItem render={<Link href="/mi-perfil" />}>
                <UserRoundPenIcon aria-hidden />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/miembros" />}>
                <UsersRoundIcon aria-hidden />
                Red de miembros
              </DropdownMenuItem>
            </>
          ) : null}
          {account.isBoardMember ? (
            <DropdownMenuItem render={<Link href="/panel" prefetch={false} />}>
              <ShieldCheckIcon aria-hidden />
              Panel del Consejo
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem render={<Link href="/" />}>
            <GlobeIcon aria-hidden />
            Sitio público
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSigningOut} onClick={() => startSignOut(() => signOutMember())}>
          <LogOutIcon aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
