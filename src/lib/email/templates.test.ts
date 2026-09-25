import { describe, expect, it } from "vitest"

import {
  applicationApprovedEmail,
  boardInvitationEmail,
  escapeHtml,
  eventRegistrationEmail,
  newApplicationEmail,
} from "@/lib/email/templates"

const SITE = "https://ingenierosjovenes.example"

describe("escapeHtml", () => {
  it("escapes dangerous characters", () => {
    expect(escapeHtml(`<script>"x" & 'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;")
  })
})

describe("newApplicationEmail", () => {
  it("escapes applicant data and links to the panel on the configured domain", () => {
    const email = newApplicationEmail(
      { fullName: "<img src=x onerror=alert(1)>", email: "a@b.mx", phone: "3312345678", municipality: "Zapopan" },
      SITE
    )
    expect(email.html).not.toContain("<img src=x")
    expect(email.html).toContain("&lt;img src=x")
    expect(email.html).toContain(`${SITE}/panel/solicitudes`)
    expect(email.text).toContain("Zapopan")
  })

  it("includes the brand logo from the site", () => {
    const email = newApplicationEmail({ fullName: "Ana", email: "a@b.mx", phone: "3312345678", municipality: "Zapopan" }, `${SITE}/`)
    expect(email.html).toContain(`src="${SITE}/brand/email-logo.png"`)
  })
})

describe("applicationApprovedEmail", () => {
  it("greets by first name and invites to sign up", () => {
    const email = applicationApprovedEmail({ fullName: "María José Pérez" }, SITE)
    expect(email.html).toContain("¡Bienvenido, María!")
    expect(email.html).toContain(`${SITE}/registro`)
    expect(email.text).toContain(`${SITE}/registro`)
  })
})

describe("boardInvitationEmail", () => {
  it("explains the role and links to sign up", () => {
    const email = boardInvitationEmail({ fullName: "Luis Pérez", role: "admin", invitedBy: "<b>Ana</b>" }, SITE)
    expect(email.html).toContain("administrador")
    expect(email.html).toContain("&lt;b&gt;Ana&lt;/b&gt;")
    expect(email.text).toContain(`${SITE}/registro`)
  })
})

describe("eventRegistrationEmail", () => {
  const base = {
    fullName: "Ana",
    confirmationCode: "CIJJ-0042",
    event: {
      title: "Networking",
      slug: "networking-2026",
      date: "Viernes, 20 de noviembre de 2026",
      timeRange: "19:30",
      venue: "Casa Jalisco",
      address: "Av. Juárez 100",
    },
    amount: "$300.00",
    isFree: false,
    isMember: true,
    paymentInstructions: "Transferencia a CLABE 000",
  }

  it("includes confirmation code, member price and payment instructions", () => {
    const email = eventRegistrationEmail(base, SITE)
    expect(email.subject).toContain("CIJJ-0042")
    expect(email.text).toContain("Monto a pagar: $300.00 (precio de miembro).")
    expect(email.text).toContain("Transferencia a CLABE 000")
    expect(email.html).toContain(`${SITE}/eventos/networking-2026`)
  })

  it("omits payment and instructions for free events", () => {
    const email = eventRegistrationEmail({ ...base, isFree: true, amount: "Gratis" }, SITE)
    expect(email.text).toContain("Este evento es gratuito")
    expect(email.text).not.toContain("CLABE")
  })
})
