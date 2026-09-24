// Rutas internas permitidas después de iniciar sesión (evita redirecciones a otros sitios).
export function rutaSegura(valor: unknown, porDefecto = "/miembros") {
  if (typeof valor !== "string") return porDefecto
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return porDefecto
  return valor
}

export const mensajesErrorIngreso: Record<string, string> = {
  "no-autorizado":
    "Ese correo no tiene una solicitud de afiliación aprobada. Si ya la enviaste, espera la respuesta del Consejo.",
  google: "No pudimos iniciar sesión con Google. Inténtalo de nuevo.",
  enlace: "El enlace ya expiró o no es válido. Solicita uno nuevo.",
  sesion: "Tu sesión expiró. Ingresa de nuevo.",
}
