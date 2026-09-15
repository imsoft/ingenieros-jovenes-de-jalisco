import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const RUTAS_PUBLICAS_DEL_PANEL = ["/panel/ingresar"]

// Refresca la sesión de Supabase y hace la verificación optimista de acceso al panel.
// La autorización real (miembro activo del Consejo) se valida en el servidor y en RLS.
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !clave) return respuesta

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (porEscribir, encabezados) => {
        porEscribir.forEach(({ name, value }) => request.cookies.set(name, value))
        respuesta = NextResponse.next({ request })
        porEscribir.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options))
        // Evita que una CDN guarde en caché respuestas con cookies de sesión.
        Object.entries(encabezados).forEach(([nombre, valor]) => respuesta.headers.set(nombre, valor))
      },
    },
  })

  // Importante: no agregar lógica entre la creación del cliente y getClaims().
  const { data } = await supabase.auth.getClaims()
  const conSesion = Boolean(data?.claims?.sub)

  const ruta = request.nextUrl.pathname
  if (!conSesion && !RUTAS_PUBLICAS_DEL_PANEL.includes(ruta)) {
    const destino = request.nextUrl.clone()
    destino.pathname = "/panel/ingresar"
    destino.search = ""
    if (ruta !== "/panel") destino.searchParams.set("siguiente", ruta)

    const redireccion = NextResponse.redirect(destino)
    respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie))
    return redireccion
  }

  return respuesta
}
