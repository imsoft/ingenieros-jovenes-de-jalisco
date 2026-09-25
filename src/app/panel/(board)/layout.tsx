import Image from "next/image"
import Link from "next/link"
import { LogOutIcon } from "lucide-react"

import { signOutFromPanel } from "@/actions/panel"
import { PanelNav } from "@/components/panel/panel-nav"
import { Button } from "@/components/ui/button"
import { roleDescriptions } from "@/lib/panel/roles"
import { requireBoardMember } from "@/lib/panel/session"

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const member = await requireBoardMember()
  const isAdmin = member.role === "admin"

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-brand-blue/10 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/panel" className="flex items-center gap-3 rounded-lg">
            <Image src="/brand/logo.svg" alt="" width={36} height={36} className="size-9" />
            <span className="font-heading text-sm leading-tight font-semibold text-brand-blue uppercase">
              Panel del
              <br />
              Consejo
            </span>
          </Link>

          <PanelNav className="hidden md:flex" isAdmin={isAdmin} />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">{member.name}</p>
              <p className="text-xs text-muted-foreground">{roleDescriptions[member.role].name}</p>
            </div>
            <form action={signOutFromPanel}>
              <Button type="submit" variant="outline" size="lg" className="h-10 px-3">
                <LogOutIcon data-icon="inline-start" aria-hidden />
                Salir
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-brand-blue/10 md:hidden">
          <PanelNav className="mx-auto max-w-6xl overflow-x-auto px-3 py-2" isAdmin={isAdmin} />
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  )
}
