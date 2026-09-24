// Plantillas de los correos de Supabase (autenticación y avisos de seguridad), con el mismo diseño
// que los de la app.
// Se generan a HTML en supabase/plantillas con `pnpm correos:supabase` y se pegan en
// Authentication → Emails → Templates. Los {{ .Algo }} los llena Supabase al enviar.

import { boton, envolver, escaparHtml, parrafo } from "@/lib/correo/plantillas"

type PlantillaAutenticacion = {
  archivo: string
  // "autenticacion": Authentication → Emails. "aviso": notificaciones de seguridad (solo se envían si se activan).
  categoria: "autenticacion" | "aviso"
  plantillaSupabase: string
  asunto: string
  titulo: string
  previo: string
  texto: string
  // Botón con enlace a /auth/confirm (verifyOtp con token_hash).
  enlace?: { tipo: "email" | "recovery" | "invite" | "email_change"; siguiente: string; boton: string }
  // Código de un solo uso ({{ .Token }}) para escribirlo en la app.
  codigo?: { indicacion: string }
  // Botón a una página del sitio (los avisos llevan "¿No fuiste tú?" → recuperar la cuenta).
  accion?: { ruta: string; boton: string }
  nota: string
}

export const plantillasAutenticacion: PlantillaAutenticacion[] = [
  {
    categoria: "autenticacion",
    archivo: "confirmar-registro",
    plantillaSupabase: "Confirm signup",
    asunto: "Confirma tu cuenta de la red de miembros",
    titulo: "Confirma tu correo",
    previo: "Un paso más para entrar a la red de miembros del Colectivo.",
    texto: "Gracias por crear tu cuenta en la red de miembros del Colectivo. Confirma tu correo para empezar a armar tu perfil.",
    enlace: { tipo: "email", siguiente: "/mi-perfil", boton: "Confirmar mi correo" },
    nota: "Si no creaste esta cuenta, ignora este mensaje.",
  },
  {
    categoria: "autenticacion",
    archivo: "recuperar-contrasena",
    plantillaSupabase: "Reset password",
    asunto: "Crea una nueva contraseña",
    titulo: "Recupera tu acceso",
    previo: "Usa este enlace para elegir una contraseña nueva.",
    texto: "Recibimos una solicitud para cambiar la contraseña de tu cuenta. El enlace vence en una hora.",
    enlace: { tipo: "recovery", siguiente: "/restablecer", boton: "Crear nueva contraseña" },
    nota: "Si no lo pediste, ignora este mensaje: tu contraseña no cambiará.",
  },
  {
    categoria: "autenticacion",
    archivo: "invitacion",
    plantillaSupabase: "Invite user",
    asunto: "Te invitaron a Ingenieros Jóvenes de Jalisco",
    titulo: "Te damos la bienvenida",
    previo: "Acepta la invitación a la plataforma del Colectivo.",
    texto: "Te invitaron a la plataforma del Colectivo de Ingenieros Jóvenes de Jalisco. Acepta la invitación y elige tu contraseña.",
    enlace: { tipo: "invite", siguiente: "/restablecer", boton: "Aceptar invitación" },
    nota: "Si no esperabas esta invitación, ignora este mensaje.",
  },
  {
    categoria: "autenticacion",
    archivo: "cambio-correo",
    plantillaSupabase: "Change email address",
    asunto: "Confirma tu nuevo correo",
    titulo: "Confirma tu nuevo correo",
    previo: "Confirma el cambio de correo de tu cuenta.",
    texto: "Pediste cambiar el correo de tu cuenta a {{ .NewEmail }}. Confírmalo para aplicar el cambio.",
    enlace: { tipo: "email_change", siguiente: "/mi-perfil", boton: "Confirmar cambio" },
    nota: "Si no pediste este cambio, ignora este mensaje y avísale al Consejo.",
  },
  {
    // La app no inicia sesión con enlace mágico, pero Supabase puede enviarlo si alguien lo pide
    // directo a la API para un correo registrado: que llegue en español y con la marca.
    categoria: "autenticacion",
    archivo: "enlace-magico",
    plantillaSupabase: "Magic link or OTP",
    asunto: "Tu enlace para entrar a la red de miembros",
    titulo: "Entra a la red",
    previo: "Tu enlace de acceso de un solo uso.",
    texto: "Usa este enlace para entrar a la red de miembros del Colectivo. Vence en una hora y solo funciona una vez.",
    enlace: { tipo: "email", siguiente: "/miembros", boton: "Entrar a la red" },
    codigo: { indicacion: "O escribe este código si te lo piden:" },
    nota: "Si no pediste entrar, ignora este mensaje: nadie puede acceder sin este enlace.",
  },
  {
    categoria: "autenticacion",
    archivo: "reautenticacion",
    plantillaSupabase: "Reauthentication",
    asunto: "Tu código de verificación",
    titulo: "Confirma que eres tú",
    previo: "Tu código para confirmar una operación de tu cuenta.",
    texto: "Para proteger tu cuenta, confirma esta operación con el siguiente código. Vence en unos minutos.",
    codigo: { indicacion: "Tu código es:" },
    nota: "Si no estás haciendo ningún cambio en tu cuenta, ignora este mensaje y cambia tu contraseña.",
  },
  // Avisos de seguridad. Recomendados para este sitio: contraseña, correo y método vinculado/desvinculado
  // (Google). Teléfono y verificación en dos pasos no se usan, pero quedan listos con la marca.
  {
    categoria: "aviso",
    archivo: "contrasena-cambiada",
    plantillaSupabase: "Password changed",
    asunto: "Tu contraseña cambió",
    titulo: "Tu contraseña cambió",
    previo: "Se cambió la contraseña de tu cuenta.",
    texto: "La contraseña de tu cuenta en la red de miembros del Colectivo se acaba de cambiar. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    categoria: "aviso",
    archivo: "correo-cambiado",
    plantillaSupabase: "Email address changed",
    asunto: "El correo de tu cuenta cambió",
    titulo: "Tu correo cambió",
    previo: "El correo de tu cuenta ahora es otro.",
    texto: "El correo de tu cuenta cambió de {{ .OldEmail }} a {{ .Email }}. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    categoria: "aviso",
    archivo: "telefono-cambiado",
    plantillaSupabase: "Phone number changed",
    asunto: "El teléfono de tu cuenta cambió",
    titulo: "Tu teléfono cambió",
    previo: "El teléfono de tu cuenta ahora es otro.",
    texto: "El teléfono de tu cuenta cambió de {{ .OldPhone }} a {{ .Phone }}. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    categoria: "aviso",
    archivo: "metodo-vinculado",
    plantillaSupabase: "Sign-in method linked",
    asunto: "Se agregó una forma de entrar a tu cuenta",
    titulo: "Nueva forma de entrar",
    previo: "Se vinculó un nuevo método de inicio de sesión.",
    texto: "Se agregó un método de inicio de sesión a tu cuenta: {{ .Provider }}. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    categoria: "aviso",
    archivo: "metodo-desvinculado",
    plantillaSupabase: "Sign-in method removed",
    asunto: "Se quitó una forma de entrar a tu cuenta",
    titulo: "Forma de entrar eliminada",
    previo: "Se desvinculó un método de inicio de sesión.",
    texto: "Se quitó un método de inicio de sesión de tu cuenta: {{ .Provider }}. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    categoria: "aviso",
    archivo: "verificacion-agregada",
    plantillaSupabase: "Verification method added",
    asunto: "Se agregó una verificación en dos pasos",
    titulo: "Verificación agregada",
    previo: "Tu cuenta tiene un nuevo método de verificación.",
    texto: "Se agregó un método de verificación en dos pasos ({{ .FactorType }}) a tu cuenta. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    categoria: "aviso",
    archivo: "verificacion-eliminada",
    plantillaSupabase: "Verification method removed",
    asunto: "Se quitó una verificación en dos pasos",
    titulo: "Verificación eliminada",
    previo: "Se quitó un método de verificación de tu cuenta.",
    texto: "Se quitó un método de verificación en dos pasos ({{ .FactorType }}) de tu cuenta. Si fuiste tú, no necesitas hacer nada.",
    accion: { ruta: "/recuperar", boton: "No fui yo: proteger mi cuenta" },
    nota: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
]

const SITIO = "{{ .SiteURL }}"

export const urlConfirmacion = ({ tipo, siguiente }: NonNullable<PlantillaAutenticacion["enlace"]>) =>
  `${SITIO}/auth/confirm?token_hash={{ .TokenHash }}&type=${tipo}&siguiente=${siguiente}`

const bloqueCodigo = (indicacion: string) =>
  `<p style="margin:0 0 8px;font-size:14px;color:#6b7280">${escaparHtml(indicacion)}</p>` +
  `<p style="margin:0 0 24px;display:inline-block;padding:12px 20px;border-radius:12px;background:#f3f5f8;font-family:Menlo,Consolas,monospace;font-size:26px;font-weight:700;letter-spacing:6px;color:#10436f">{{ .Token }}</p>`

export function htmlPlantillaAutenticacion(plantilla: PlantillaAutenticacion) {
  const html = envolver({
    titulo: plantilla.titulo,
    previo: plantilla.previo,
    urlSitio: SITIO,
    cuerpo:
      parrafo(escaparHtml(plantilla.texto)) +
      (plantilla.enlace ? boton(urlConfirmacion(plantilla.enlace), plantilla.enlace.boton) : "") +
      (plantilla.codigo ? bloqueCodigo(plantilla.codigo.indicacion) : "") +
      (plantilla.accion
        ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#1f2937"><strong>¿No fuiste tú?</strong> Protege tu cuenta creando una contraseña nueva.</p>` +
          boton(`${SITIO}${plantilla.accion.ruta}`, plantilla.accion.boton)
        : "") +
      `<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">${escaparHtml(plantilla.nota)}</p>`,
  })
  const seccion = plantilla.categoria === "aviso" ? "Security notifications" : "Authentication"
  return `<!-- Supabase → Authentication → Emails → ${seccion} → "${plantilla.plantillaSupabase}". Asunto: "${plantilla.asunto}". Generado con \`pnpm correos:supabase\`: no editar a mano. -->\n${html}\n`
}
