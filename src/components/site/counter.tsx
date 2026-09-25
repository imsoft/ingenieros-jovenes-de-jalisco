"use client"

import { useEffect, useRef, useState } from "react"

// Counts from 0 to the value when the figure scrolls into view. Screen readers read the final value.
export function Counter({
  value,
  suffix = "",
  duration = 1400,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(value)

  useEffect(() => {
    const element = ref.current
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let fallback: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          setCurrent(Math.round(value * (1 - (1 - progress) ** 3)))
          if (progress < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        // If the browser pauses frames (background tab), guarantee the final value.
        fallback = setTimeout(() => {
          cancelAnimationFrame(frame)
          setCurrent(value)
        }, duration + 150)
      },
      { threshold: 0.6 }
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(fallback)
    }
  }, [value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden>
        {current}
        {suffix}
      </span>
    </span>
  )
}
