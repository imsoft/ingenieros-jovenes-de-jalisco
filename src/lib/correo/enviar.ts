import "server-only"

import type { Correo } from "@/lib/correo/plantillas"

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; motivo: "sin-configurar" | "error" }

// Envía con la API de Resend. Nunca lanza: un correo que falla no debe romper el flujo principal.
// Mientras no existan RESEND_API_KEY y CORREO_REMITENTE (dominio verificado), no envía nada.
export async function enviarCorreo(
  para: string | string[],
  correo: Correo,
  opciones: { responderA?: string; idempotencia?: string } = {}
): Promise<ResultadoEnvio> {
  const clave = process.env.RESEND_API_KEY
  const remitente = process.env.CORREO_REMITENTE
  const destinatarios = (Array.isArray(para) ? para : [para]).map((valor) => valor.trim()).filter(Boolean)

  if (!clave || !remitente || destinatarios.length === 0) {
    console.info(`[correo] Resend sin configurar; se omitió “${correo.asunto}”.`)
    return { ok: false, motivo: "sin-configurar" }
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clave}`,
        "Content-Type": "application/json",
        ...(opciones.idempotencia ? { "Idempotency-Key": opciones.idempotencia } : {}),
      },
      body: JSON.stringify({
        from: remitente,
        to: destinatarios,
        subject: correo.asunto,
        html: correo.html,
        text: correo.texto,
        ...(opciones.responderA ? { reply_to: opciones.responderA } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!respuesta.ok) {
      console.error(`[correo] Resend respondió ${respuesta.status}:`, (await respuesta.text()).slice(0, 300))
      return { ok: false, motivo: "error" }
    }

    const { id } = (await respuesta.json()) as { id: string }
    return { ok: true, id }
  } catch (error) {
    console.error("[correo] No se pudo contactar a Resend:", error instanceof Error ? error.message : error)
    return { ok: false, motivo: "error" }
  }
}

// Destinatarios de avisos internos (lista separada por comas en NOTIFICACIONES_CORREO).
export function correosDelConsejo() {
  return (process.env.NOTIFICACIONES_CORREO ?? "")
    .split(",")
    .map((correo) => correo.trim())
    .filter((correo) => correo.includes("@") && !correo.endsWith(".example"))
}
