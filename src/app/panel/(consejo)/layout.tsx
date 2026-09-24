import Image from "next/image"
import Link from "next/link"
import { LogOutIcon } from "lucide-react"

import { cerrarSesionPanel } from "@/acciones/panel"
import { NavegacionPanel } from "@/components/panel/navegacion-panel"
import { Button } from "@/components/ui/button"
import { exigirMiembroConsejo } from "@/lib/panel/sesion"

const etiquetasRol = { admin: "Administrador", revisor: "Revisor" } as const

export default async function LayoutConsejo({ children }: { children: React.ReactNode }) {
  const miembro = await exigirMiembroConsejo()

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-azul/10 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/panel" className="flex items-center gap-3 rounded-lg">
            <Image src="/brand/logo.svg" alt="" width={36} height={36} className="size-9" />
            <span className="font-heading text-sm leading-tight font-semibold text-azul uppercase">
              Panel del
              <br />
              Consejo
            </span>
          </Link>

          <NavegacionPanel className="hidden md:flex" esAdmin={miembro.rol === "admin"} />

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">{miembro.nombre}</p>
              <p className="text-xs text-muted-foreground">{etiquetasRol[miembro.rol]}</p>
            </div>
            <form action={cerrarSesionPanel}>
              <Button type="submit" variant="outline" size="lg" className="h-10 px-3">
                <LogOutIcon data-icon="inline-start" aria-hidden />
                Salir
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-azul/10 md:hidden">
          <NavegacionPanel className="mx-auto max-w-6xl overflow-x-auto px-3 py-2" esAdmin={miembro.rol === "admin"} />
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  )
}
