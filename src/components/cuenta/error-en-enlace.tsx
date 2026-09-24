"use client"

import { useSyncExternalStore } from "react"

import { Aviso } from "@/components/sitio/aviso"
import { mensajesErrorIngreso } from "@/lib/cuenta/rutas"

// Supabase a veces devuelve el error en el fragmento (#error_description=…), que el servidor no ve.
function leerErrorDelFragmento() {
  const fragmento = new URLSearchParams(window.location.hash.slice(1))
  const descripcion = fragmento.get("error_description") ?? fragmento.get("error")
  if (!descripcion) return null
  if (descripcion.includes("CORREO_NO_AUTORIZADO")) return mensajesErrorIngreso["no-autorizado"]
  return /expired|invalid/i.test(descripcion) ? mensajesErrorIngreso.enlace : mensajesErrorIngreso.google
}

const suscribir = (alCambiar: () => void) => {
  window.addEventListener("hashchange", alCambiar)
  return () => window.removeEventListener("hashchange", alCambiar)
}

export function ErrorEnEnlace({ mensajeServidor }: { mensajeServidor: string | null }) {
  const mensajeFragmento = useSyncExternalStore(suscribir, leerErrorDelFragmento, () => null)
  const mensaje = mensajeServidor ?? mensajeFragmento
  if (!mensaje) return null

  return <Aviso tipo="error">{mensaje}</Aviso>
}
