import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { GoogleButton } from "@/components/account/google-button"
import { OptionsSeparator } from "@/components/account/options-separator"
import { LinkError } from "@/components/account/link-error"
import { MemberSignInForm } from "@/components/account/account-forms"
import { Notice } from "@/components/site/notice"
import { safeRedirectPath, signInErrorMessages } from "@/lib/account/routes"
import { getMemberAccess } from "@/lib/members/session"

export const metadata: Metadata = { title: "Ingresar" }

export default async function SignInPage({ searchParams }: PageProps<"/ingresar">) {
  const { next: nextParam, error, notice } = await searchParams
  const next = safeRedirectPath(nextParam)

  const access = await getMemberAccess()
  if (access.kind === "member") redirect(next)
  if (access.kind === "no-access") redirect("/acceso-restringido")

  const errorMessage = typeof error === "string" ? (signInErrorMessages[error] ?? null) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-brand-blue uppercase">Ingresa a la red</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Conecta con otros miembros del Colectivo: quiénes son, a qué se dedican y en qué empresas trabajan.
        </p>
      </div>

      {notice === "account-deleted" ? (
        <Notice variant="success">Tu cuenta y tu perfil se eliminaron. Si algún día quieres volver, puedes crear una cuenta nueva.</Notice>
      ) : null}

      <LinkError serverMessage={errorMessage} />

      <GoogleButton next={next} />

      <OptionsSeparator />

      <MemberSignInForm next={next} />

      <div className="flex flex-col gap-2 border-t border-brand-blue/10 pt-5 text-sm text-foreground/75">
        <p>
          ¿Primera vez?{" "}
          <Link href="/registro" className="font-medium text-brand-blue underline-offset-4 hover:underline">
            Crea tu cuenta
          </Link>
        </p>
        <p>
          ¿Aún no eres miembro?{" "}
          <Link href="/#unete" className="font-medium text-brand-blue underline-offset-4 hover:underline">
            Solicita tu afiliación
          </Link>
        </p>
      </div>
    </div>
  )
}
