"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { UserRoundIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { AccountDropdown } from "@/components/app/account-dropdown"
import { buttonVariants } from "@/components/ui/button"
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

// Right side of the public header: sign-in link for visitors; for signed-in people, a shortcut to the
// member network (members only) plus the shared account menu. On mobile the sheet menu covers both.
export function AccountMenu({ session }: { session: HeaderSession }) {
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
    <div className="hidden items-center gap-1 sm:flex">
      {session.isMember ? (
        <Link href="/miembros" className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2 px-3 text-brand-blue")}>
          <UsersRoundIcon aria-hidden />
          Red de miembros
        </Link>
      ) : null}
      <AccountDropdown account={session} />
    </div>
  )
}
