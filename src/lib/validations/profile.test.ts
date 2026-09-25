import { describe, expect, it } from "vitest"

import { profileSchema } from "@/lib/validations/profile"

const empty = {
  fullName: "Ana López",
  headline: "",
  specialty: "",
  company: "",
  jobTitle: "",
  municipality: "",
  bio: "",
  linkedinUrl: "",
  instagramHandle: "",
  websiteUrl: "",
  isVisible: true,
  photoPath: "",
}

describe("profileSchema", () => {
  it("turns empty fields into null", () => {
    const profile = profileSchema.parse({ ...empty, company: "   " })
    expect(profile.company).toBeNull()
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
})
