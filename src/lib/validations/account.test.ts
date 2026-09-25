import { describe, expect, it } from "vitest"

import { memberSignUpSchema, newPasswordSchema } from "@/lib/validations/account"

const validSignUp = {
  fullName: "Ana López",
  email: "  Ana@Correo.MX ",
  password: "segura123",
  confirmation: "segura123",
  acceptsPrivacyNotice: "on",
}

describe("memberSignUpSchema", () => {
  it("normalizes the email", () => {
    const result = memberSignUpSchema.parse(validSignUp)
    expect(result.email).toBe("ana@correo.mx")
  })

  it("requires matching passwords", () => {
    const result = memberSignUpSchema.safeParse({ ...validSignUp, confirmation: "otra1234" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["confirmation"])
  })

  it("requires at least 8 characters and the privacy notice", () => {
    expect(memberSignUpSchema.safeParse({ ...validSignUp, password: "corta", confirmation: "corta" }).success).toBe(false)
    expect(memberSignUpSchema.safeParse({ ...validSignUp, acceptsPrivacyNotice: null }).success).toBe(false)
  })
})

describe("newPasswordSchema", () => {
  it("validates the new password", () => {
    expect(newPasswordSchema.safeParse({ password: "nueva1234", confirmation: "nueva1234" }).success).toBe(true)
    expect(newPasswordSchema.safeParse({ password: "nueva1234", confirmation: "nueva12345" }).success).toBe(false)
  })
})
