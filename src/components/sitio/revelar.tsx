"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"

// Muestra su contenido con una entrada suave cuando entra en pantalla.
// La animación vive en globals.css (.revelar) y se omite con movimiento reducido o sin JavaScript.
export function Revelar({
  children,
  className,
  retraso = 0,
  como: Elemento = "div",
}: {
  children: React.ReactNode
  className?: string
  retraso?: number
  como?: "div" | "li"
}) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        setVisible(true)
        observador.disconnect()
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    )
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return (
    <Elemento
      ref={ref}
      data-visible={visible}
      style={retraso ? { transitionDelay: `${retraso}ms` } : undefined}
      className={cn("revelar", className)}
    >
      {children}
    </Elemento>
  )
}
