import { describe, expect, it } from "vitest"

import { profileSchema } from "@/lib/validations/profile"

const empty = {
  fullName: "Ana López",
  headline: "",
  specialty: "",
  municipality: "",
  bio: "",
  linkedinUrl: "",
  instagramHandle: "",
  websiteUrl: "",
  isVisible: true,
  photoPath: "",
  whatsapp: "",
  contactEmail: "",
  showContact: false,
}

describe("profileSchema", () => {
  it("turns empty fields into null", () => {
    const profile = profileSchema.parse({ ...empty, specialty: "   " })
    expect(profile.specialty).toBeNull()
    expect(profile.linkedinUrl).toBeNull()
    expect(profile.photoPath).toBeNull()
  })

  it("adds the protocol to LinkedIn and website links", () => {
    const profile = profileSchema.parse({ ...empty, linkedinUrl: "linkedin.com/in/ana", websiteUrl: "ana.mx" })
    expect(profile.linkedinUrl).toBe("https://linkedin.com/in/ana")
    expect(profile.websiteUrl).toBe("https://ana.mx")
  })

  it("rejects LinkedIn links that are not from LinkedIn", () => {
    expect(profileSchema.safeParse({ ...empty, linkedinUrl: "https://linkedin.com.malicioso.io/in/ana" }).success).toBe(false)
    expect(profileSchema.safeParse({ ...empty, linkedinUrl: "javascript:alert(1)" }).success).toBe(false)
  })

  it("extracts the Instagram username from @user or from the URL", () => {
    expect(profileSchema.parse({ ...empty, instagramHandle: "@ana.lopez" }).instagramHandle).toBe("ana.lopez")
    expect(profileSchema.parse({ ...empty, instagramHandle: "https://www.instagram.com/ana_lopez/" }).instagramHandle).toBe("ana_lopez")
    expect(profileSchema.safeParse({ ...empty, instagramHandle: "no válido!" }).success).toBe(false)
  })

  it("rejects websites without a domain", () => {
    expect(profileSchema.safeParse({ ...empty, websiteUrl: "no es un sitio" }).success).toBe(false)
  })

  it("requires a name", () => {
    expect(profileSchema.safeParse({ ...empty, fullName: " " }).success).toBe(false)
  })

  it("normalizes the WhatsApp number and validates it", () => {
    expect(profileSchema.parse({ ...empty, whatsapp: "33 1234-5678" }).whatsapp).toBe("3312345678")
    expect(profileSchema.parse({ ...empty, whatsapp: "+52 (33) 1234 5678" }).whatsapp).toBe("+523312345678")
    expect(profileSchema.safeParse({ ...empty, whatsapp: "12345" }).success).toBe(false)
  })

  it("validates and lowercases the contact email", () => {
    expect(profileSchema.parse({ ...empty, contactEmail: "Ana@Correo.MX" }).contactEmail).toBe("ana@correo.mx")
    expect(profileSchema.safeParse({ ...empty, contactEmail: "no-es-correo" }).success).toBe(false)
  })

  it("requires some contact data to share it", () => {
    const result = profileSchema.safeParse({ ...empty, showContact: true })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["showContact"])
    expect(profileSchema.safeParse({ ...empty, showContact: true, whatsapp: "3312345678" }).success).toBe(true)
  })
})
