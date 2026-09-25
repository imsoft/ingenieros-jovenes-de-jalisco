import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { NewPasswordForm } from "@/components/account/account-forms"
import { createSessionSupabaseClient } from "@/lib/supabase/session"

export const metadata: Metadata = { title: "Nueva contraseña" }

export default async function NewPasswordPage() {
  // You arrive here from the recovery link, which already started a temporary session.
  const supabase = await createSessionSupabaseClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect("/ingresar?error=invalid-link")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-brand-blue uppercase">Nueva contraseña</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Elige una contraseña para tu cuenta.</p>
      </div>
      <NewPasswordForm />
    </div>
  )
}
