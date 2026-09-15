import type { NextRequest } from "next/server"

import { actualizarSesion } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return actualizarSesion(request)
}

// Solo el panel usa sesión; el sitio público no paga el costo del proxy.
export const config = {
  matcher: ["/panel", "/panel/:path*"],
}
