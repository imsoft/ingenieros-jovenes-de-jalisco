// Email templates. Pure functions: they take data and the site URL and return subject, HTML and text.
// Supabase auth emails (supabase/templates) are generated with this same design:
// see auth-templates.ts and `pnpm emails:supabase`.

export type Email = { subject: string; html: string; text: string }

const BRAND_BLUE = "#10436f"
const BRAND_NAVY = "#0a2c4a"
const BRAND_ORANGE = "#e27227"
const ORGANIZATION_NAME = "Ingenieros Jóvenes de Jalisco"

export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export const paragraph = (html: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1f2937">${html}</p>`

export const button = (href: string, label: string) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 24px"><tr><td style="border-radius:12px;background:${BRAND_ORANGE}"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a></td></tr></table>`

const detailRow = (label: string, value: string) =>
  `<tr><td style="padding:6px 16px 6px 0;font-size:14px;color:#6b7280;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:15px;color:#111827">${escapeHtml(value)}</td></tr>`

const detailsTable = (rows: [string, string][]) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:8px 0">${rows.map(([label, value]) => detailRow(label, value)).join("")}</table>`

// Joins the site URL with a path. Also accepts Supabase's {{ .SiteURL }} placeholder.
export const siteUrl = (baseUrl: string, path: string) => `${baseUrl.replace(/\/+$/, "")}${path}`

export function wrapEmail({ title, body, baseUrl, preheader }: { title: string; body: string; baseUrl: string; preheader: string }) {
  return `<!doctype html>
<html lang="es-MX">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f5f8;font-family:'Source Sans 3',Segoe UI,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f8;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:${BRAND_NAVY};padding:20px 32px">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="padding-right:14px;vertical-align:middle"><img src="${escapeHtml(siteUrl(baseUrl, "/brand/email-logo.png"))}" width="48" height="48" alt="" style="display:block;border:0;border-radius:4px"></td>
<td style="vertical-align:middle"><p style="margin:0;font-family:Oswald,Arial Narrow,Arial,sans-serif;font-size:17px;line-height:1.15;font-weight:600;color:#ffffff;text-transform:uppercase">${ORGANIZATION_NAME}</p>
<p style="margin:2px 0 0;font-size:11px;letter-spacing:2px;font-weight:600;color:${BRAND_ORANGE};text-transform:uppercase">Colectivo A.C.</p></td>
</tr></table>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-family:Oswald,Arial Narrow,Arial,sans-serif;font-size:26px;line-height:1.2;color:${BRAND_BLUE};text-transform:uppercase">${escapeHtml(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.6;color:#6b7280">
<strong style="color:${BRAND_BLUE}">¡Cuando la ingeniería se une, Jalisco avanza!</strong><br>
Colectivo de ${ORGANIZATION_NAME} A.C. · <a href="${escapeHtml(siteUrl(baseUrl, "/"))}" style="color:${BRAND_BLUE}">Visitar el sitio</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName

// To the Consejo: a new membership application arrived.
export function newApplicationEmail(
  data: { fullName: string; email: string; phone: string; municipality: string },
  baseUrl: string
): Email {
  const link = siteUrl(baseUrl, "/panel/solicitudes")
  const subject = `Nueva solicitud de afiliación: ${data.fullName}`
  return {
    subject,
    html: wrapEmail({
      title: "Nueva solicitud de afiliación",
      preheader: `${data.fullName} quiere unirse al Colectivo.`,
      baseUrl,
      body:
        paragraph(`<strong>${escapeHtml(data.fullName)}</strong> quiere unirse al Colectivo.`) +
        detailsTable([
          ["Correo", data.email],
          ["Teléfono", data.phone],
          ["Municipio", data.municipality],
        ]) +
        button(link, "Revisar en el panel"),
    }),
    text: `${subject}\n\nCorreo: ${data.email}\nTeléfono: ${data.phone}\nMunicipio: ${data.municipality}\n\nRevísala en el panel: ${link}`,
  }
}

// To the applicant: their membership was approved; invites them to create their account.
export function applicationApprovedEmail(data: { fullName: string }, baseUrl: string): Email {
  const name = firstName(data.fullName)
  const link = siteUrl(baseUrl, "/registro")
  const subject = "¡Bienvenido al Colectivo de Ingenieros Jóvenes de Jalisco!"
  return {
    subject,
    html: wrapEmail({
      title: `¡Bienvenido, ${name}!`,
      preheader: "Tu solicitud de afiliación fue aprobada.",
      baseUrl,
      body:
        paragraph("El Consejo Directivo aprobó tu solicitud de afiliación. Ya eres parte del Colectivo.") +
        paragraph(
          "Crea tu cuenta en la red de miembros para armar tu perfil y conocer a los demás integrantes. Usa <strong>este mismo correo</strong> o entra con Google."
        ) +
        button(link, "Crear mi cuenta") +
        paragraph("Además, como miembro tienes precio preferencial en los eventos del Colectivo."),
    }),
    text: `¡Bienvenido, ${name}!\n\nEl Consejo Directivo aprobó tu solicitud de afiliación. Ya eres parte del Colectivo.\n\nCrea tu cuenta en la red de miembros con este mismo correo (o con Google): ${link}\n\nComo miembro tienes precio preferencial en los eventos.`,
  }
}

// To someone an admin invited to the Consejo who has no account yet.
export function boardInvitationEmail(
  data: { fullName: string; role: "admin" | "reviewer"; invitedBy: string },
  baseUrl: string
): Email {
  const name = firstName(data.fullName)
  const link = siteUrl(baseUrl, "/registro")
  const roleLabel = data.role === "admin" ? "administrador" : "revisor"
  const subject = "Te invitaron al panel del Consejo Directivo"
  return {
    subject,
    html: wrapEmail({
      title: `Hola, ${name}`,
      preheader: `${data.invitedBy} te dio acceso al panel del Consejo.`,
      baseUrl,
      body:
        paragraph(`${escapeHtml(data.invitedBy)} te agregó al panel del Consejo Directivo como <strong>${roleLabel}</strong>.`) +
        paragraph("Crea tu cuenta con <strong>este mismo correo</strong> (o entra con Google) y tendrás acceso de inmediato.") +
        button(link, "Crear mi cuenta"),
    }),
    text: `Hola, ${name}.\n\n${data.invitedBy} te agregó al panel del Consejo Directivo como ${roleLabel}.\n\nCrea tu cuenta con este mismo correo (o entra con Google): ${link}`,
  }
}

// To the attendee: event registration confirmation with confirmation code and payment details.
export function eventRegistrationEmail(
  data: {
    fullName: string
    confirmationCode: string
    event: { title: string; slug: string; date: string; timeRange: string; venue: string; address: string | null }
    amount: string
    isFree: boolean
    isMember: boolean
    paymentInstructions: string | null
  },
  baseUrl: string
): Email {
  const { event } = data
  const link = siteUrl(baseUrl, `/eventos/${event.slug}`)
  const location = event.address ? `${event.venue}, ${event.address}` : event.venue
  const payment = data.isFree
    ? "Este evento es gratuito: no necesitas pagar nada."
    : `Monto a pagar: ${data.amount}${data.isMember ? " (precio de miembro)" : ""}.`
  const showInstructions = Boolean(data.paymentInstructions) && !data.isFree
  const subject = `Registro confirmado: ${event.title} (folio ${data.confirmationCode})`

  return {
    subject,
    html: wrapEmail({
      title: "¡Tu lugar está apartado!",
      preheader: `Folio ${data.confirmationCode} para ${event.title}.`,
      baseUrl,
      body:
        paragraph(`Hola, ${escapeHtml(data.fullName)}. Te registraste a <strong>${escapeHtml(event.title)}</strong>.`) +
        detailsTable([
          ["Folio", data.confirmationCode],
          ["Fecha", event.date],
          ["Horario", event.timeRange],
          ["Lugar", location],
        ]) +
        paragraph(`<strong>${escapeHtml(payment)}</strong>`) +
        (showInstructions
          ? `<div style="margin:0 0 20px;padding:16px;border-radius:12px;background:#fdf1e8;font-size:15px;line-height:1.6;color:#1f2937;white-space:pre-line">${escapeHtml(data.paymentInstructions ?? "")}</div>`
          : "") +
        paragraph("Guarda este correo: tu folio te identifica en el registro del evento.") +
        button(link, "Ver detalles del evento"),
    }),
    text: [
      `Hola, ${data.fullName}. Te registraste a ${event.title}.`,
      "",
      `Folio: ${data.confirmationCode}`,
      `Fecha: ${event.date}`,
      `Horario: ${event.timeRange}`,
      `Lugar: ${location}`,
      "",
      payment,
      ...(showInstructions ? ["", data.paymentInstructions ?? ""] : []),
      "",
      `Detalles: ${link}`,
    ].join("\n"),
  }
}
