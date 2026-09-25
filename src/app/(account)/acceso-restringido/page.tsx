import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldAlertIcon } from "lucide-react"

import { signOutMember } from "@/actions/account"
import { SubmitButton } from "@/components/panel/submit-button"
import { getMemberAccess } from "@/lib/members/session"

export const metadata: Metadata = { title: "Acceso restringido" }

export default async function RestrictedAccessPage() {
  const access = await getMemberAccess()
  if (access.kind === "anonymous") redirect("/ingresar")
  if (access.kind === "member") redirect("/miembros")

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-orange/15">
        <ShieldAlertIcon className="size-7 text-brand-orange" aria-hidden />
      </span>
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-blue uppercase">La red es solo para miembros</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {access.email ? `Iniciaste sesión como ${access.email}, pero ese correo` : "Tu correo"} no tiene una solicitud de
          afiliación aprobada. Si ya la enviaste, el Consejo te contactará al revisarla.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/#unete"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-orange px-6 font-semibold text-white shadow-lg shadow-brand-orange/25 transition-colors hover:bg-brand-orange/90"
        >
          Solicitar afiliación
        </Link>
        <form action={signOutMember}>
          <SubmitButton variant="outline" size="xl" className="w-full">
            Cerrar sesión
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
