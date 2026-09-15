import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cliente: SupabaseClient | null = null

// Cliente del navegador solo para subir archivos con URLs firmadas (no maneja sesión).
export function crearClienteSupabaseNavegador() {
  if (cliente) return cliente

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !clave) throw new Error("Supabase no está configurado.")

  cliente = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })
  return cliente
}
