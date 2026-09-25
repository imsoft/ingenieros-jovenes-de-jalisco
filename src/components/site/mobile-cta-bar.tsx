"use client"

import { useEffect, useState } from "react"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"

// Fixed button on mobile: appears after the hero and hides while the form is on screen.
export function MobileCtaBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById("inicio")
    const form = document.getElementById("unete")
    if (!hero || !form) return

    let isPastHero = false
    let isFormOnScreen = false

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) isPastHero = !entry.isIntersecting
        if (entry.target === form) isFormOnScreen = entry.isIntersecting
      }
      setVisible(isPastHero && !isFormOnScreen)
    })
    observer.observe(hero)
    observer.observe(form)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-brand-blue/10 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden",
        "transition-[translate,opacity] duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <a href="#unete" className={cn(buttonVariants({ variant: "accent", size: "xl" }), "w-full")}>
        Quiero ser miembro
        <ArrowRightIcon data-icon="inline-end" aria-hidden />
      </a>
    </div>
  )
}
