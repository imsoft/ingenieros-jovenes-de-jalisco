import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { correosDelConsejo, enviarCorreo } from "@/lib/correo/enviar"

const correo = { asunto: "Hola", html: "<p>Hola</p>", texto: "Hola" }

describe("enviarCorreo", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("no envía nada si Resend no está configurado", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const fetchSimulado = vi.fn()
    vi.stubGlobal("fetch", fetchSimulado)

    expect(await enviarCorreo("a@b.mx", correo)).toEqual({ ok: false, motivo: "sin-configurar" })
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it("envía a Resend con remitente, respuesta e idempotencia", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_prueba")
    vi.stubEnv("CORREO_REMITENTE", "CIJJ <no-responder@ingenierosjovenes.example>")
    const fetchSimulado = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "abc" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchSimulado)

    const resultado = await enviarCorreo(["a@b.mx", " "], correo, { responderA: "c@d.mx", idempotencia: "clave-1" })

    expect(resultado).toEqual({ ok: true, id: "abc" })
    const [url, init] = fetchSimulado.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_prueba", "Idempotency-Key": "clave-1" })
    expect(JSON.parse(init.body)).toMatchObject({
      from: "CIJJ <no-responder@ingenierosjovenes.example>",
      to: ["a@b.mx"],
      reply_to: "c@d.mx",
      subject: "Hola",
    })
  })

  it("no lanza si Resend falla", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_prueba")
    vi.stubEnv("CORREO_REMITENTE", "no-responder@ingenierosjovenes.example")
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("dominio no verificado", { status: 403 })))
    expect(await enviarCorreo("a@b.mx", correo)).toEqual({ ok: false, motivo: "error" })

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("sin red")))
    expect(await enviarCorreo("a@b.mx", correo)).toEqual({ ok: false, motivo: "error" })
  })
})

describe("correosDelConsejo", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("separa por comas e ignora los correos provisionales .example", () => {
    vi.stubEnv("NOTIFICACIONES_CORREO", "uno@cijj.mx, dos@cijj.mx ,consejo@ingenierosjovenes.example,")
    expect(correosDelConsejo()).toEqual(["uno@cijj.mx", "dos@cijj.mx"])
  })
})
