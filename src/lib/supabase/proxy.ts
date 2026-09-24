import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Rutas que requieren sesión y a qué pantalla de ingreso mandan si no la hay.
const RUTAS_PROTEGIDAS: { prefijo: string; ingreso: string; publicas?: string[] }[] = [
  { prefijo: "/panel", ingreso: "/panel/ingresar", publicas: ["/panel/ingresar"] },
  { prefijo: "/miembros", ingreso: "/ingresar" },
  { prefijo: "/mi-perfil", ingreso: "/ingresar" },
]

function reglaPara(ruta: string) {
  return RUTAS_PROTEGIDAS.find(({ prefijo }) => ruta === prefijo || ruta.startsWith(`${prefijo}/`))
}

// Refresca la sesión de Supabase y hace la verificación optimista de acceso.
// La autorización real (miembro, Consejo) se valida en el servidor y en RLS.
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
  const regla = reglaPara(ruta)

  if (!conSesion && regla && !regla.publicas?.includes(ruta)) {
    const destino = request.nextUrl.clone()
    destino.pathname = regla.ingreso
    destino.search = ""
    if (ruta !== regla.prefijo || regla.prefijo !== "/panel") destino.searchParams.set("siguiente", ruta)

    const redireccion = NextResponse.redirect(destino)
    respuesta.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie))
    return redireccion
  }

  return respuesta
}
