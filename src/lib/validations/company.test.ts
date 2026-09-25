import { describe, expect, it } from "vitest"

import { companySchema, parseServices } from "@/lib/validations/company"

const valid = {
  name: "Constructora Occidente",
  role: "owner",
  jobTitle: "",
  sector: "Construcción e infraestructura",
  description: "",
  services: "",
  municipality: "Zapopan",
  address: "",
  websiteUrl: "",
  linkedinUrl: "",
  instagramHandle: "",
  facebookUrl: "",
  logoPath: "",
}

describe("parseServices", () => {
  it("splits by commas, semicolons and line breaks, trims and capitalizes", () => {
    expect(parseServices("diseño estructural,  supervisión de obra; BIM\nTopografía")).toEqual([
      "Diseño estructural",
      "Supervisión de obra",
      "BIM",
      "Topografía",
    ])
  })

  it("drops empty entries and case-insensitive duplicates", () => {
    expect(parseServices("BIM, , bim ,Bim")).toEqual(["BIM"])
  })
})

describe("companySchema", () => {
  it("turns empty optional fields into null and services into a list", () => {
    const company = companySchema.parse({ ...valid, services: "Obra civil, Mantenimiento" })
    expect(company.jobTitle).toBeNull()
    expect(company.websiteUrl).toBeNull()
    expect(company.services).toEqual(["Obra civil", "Mantenimiento"])
  })

  it("adds the protocol to the website", () => {
    expect(companySchema.parse({ ...valid, websiteUrl: "occidente.mx" }).websiteUrl).toBe("https://occidente.mx")
  })

  it("requires a name and a known role", () => {
    expect(companySchema.safeParse({ ...valid, name: " " }).success).toBe(false)
    expect(companySchema.safeParse({ ...valid, role: "boss" }).success).toBe(false)
  })

  it("accepts any number of services but limits their length", () => {
    const many = Array.from({ length: 30 }, (_, index) => `Servicio ${index}`).join("\n")
    expect(companySchema.parse({ ...valid, services: many }).services).toHaveLength(30)
    expect(companySchema.safeParse({ ...valid, services: "x".repeat(61) }).success).toBe(false)
  })

  it("cleans the company social networks and address", () => {
    const company = companySchema.parse({
      ...valid,
      address: "  Av. Vallarta 1234, Col. Americana  ",
      linkedinUrl: "linkedin.com/company/constructora-occidente",
      instagramHandle: "https://www.instagram.com/constructora.occ/?hl=es",
      facebookUrl: "facebook.com/ConstructoraOccidente",
    })
    expect(company.address).toBe("Av. Vallarta 1234, Col. Americana")
    expect(company.linkedinUrl).toBe("https://linkedin.com/company/constructora-occidente")
    expect(company.instagramHandle).toBe("constructora.occ")
    expect(company.facebookUrl).toBe("https://facebook.com/ConstructoraOccidente")
  })

  it("rejects social links from other sites", () => {
    expect(companySchema.safeParse({ ...valid, facebookUrl: "instagram.com/x" }).success).toBe(false)
    expect(companySchema.safeParse({ ...valid, linkedinUrl: "facebook.com/x" }).success).toBe(false)
    expect(companySchema.safeParse({ ...valid, instagramHandle: "no válido" }).success).toBe(false)
  })
})
