// Supabase email templates (auth and security notifications), with the same design as the app emails.
// Rendered to HTML in supabase/templates with `pnpm emails:supabase` and pasted into
// Authentication → Emails. Supabase fills the {{ .Placeholders }} when sending.

import { button, escapeHtml, paragraph, wrapEmail } from "@/lib/email/templates"

type AuthEmailTemplate = {
  file: string
  // "auth": Authentication → Emails. "notification": security notifications (only sent when enabled).
  category: "auth" | "notification"
  supabaseTemplate: string
  subject: string
  title: string
  preheader: string
  text: string
  // Button linking to /auth/confirm (verifyOtp with token_hash).
  link?: { type: "email" | "recovery" | "invite" | "email_change"; next: string; label: string }
  // One-time code ({{ .Token }}) to type into the app.
  code?: { prompt: string }
  // Button to a site page (notifications carry "Not you?" → recover the account).
  action?: { path: string; label: string }
  note: string
}

export const authEmailTemplates: AuthEmailTemplate[] = [
  {
    category: "auth",
    file: "confirm-signup",
    supabaseTemplate: "Confirm signup",
    subject: "Confirma tu cuenta de la red de miembros",
    title: "Confirma tu correo",
    preheader: "Un paso más para entrar a la red de miembros del Colectivo.",
    text: "Gracias por crear tu cuenta en la red de miembros del Colectivo. Confirma tu correo para empezar a armar tu perfil.",
    link: { type: "email", next: "/mi-perfil", label: "Confirmar mi correo" },
    note: "Si no creaste esta cuenta, ignora este mensaje.",
  },
  {
    category: "auth",
    file: "reset-password",
    supabaseTemplate: "Reset password",
    subject: "Crea una nueva contraseña",
    title: "Recupera tu acceso",
    preheader: "Usa este enlace para elegir una contraseña nueva.",
    text: "Recibimos una solicitud para cambiar la contraseña de tu cuenta. El enlace vence en una hora.",
    link: { type: "recovery", next: "/restablecer", label: "Crear nueva contraseña" },
    note: "Si no lo pediste, ignora este mensaje: tu contraseña no cambiará.",
  },
  {
    category: "auth",
    file: "invite-user",
    supabaseTemplate: "Invite user",
    subject: "Te invitaron a Ingenieros Jóvenes de Jalisco",
    title: "Te damos la bienvenida",
    preheader: "Acepta la invitación a la plataforma del Colectivo.",
    text: "Te invitaron a la plataforma del Colectivo de Ingenieros Jóvenes de Jalisco. Acepta la invitación y elige tu contraseña.",
    link: { type: "invite", next: "/restablecer", label: "Aceptar invitación" },
    note: "Si no esperabas esta invitación, ignora este mensaje.",
  },
  {
    category: "auth",
    file: "change-email",
    supabaseTemplate: "Change email address",
    subject: "Confirma tu nuevo correo",
    title: "Confirma tu nuevo correo",
    preheader: "Confirma el cambio de correo de tu cuenta.",
    text: "Pediste cambiar el correo de tu cuenta a {{ .NewEmail }}. Confírmalo para aplicar el cambio.",
    link: { type: "email_change", next: "/mi-perfil", label: "Confirmar cambio" },
    note: "Si no pediste este cambio, ignora este mensaje y avísale al Consejo.",
  },
  {
    // The app never signs in with a magic link, but Supabase can send one if someone calls the API
    // directly for a registered email: make sure it arrives in Spanish and on brand.
    category: "auth",
    file: "magic-link",
    supabaseTemplate: "Magic link or OTP",
    subject: "Tu enlace para entrar a la red de miembros",
    title: "Entra a la red",
    preheader: "Tu enlace de acceso de un solo uso.",
    text: "Usa este enlace para entrar a la red de miembros del Colectivo. Vence en una hora y solo funciona una vez.",
    link: { type: "email", next: "/miembros", label: "Entrar a la red" },
    code: { prompt: "O escribe este código si te lo piden:" },
    note: "Si no pediste entrar, ignora este mensaje: nadie puede acceder sin este enlace.",
  },
  {
    category: "auth",
    file: "reauthentication",
    supabaseTemplate: "Reauthentication",
    subject: "Tu código de verificación",
    title: "Confirma que eres tú",
    preheader: "Tu código para confirmar una operación de tu cuenta.",
    text: "Para proteger tu cuenta, confirma esta operación con el siguiente código. Vence en unos minutos.",
    code: { prompt: "Tu código es:" },
    note: "Si no estás haciendo ningún cambio en tu cuenta, ignora este mensaje y cambia tu contraseña.",
  },
  // Security notifications. Recommended for this site: password, email and sign-in method linked/removed
  // (Google). Phone and two-step verification are not used, but are branded and ready.
  {
    category: "notification",
    file: "password-changed",
    supabaseTemplate: "Password changed",
    subject: "Tu contraseña cambió",
    title: "Tu contraseña cambió",
    preheader: "Se cambió la contraseña de tu cuenta.",
    text: "La contraseña de tu cuenta en la red de miembros del Colectivo se acaba de cambiar. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    category: "notification",
    file: "email-changed",
    supabaseTemplate: "Email address changed",
    subject: "El correo de tu cuenta cambió",
    title: "Tu correo cambió",
    preheader: "El correo de tu cuenta ahora es otro.",
    text: "El correo de tu cuenta cambió de {{ .OldEmail }} a {{ .Email }}. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    category: "notification",
    file: "phone-changed",
    supabaseTemplate: "Phone number changed",
    subject: "El teléfono de tu cuenta cambió",
    title: "Tu teléfono cambió",
    preheader: "El teléfono de tu cuenta ahora es otro.",
    text: "El teléfono de tu cuenta cambió de {{ .OldPhone }} a {{ .Phone }}. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    category: "notification",
    file: "sign-in-method-linked",
    supabaseTemplate: "Sign-in method linked",
    subject: "Se agregó una forma de entrar a tu cuenta",
    title: "Nueva forma de entrar",
    preheader: "Se vinculó un nuevo método de inicio de sesión.",
    text: "Se agregó un método de inicio de sesión a tu cuenta: {{ .Provider }}. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    category: "notification",
    file: "sign-in-method-removed",
    supabaseTemplate: "Sign-in method removed",
    subject: "Se quitó una forma de entrar a tu cuenta",
    title: "Forma de entrar eliminada",
    preheader: "Se desvinculó un método de inicio de sesión.",
    text: "Se quitó un método de inicio de sesión de tu cuenta: {{ .Provider }}. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    category: "notification",
    file: "mfa-method-added",
    supabaseTemplate: "Verification method added",
    subject: "Se agregó una verificación en dos pasos",
    title: "Verificación agregada",
    preheader: "Tu cuenta tiene un nuevo método de verificación.",
    text: "Se agregó un método de verificación en dos pasos ({{ .FactorType }}) a tu cuenta. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
  {
    category: "notification",
    file: "mfa-method-removed",
    supabaseTemplate: "Verification method removed",
    subject: "Se quitó una verificación en dos pasos",
    title: "Verificación eliminada",
    preheader: "Se quitó un método de verificación de tu cuenta.",
    text: "Se quitó un método de verificación en dos pasos ({{ .FactorType }}) de tu cuenta. Si fuiste tú, no necesitas hacer nada.",
    action: { path: "/recuperar", label: "No fui yo: proteger mi cuenta" },
    note: "Este es un aviso automático de seguridad; no necesitas responderlo.",
  },
]

const SITE = "{{ .SiteURL }}"

export const confirmationUrl = ({ type, next }: NonNullable<AuthEmailTemplate["link"]>) =>
  `${SITE}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${next}`

const codeBlock = (prompt: string) =>
  `<p style="margin:0 0 8px;font-size:14px;color:#6b7280">${escapeHtml(prompt)}</p>` +
  `<p style="margin:0 0 24px;display:inline-block;padding:12px 20px;border-radius:12px;background:#f3f5f8;font-family:Menlo,Consolas,monospace;font-size:26px;font-weight:700;letter-spacing:6px;color:#10436f">{{ .Token }}</p>`

export function renderAuthEmailTemplate(template: AuthEmailTemplate) {
  const html = wrapEmail({
    title: template.title,
    preheader: template.preheader,
    baseUrl: SITE,
    body:
      paragraph(escapeHtml(template.text)) +
      (template.link ? button(confirmationUrl(template.link), template.link.label) : "") +
      (template.code ? codeBlock(template.code.prompt) : "") +
      (template.action
        ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#1f2937"><strong>¿No fuiste tú?</strong> Protege tu cuenta creando una contraseña nueva.</p>` +
          button(`${SITE}${template.action.path}`, template.action.label)
        : "") +
      `<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">${escapeHtml(template.note)}</p>`,
  })
  const section = template.category === "notification" ? "Security notifications" : "Authentication"
  return `<!-- Supabase → Authentication → Emails → ${section} → "${template.supabaseTemplate}". Subject: "${template.subject}". Generated with \`pnpm emails:supabase\`: do not edit by hand. -->\n${html}\n`
}
