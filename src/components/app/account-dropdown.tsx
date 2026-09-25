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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { HeaderSession } from "@/lib/account/types"

// Google-style account panel: a tinted sheet holding white cards (identity, destinations, sign out).
const card = "rounded-3xl bg-popover p-1"
const item = "gap-3.5 rounded-[1.25rem] px-4 py-3 text-[0.9375rem] font-medium focus:bg-brand-blue/[0.07] [&_svg:not([class*='size-'])]:size-5 [&_svg]:text-brand-blue"

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
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-1.5 rounded-[1.75rem] border-0 bg-[color-mix(in_oklab,var(--brand-blue)_7%,white)] p-2 shadow-xl ring-1 ring-brand-blue/10"
      >
        <DropdownMenuGroup className={card}>
          <DropdownMenuLabel className="flex items-center gap-3.5 p-3">
            <MemberAvatar name={account.name} photoUrl={account.photoUrl} size={56} className="shrink-0" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-lg leading-tight font-medium text-foreground">{account.name}</span>
              {account.email && account.email !== account.name ? (
                <span className="truncate text-sm font-normal text-muted-foreground">{account.email}</span>
              ) : null}
              {account.roleLabel ? (
                <span className="mt-1.5 w-fit rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-xs font-medium text-foreground">{account.roleLabel}</span>
              ) : null}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuGroup className={card}>
          {account.isMember ? (
            <>
              <DropdownMenuItem className={item} render={<Link href="/mi-perfil" />}>
                <UserRoundPenIcon aria-hidden />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem className={item} render={<Link href="/miembros" />}>
                <UsersRoundIcon aria-hidden />
                Red de miembros
              </DropdownMenuItem>
            </>
          ) : null}
          {account.isBoardMember ? (
            <DropdownMenuItem className={item} render={<Link href="/panel" prefetch={false} />}>
              <ShieldCheckIcon aria-hidden />
              Panel del Consejo
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem className={item} render={<Link href="/" />}>
            <GlobeIcon aria-hidden />
            Sitio público
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuGroup className={card}>
          <DropdownMenuItem className={item} disabled={isSigningOut} onClick={() => startSignOut(() => signOutMember())}>
            <LogOutIcon aria-hidden />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuItem
          className="mx-auto rounded-full px-3 py-1.5 text-xs text-muted-foreground focus:bg-transparent focus:underline"
          render={<Link href="/aviso-de-privacidad" />}
        >
          Aviso de privacidad
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
