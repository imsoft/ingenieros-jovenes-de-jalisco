// Plantillas de correo. Funciones puras: reciben datos y la URL del sitio, devuelven asunto, HTML y texto.
// Las de autenticación de Supabase (supabase/plantillas) se generan con este mismo diseño:
// ver plantillas-autenticacion.ts y `pnpm correos:supabase`.

export type Correo = { asunto: string; html: string; texto: string }

const AZUL = "#10436f"
const AZUL_PROFUNDO = "#0a2c4a"
const NARANJA = "#e27227"
const NOMBRE = "Ingenieros Jóvenes de Jalisco"

export function escaparHtml(texto: string) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export const parrafo = (html: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1f2937">${html}</p>`

export const boton = (href: string, texto: string) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 24px"><tr><td style="border-radius:12px;background:${NARANJA}"><a href="${escaparHtml(href)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${escaparHtml(texto)}</a></td></tr></table>`

const filaDato = (etiqueta: string, valor: string) =>
  `<tr><td style="padding:6px 16px 6px 0;font-size:14px;color:#6b7280;white-space:nowrap;vertical-align:top">${escaparHtml(etiqueta)}</td><td style="padding:6px 0;font-size:15px;color:#111827">${escaparHtml(valor)}</td></tr>`

const tablaDatos = (filas: [string, string][]) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;width:100%;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:8px 0">${filas.map(([e, v]) => filaDato(e, v)).join("")}</table>`

// Une la URL del sitio con una ruta. Acepta también el marcador {{ .SiteURL }} de Supabase.
export const enSitio = (urlSitio: string, ruta: string) => `${urlSitio.replace(/\/+$/, "")}${ruta}`

export function envolver({ titulo, cuerpo, urlSitio, previo }: { titulo: string; cuerpo: string; urlSitio: string; previo: string }) {
  return `<!doctype html>
<html lang="es-MX">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;padding:0;background:#f3f5f8;font-family:'Source Sans 3',Segoe UI,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${escaparHtml(previo)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f8;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:${AZUL_PROFUNDO};padding:20px 32px">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="padding-right:14px;vertical-align:middle"><img src="${escaparHtml(enSitio(urlSitio, "/brand/logo-correo.png"))}" width="48" height="48" alt="" style="display:block;border:0;border-radius:4px"></td>
<td style="vertical-align:middle"><p style="margin:0;font-family:Oswald,Arial Narrow,Arial,sans-serif;font-size:17px;line-height:1.15;font-weight:600;color:#ffffff;text-transform:uppercase">${NOMBRE}</p>
<p style="margin:2px 0 0;font-size:11px;letter-spacing:2px;font-weight:600;color:${NARANJA};text-transform:uppercase">Colectivo A.C.</p></td>
</tr></table>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-family:Oswald,Arial Narrow,Arial,sans-serif;font-size:26px;line-height:1.2;color:${AZUL};text-transform:uppercase">${escaparHtml(titulo)}</h1>
${cuerpo}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.6;color:#6b7280">
<strong style="color:${AZUL}">¡Cuando la ingeniería se une, Jalisco avanza!</strong><br>
Colectivo de ${NOMBRE} A.C. · <a href="${escaparHtml(enSitio(urlSitio, "/"))}" style="color:${AZUL}">Visitar el sitio</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}


// Aviso al Consejo: llegó una solicitud de afiliación.
export function correoNuevaSolicitud(
  datos: { nombre: string; correo: string; telefono: string; municipio: string },
  urlSitio: string
): Correo {
  const enlace = enSitio(urlSitio, "/panel/solicitudes")
  const asunto = `Nueva solicitud de afiliación: ${datos.nombre}`
  return {
    asunto,
    html: envolver({
      titulo: "Nueva solicitud de afiliación",
      previo: `${datos.nombre} quiere unirse al Colectivo.`,
      urlSitio,
      cuerpo:
        parrafo(`<strong>${escaparHtml(datos.nombre)}</strong> quiere unirse al Colectivo.`) +
        tablaDatos([
          ["Correo", datos.correo],
          ["Teléfono", datos.telefono],
          ["Municipio", datos.municipio],
        ]) +
        boton(enlace, "Revisar en el panel"),
    }),
    texto: `${asunto}\n\nCorreo: ${datos.correo}\nTeléfono: ${datos.telefono}\nMunicipio: ${datos.municipio}\n\nRevísala en el panel: ${enlace}`,
  }
}

// Al solicitante: su afiliación fue aprobada; lo invita a crear su cuenta en la red.
export function correoSolicitudAprobada(datos: { nombre: string }, urlSitio: string): Correo {
  const primerNombre = datos.nombre.trim().split(/\s+/)[0] ?? datos.nombre
  const enlace = enSitio(urlSitio, "/registro")
  const asunto = "¡Bienvenido al Colectivo de Ingenieros Jóvenes de Jalisco!"
  return {
    asunto,
    html: envolver({
      titulo: `¡Bienvenido, ${primerNombre}!`,
      previo: "Tu solicitud de afiliación fue aprobada.",
      urlSitio,
      cuerpo:
        parrafo("El Consejo Directivo aprobó tu solicitud de afiliación. Ya eres parte del Colectivo.") +
        parrafo(
          "Crea tu cuenta en la red de miembros para armar tu perfil y conocer a los demás integrantes. Usa <strong>este mismo correo</strong> o entra con Google."
        ) +
        boton(enlace, "Crear mi cuenta") +
        parrafo("Además, como miembro tienes precio preferencial en los eventos del Colectivo."),
    }),
    texto: `¡Bienvenido, ${primerNombre}!\n\nEl Consejo Directivo aprobó tu solicitud de afiliación. Ya eres parte del Colectivo.\n\nCrea tu cuenta en la red de miembros con este mismo correo (o con Google): ${enlace}\n\nComo miembro tienes precio preferencial en los eventos.`,
  }
}

// A quien un administrador invitó al Consejo y aún no tiene cuenta.
export function correoInvitacionConsejo(
  datos: { nombre: string; rol: "admin" | "revisor"; invitadoPor: string },
  urlSitio: string
): Correo {
  const primerNombre = datos.nombre.trim().split(/\s+/)[0] ?? datos.nombre
  const enlace = enSitio(urlSitio, "/registro")
  const rol = datos.rol === "admin" ? "administrador" : "revisor"
  const asunto = "Te invitaron al panel del Consejo Directivo"
  return {
    asunto,
    html: envolver({
      titulo: `Hola, ${primerNombre}`,
      previo: `${datos.invitadoPor} te dio acceso al panel del Consejo.`,
      urlSitio,
      cuerpo:
        parrafo(
          `${escaparHtml(datos.invitadoPor)} te agregó al panel del Consejo Directivo como <strong>${rol}</strong>.`
        ) +
        parrafo("Crea tu cuenta con <strong>este mismo correo</strong> (o entra con Google) y tendrás acceso de inmediato.") +
        boton(enlace, "Crear mi cuenta"),
    }),
    texto: `Hola, ${primerNombre}.\n\n${datos.invitadoPor} te agregó al panel del Consejo Directivo como ${rol}.\n\nCrea tu cuenta con este mismo correo (o entra con Google): ${enlace}`,
  }
}

// Al asistente: confirmación de registro a un evento con folio y cómo pagar.
export function correoRegistroEvento(
  datos: {
    nombre: string
    folio: string
    evento: { titulo: string; slug: string; fecha: string; horario: string; lugar: string; direccion: string | null }
    monto: string
    esGratis: boolean
    esMiembro: boolean
    instrucciones: string | null
  },
  urlSitio: string
): Correo {
  const { evento } = datos
  const enlace = enSitio(urlSitio, `/eventos/${evento.slug}`)
  const lugar = evento.direccion ? `${evento.lugar}, ${evento.direccion}` : evento.lugar
  const pago = datos.esGratis
    ? "Este evento es gratuito: no necesitas pagar nada."
    : `Monto a pagar: ${datos.monto}${datos.esMiembro ? " (precio de miembro)" : ""}.`
  const asunto = `Registro confirmado: ${evento.titulo} (folio ${datos.folio})`

  return {
    asunto,
    html: envolver({
      titulo: "¡Tu lugar está apartado!",
      previo: `Folio ${datos.folio} para ${evento.titulo}.`,
      urlSitio,
      cuerpo:
        parrafo(`Hola, ${escaparHtml(datos.nombre)}. Te registraste a <strong>${escaparHtml(evento.titulo)}</strong>.`) +
        tablaDatos([
          ["Folio", datos.folio],
          ["Fecha", evento.fecha],
          ["Horario", evento.horario],
          ["Lugar", lugar],
        ]) +
        parrafo(`<strong>${escaparHtml(pago)}</strong>`) +
        (datos.instrucciones && !datos.esGratis
          ? `<div style="margin:0 0 20px;padding:16px;border-radius:12px;background:#fdf1e8;font-size:15px;line-height:1.6;color:#1f2937;white-space:pre-line">${escaparHtml(datos.instrucciones)}</div>`
          : "") +
        parrafo("Guarda este correo: tu folio te identifica en el registro del evento.") +
        boton(enlace, "Ver detalles del evento"),
    }),
    texto: [
      `Hola, ${datos.nombre}. Te registraste a ${evento.titulo}.`,
      "",
      `Folio: ${datos.folio}`,
      `Fecha: ${evento.fecha}`,
      `Horario: ${evento.horario}`,
      `Lugar: ${lugar}`,
      "",
      pago,
      ...(datos.instrucciones && !datos.esGratis ? ["", datos.instrucciones] : []),
      "",
      `Detalles: ${enlace}`,
    ].join("\n"),
  }
}
