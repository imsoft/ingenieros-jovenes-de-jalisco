"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "cn"

// Shows its content with a soft entrance when it scrolls into view.
// The animation lives in globals.css (.reveal) and is skipped with reduced motion or without JavaScript.
export function Reveal({
  children,
  className,
  delay = 0,
  as: Element = "div",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: "div" | "li"
}) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Element
      ref={ref}
      data-visible={visible}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Element>
  )
}
