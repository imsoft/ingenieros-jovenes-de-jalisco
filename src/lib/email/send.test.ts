import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getBoardNotificationEmails, sendEmail } from "@/lib/email/send"

const email = { subject: "Hola", html: "<p>Hola</p>", text: "Hola" }

describe("sendEmail", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("sends nothing when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    expect(await sendEmail("a@b.mx", email)).toEqual({ ok: false, reason: "not-configured" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("posts to Resend with sender, reply-to and idempotency key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test")
    vi.stubEnv("EMAIL_FROM", "CIJJ <no-responder@ingenierosjovenes.example>")
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "abc" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendEmail(["a@b.mx", " "], email, { replyTo: "c@d.mx", idempotencyKey: "key-1" })

    expect(result).toEqual({ ok: true, id: "abc" })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_test", "Idempotency-Key": "key-1" })
    expect(JSON.parse(init.body)).toMatchObject({
      from: "CIJJ <no-responder@ingenierosjovenes.example>",
      to: ["a@b.mx"],
      reply_to: "c@d.mx",
      subject: "Hola",
    })
  })

  it("does not throw when Resend fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test")
    vi.stubEnv("EMAIL_FROM", "no-responder@ingenierosjovenes.example")
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("domain not verified", { status: 403 })))
    expect(await sendEmail("a@b.mx", email)).toEqual({ ok: false, reason: "error" })

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    expect(await sendEmail("a@b.mx", email)).toEqual({ ok: false, reason: "error" })
  })
})

describe("getBoardNotificationEmails", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("splits by commas and ignores .example placeholder addresses", () => {
    vi.stubEnv("BOARD_NOTIFICATION_EMAILS", "uno@cijj.mx, dos@cijj.mx ,consejo@ingenierosjovenes.example,")
    expect(getBoardNotificationEmails()).toEqual(["uno@cijj.mx", "dos@cijj.mx"])
  })
})
