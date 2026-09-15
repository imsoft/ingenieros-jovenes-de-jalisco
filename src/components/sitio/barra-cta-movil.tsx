"use client"

import { useEffect, useState } from "react"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

// Botón fijo en móvil: aparece después de la portada y se oculta mientras el formulario está en pantalla.
export function BarraCtaMovil() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const portada = document.getElementById("inicio")
    const formulario = document.getElementById("unete")
    if (!portada || !formulario) return

    let pasoLaPortada = false
    let formularioEnPantalla = false

    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.target === portada) pasoLaPortada = !entrada.isIntersecting
        if (entrada.target === formulario) formularioEnPantalla = entrada.isIntersecting
      }
      setVisible(pasoLaPortada && !formularioEnPantalla)
    })
    observador.observe(portada)
    observador.observe(formulario)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-azul/10 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden",
        "transition-[translate,opacity] duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <a href="#unete" className={cn(buttonVariants({ variant: "acento", size: "xl" }), "w-full")}>
        Quiero ser miembro
        <ArrowRightIcon data-icon="inline-end" aria-hidden />
      </a>
    </div>
  )
}
