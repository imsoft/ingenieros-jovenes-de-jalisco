// Internal paths allowed after signing in (prevents redirects to other sites).
export function safeRedirectPath(value: unknown, fallback = "/miembros") {
  if (typeof value !== "string") return fallback
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback
  return value
}

export const signInErrorMessages: Record<string, string> = {
  "not-authorized":
    "Ese correo no tiene una solicitud de afiliación aprobada. Si ya la enviaste, espera la respuesta del Consejo.",
  google: "No pudimos iniciar sesión con Google. Inténtalo de nuevo.",
  "invalid-link": "El enlace ya expiró o no es válido. Solicita uno nuevo.",
  "session-expired": "Tu sesión expiró. Ingresa de nuevo.",
}
