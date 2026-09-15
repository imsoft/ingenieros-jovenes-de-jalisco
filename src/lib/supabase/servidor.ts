import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Cliente anónimo para operaciones públicas del servidor (sujeto a RLS).
// Devuelve null mientras el proyecto de Supabase no esté configurado.
export function crearClienteSupabasePublico(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return null

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
