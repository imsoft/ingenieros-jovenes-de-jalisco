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
  websiteUrl: "",
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

  it("limits the number and length of services", () => {
    const nine = Array.from({ length: 9 }, (_, index) => `Servicio ${index}`).join(",")
    expect(companySchema.safeParse({ ...valid, services: nine }).success).toBe(false)
    expect(companySchema.safeParse({ ...valid, services: "x".repeat(41) }).success).toBe(false)
  })
})
