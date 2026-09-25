import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import { PanelSignInForm } from "@/components/panel/sign-in-form"
import { BridgeDecoration } from "@/components/site/bridge-decoration"
import { getPanelAccess } from "@/lib/panel/session"

export const metadata: Metadata = { title: "Ingresar" }

export default async function PanelSignInPage({ searchParams }: PageProps<"/panel/ingresar">) {
  const access = await getPanelAccess()
  if (access.kind === "member") redirect("/panel")

  const { next } = await searchParams
  const destination =
    typeof next === "string" && next.startsWith("/panel") && !next.startsWith("//")
      ? next
      : "/panel"

  return (
    <main
      id="contenido"
      className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-brand-navy px-4 py-12"
    >
      <BridgeDecoration className="absolute -bottom-10 -left-24 -z-10 w-4xl max-w-none text-white opacity-[0.06]" />

      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo.svg" alt="" width={48} height={48} className="size-12" />
          <div>
            <p className="text-xs font-semibold tracking-widest text-brand-orange uppercase">Ingenieros Jóvenes de Jalisco</p>
            <h1 className="font-heading text-2xl leading-tight font-semibold text-brand-blue uppercase">Panel del Consejo</h1>
          </div>
        </div>
        <p className="mt-5 mb-7 text-sm leading-relaxed text-muted-foreground">
          Acceso exclusivo para integrantes del Consejo Directivo. Si necesitas una cuenta, pídesela
          a un administrador del panel.
        </p>

        <PanelSignInForm next={destination} />

        <Link href="/" className="mt-6 inline-flex rounded-md text-sm font-medium text-brand-blue hover:underline">
          ← Volver al sitio
        </Link>
      </div>
    </main>
  )
}
