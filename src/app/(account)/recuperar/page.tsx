import type { Metadata } from "next"
import Link from "next/link"

import { PasswordResetRequestForm } from "@/components/account/account-forms"

export const metadata: Metadata = { title: "Recuperar contraseña" }

export default function PasswordResetRequestPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-brand-blue uppercase">Recupera tu acceso</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Te enviaremos un enlace para crear una nueva contraseña. Si entras con Google, no necesitas contraseña.
        </p>
      </div>
      <PasswordResetRequestForm />
      <Link href="/ingresar" className="w-fit text-sm font-medium text-brand-blue underline-offset-4 hover:underline">
        ← Volver a ingresar
      </Link>
    </div>
  )
}
