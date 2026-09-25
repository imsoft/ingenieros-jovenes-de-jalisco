// Reads the emails that local Supabase delivers to Mailpit.
import { wait } from "./browser.mjs"

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324"

export async function emailsTo(address) {
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)
  return (await response.json()).messages ?? []
}

// Waits for a new email (beyond `previousCount`) and returns the most recent one.
export async function waitForEmail(address, previousCount = 0) {
  for (let i = 0; i < 40; i++) {
    const messages = await emailsTo(address)
    if (messages.length > previousCount) return messages[0]
    await wait(250)
  }
  return null
}

// Subject, HTML and the /auth/confirm link of an email.
export async function readEmail(message) {
  const detail = await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json()
  const link = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(detail.HTML)?.[1]?.replaceAll("&amp;", "&")
  return { subject: detail.Subject, html: detail.HTML, confirmLink: link }
}
