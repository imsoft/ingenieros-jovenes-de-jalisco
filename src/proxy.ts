import type { NextRequest } from "next/server"

import { actualizarSesion } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return actualizarSesion(request)
}

// Solo las zonas con sesión (panel y red de miembros) pagan el costo del proxy.
export const config = {
  matcher: [
    "/panel",
    "/panel/:path*",
    "/miembros",
    "/miembros/:path*",
    "/mi-perfil",
    "/mi-perfil/:path*",
    "/ingresar",
    "/registro",
    "/restablecer",
    "/acceso-restringido",
  ],
}
