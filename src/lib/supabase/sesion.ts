import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cliente con la sesión del usuario (cookies). Todas sus consultas pasan por RLS como `authenticated`.
export async function crearClienteSupabaseConSesion() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !clave) throw new Error("Supabase no está configurado (faltan variables de entorno).")

  const almacen = await cookies()

  return createServerClient(url, clave, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (porEscribir) => {
        try {
          porEscribir.forEach(({ name, value, options }) => almacen.set(name, value, options))
        } catch {
          // Los Server Components no pueden escribir cookies; el proxy de /panel refresca la sesión.
        }
      },
    },
  })
}
