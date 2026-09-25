import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"

import { signOutFromPanel } from "@/actions/panel"
import { Button } from "@/components/ui/button"
import { getPanelAccess } from "@/lib/panel/session"

export const metadata: Metadata = { title: "Sin acceso" }

export default async function PanelNoAccessPage() {
  const access = await getPanelAccess()
  if (access.kind === "anonymous") redirect("/panel/ingresar")
  if (access.kind === "member") redirect("/panel")

  return (
    <main id="contenido" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 shadow-brand-blue/5 ring-brand-blue/10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-orange/15">
          <ShieldAlertIcon className="size-7 text-brand-orange" aria-hidden />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-brand-blue uppercase">Tu cuenta no tiene acceso</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Iniciaste sesión{access.email ? ` como ${access.email}` : ""}, pero tu cuenta no está
          registrada como integrante activo del Consejo. Pide a un administrador que te dé acceso.
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <form action={signOutFromPanel}>
            <Button type="submit" variant="outline" size="xl" className="w-full">
              Cerrar sesión
            </Button>
          </form>
          <Link href="/" className="rounded-md py-2 text-sm font-medium text-brand-blue hover:underline">
            Volver al sitio
          </Link>
        </div>
      </div>
    </main>
  )
}
