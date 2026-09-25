import "server-only"

import type { Email } from "@/lib/email/templates"

export type SendResult = { ok: true; id: string } | { ok: false; reason: "not-configured" | "error" }

// Sends through the Resend API. Never throws: a failed email must not break the main flow.
// Until RESEND_API_KEY and EMAIL_FROM (verified domain) exist, nothing is sent.
export async function sendEmail(
  to: string | string[],
  email: Email,
  options: { replyTo?: string; idempotencyKey?: string } = {}
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  const recipients = (Array.isArray(to) ? to : [to]).map((address) => address.trim()).filter(Boolean)

  if (!apiKey || !from || recipients.length === 0) {
    console.info(`[email] Resend not configured; skipped “${email.subject}”.`)
    return { ok: false, reason: "not-configured" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      console.error(`[email] Resend responded ${response.status}:`, (await response.text()).slice(0, 300))
      return { ok: false, reason: "error" }
    }

    const { id } = (await response.json()) as { id: string }
    return { ok: true, id }
  } catch (error) {
    console.error("[email] Could not reach Resend:", error instanceof Error ? error.message : error)
    return { ok: false, reason: "error" }
  }
}

// Recipients of internal notices (comma-separated list in BOARD_NOTIFICATION_EMAILS).
export function getBoardNotificationEmails() {
  return (process.env.BOARD_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.includes("@") && !address.endsWith(".example"))
}
