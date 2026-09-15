"use client"

import { useEffect, useRef, useState } from "react"

// Cuenta de 0 al valor cuando la cifra entra en pantalla. Los lectores de pantalla leen el valor final.
export function Contador({
  valor,
  sufijo = "",
  duracion = 1400,
}: {
  valor: number
  sufijo?: string
  duracion?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [actual, setActual] = useState(valor)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let cuadro = 0
    let respaldo: ReturnType<typeof setTimeout> | undefined
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        observador.disconnect()
        const inicio = performance.now()
        const avanzar = (ahora: number) => {
          const progreso = Math.min((ahora - inicio) / duracion, 1)
          setActual(Math.round(valor * (1 - (1 - progreso) ** 3)))
          if (progreso < 1) cuadro = requestAnimationFrame(avanzar)
        }
        cuadro = requestAnimationFrame(avanzar)
        // Si el navegador pausa los cuadros (pestaña en segundo plano), garantiza el valor final.
        respaldo = setTimeout(() => {
          cancelAnimationFrame(cuadro)
          setActual(valor)
        }, duracion + 150)
      },
      { threshold: 0.6 }
    )
    observador.observe(elemento)

    return () => {
      observador.disconnect()
      cancelAnimationFrame(cuadro)
      clearTimeout(respaldo)
    }
  }, [valor, duracion])

  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">
        {valor}
        {sufijo}
      </span>
      <span aria-hidden>
        {actual}
        {sufijo}
      </span>
    </span>
  )
}
