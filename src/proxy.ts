import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

// Only the areas with a session (panel and member network) pay the cost of the proxy.
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
