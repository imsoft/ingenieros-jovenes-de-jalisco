"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDownIcon, LogOutIcon, ShieldCheckIcon, UserRoundIcon, UserRoundPenIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { signOutMember } from "@/actions/account"
import { MemberAvatar } from "@/components/members/member-avatar"
import { buttonVariants } from "@/components/ui/button"
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

// Only fetches the session if the Supabase cookie exists: anonymous visitors pay nothing.
export function useHeaderSession() {
  const [session, setSession] = useState<HeaderSession>(null)

  useEffect(() => {
    if (!document.cookie.includes("-auth-token")) return
    const controller = new AbortController()
    fetch("/auth/session", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then(setSession)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return session
}

export function AccountMenu({ session }: { session: HeaderSession }) {
  const [isSigningOut, startSignOut] = useTransition()

  if (!session) {
    return (
      <Link
        href="/ingresar"
        prefetch={false}
        className={cn(buttonVariants({ variant: "ghost" }), "hidden h-10 gap-2 px-3 text-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue sm:inline-flex")}
      >
        <UserRoundIcon aria-hidden />
        <span className="sr-only xl:not-sr-only">Ingresar</span>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hidden h-10 items-center gap-1.5 rounded-full py-1 pr-2 pl-1 text-brand-blue transition-colors outline-none hover:bg-brand-blue/5 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-brand-blue/5 sm:inline-flex"
        aria-label="Menú de tu cuenta"
      >
        <MemberAvatar name={session.name} photoUrl={session.photoUrl} size={32} />
        <ChevronDownIcon className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate font-medium text-foreground">{session.name}</span>
            {session.email && session.email !== session.name ? (
              <span className="truncate text-xs font-normal text-muted-foreground">{session.email}</span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {session.isMember ? (
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/miembros" />}>
              <UsersRoundIcon aria-hidden />
              Directorio
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/mi-perfil" />}>
              <UserRoundPenIcon aria-hidden />
              Mi perfil
            </DropdownMenuItem>
            {session.isBoardMember ? (
              <DropdownMenuItem render={<Link href="/panel" prefetch={false} />}>
                <ShieldCheckIcon aria-hidden />
                Panel del Consejo
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        ) : null}
        {session.isMember ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem disabled={isSigningOut} onClick={() => startSignOut(() => signOutMember())}>
          <LogOutIcon aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
