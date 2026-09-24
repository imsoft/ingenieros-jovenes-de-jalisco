// Lo que el encabezado necesita saber de la sesión (lo sirve /auth/sesion).
export type SesionEncabezado = {
  nombre: string
  correo: string | null
  fotoUrl: string | null
  esMiembro: boolean
  esConsejo: boolean
} | null
