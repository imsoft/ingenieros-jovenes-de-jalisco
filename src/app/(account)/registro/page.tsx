import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { GoogleButton } from "@/components/account/google-button"
import { OptionsSeparator } from "@/components/account/options-separator"
import { MemberSignUpForm } from "@/components/account/account-forms"
import { getMemberAccess } from "@/lib/members/session"

export const metadata: Metadata = { title: "Crear cuenta" }

export default async function SignUpPage() {
  const access = await getMemberAccess()
  if (access.kind === "member") redirect("/mi-perfil")
  if (access.kind === "no-access") redirect("/acceso-restringido")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-brand-blue uppercase">Crea tu cuenta</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Exclusivo para miembros: usa el correo con el que te aprobaron la solicitud de afiliación.
        </p>
      </div>

      <GoogleButton next="/mi-perfil" label="Registrarme con Google" />

      <OptionsSeparator />

      <MemberSignUpForm />

      <p className="border-t border-brand-blue/10 pt-5 text-sm text-foreground/75">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-brand-blue underline-offset-4 hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  )
}
