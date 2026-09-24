import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { FormularioRestablecer } from "@/components/cuenta/formularios-cuenta"
import { crearClienteSupabaseConSesion } from "@/lib/supabase/sesion"

export const metadata: Metadata = { title: "Nueva contraseña" }

export default async function PaginaRestablecer() {
  // Se llega aquí desde el enlace de recuperación, que ya inició una sesión temporal.
  const supabase = await crearClienteSupabaseConSesion()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) redirect("/ingresar?error=enlace")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl leading-tight font-bold text-azul uppercase">Nueva contraseña</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Elige una contraseña para tu cuenta.</p>
      </div>
      <FormularioRestablecer />
    </div>
  )
}
