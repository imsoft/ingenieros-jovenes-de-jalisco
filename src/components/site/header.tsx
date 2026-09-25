"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRightIcon, MenuIcon, UserRoundIcon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AccountMenu, useHeaderSession } from "@/components/site/account-menu"
import { navigation, site } from "@/content/site"

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const session = useHeaderSession()

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // On the home page, highlight the section that occupies the center of the screen.
  useEffect(() => {
    if (!isHome) return

    const ids = ["inicio", ...navigation.map((link) => link.href.split("#")[1]).filter(Boolean)]
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isHome])

  const isActive = (href: string) => {
    const [path, anchor] = href.split("#")
    if (anchor) return isHome && activeSection === anchor
    return pathname.startsWith(path)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        isScrolled
          ? "border-brand-blue/10 bg-white/85 shadow-lg shadow-brand-blue/5 backdrop-blur-md"
          : "border-transparent bg-white"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg">
          <Image src="/brand/logo.svg" alt="" width={40} height={40} className="size-10 shrink-0" />
          <span className="font-heading text-sm leading-tight font-semibold text-brand-blue uppercase" translate="no">
            Ingenieros Jóvenes
            <br />
            de Jalisco
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex gap-7">
            {navigation.map((link) => {
              const active = isActive(link.href)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? (link.href.includes("#") ? "location" : "page") : undefined}
                    className={cn(
                      "relative py-2 text-sm font-medium transition-colors hover:text-brand-blue",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-orange after:transition-transform after:duration-300",
                      active ? "text-brand-blue after:scale-x-100" : "text-foreground/65 after:scale-x-0"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <AccountMenu session={session} />
          {session?.isMember ? null : (
            <Link href="/#unete" className={cn(buttonVariants({ variant: "accent" }), "hidden h-10 px-4 sm:inline-flex")}>
              Únete
            </Link>
          )}

          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon-lg" className="text-brand-blue lg:hidden" />}>
              <MenuIcon />
              <span className="sr-only">Abrir menú</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 bg-white sm:max-w-sm">
              <SheetHeader className="border-b border-brand-blue/10 px-5 py-4">
                <SheetTitle className="font-heading text-lg text-brand-blue uppercase">Menú</SheetTitle>
                <SheetDescription className="sr-only">Navegación principal del sitio</SheetDescription>
              </SheetHeader>

              <nav aria-label="Menú móvil" className="flex flex-col gap-1 p-3">
                {navigation.map((link, index) => (
                  <SheetClose
                    key={link.href}
                    render={<Link href={link.href} />}
                    nativeButton={false}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-3.5 font-heading text-xl text-brand-blue uppercase transition-colors hover:bg-secondary",
                      isActive(link.href) && "bg-secondary"
                    )}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-sans text-xs text-brand-orange tabular-nums">0{index + 1}</span>
                      {link.label}
                    </span>
                    <ArrowRightIcon className="size-4 text-brand-blue/40 transition-transform group-hover:translate-x-1" aria-hidden />
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4 border-t border-brand-blue/10 p-5">
                {session?.isMember ? (
                  <SheetClose
                    render={<Link href="/miembros" />}
                    nativeButton={false}
                    className={cn(buttonVariants({ variant: "accent", size: "xl" }), "w-full")}
                  >
                    <UsersRoundIcon data-icon="inline-start" aria-hidden />
                    Ir a la red de miembros
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose
                      render={<Link href="/#unete" />}
                      nativeButton={false}
                      className={cn(buttonVariants({ variant: "accent", size: "xl" }), "w-full")}
                    >
                      Quiero ser miembro
                      <ArrowRightIcon data-icon="inline-end" aria-hidden />
                    </SheetClose>
                    <SheetClose
                      render={<Link href={session ? "/acceso-restringido" : "/ingresar"} prefetch={false} />}
                      nativeButton={false}
                      className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full text-brand-blue")}
                    >
                      <UserRoundIcon data-icon="inline-start" aria-hidden />
                      {session ? "Mi cuenta" : "Ingresar a la red"}
                    </SheetClose>
                  </>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  Síguenos en{" "}
                  <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-blue underline">
                    Instagram
                  </a>{" "}
                  y{" "}
                  <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-blue underline">
                    Facebook
                  </a>
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
