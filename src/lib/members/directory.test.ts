import { describe, expect, it } from "vitest"

import { distinctValues, filterDirectory, groupCompanies } from "@/lib/members/directory"

const profile = (user_id: string, full_name: string, extra: Partial<{ headline: string; specialty: string; municipality: string }> = {}) => ({
  user_id,
  full_name,
  headline: extra.headline ?? null,
  specialty: extra.specialty ?? null,
  municipality: extra.municipality ?? null,
})

const company = (id: string, user_id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  user_id,
  name,
  role: "employee" as const,
  job_title: null,
  sector: null,
  description: null,
  services: [] as string[],
  municipality: null,
  website_url: null,
  logo_path: null,
  ...extra,
})

const profiles = [
  profile("a", "Sofía Ramírez", { specialty: "Ingeniería civil", municipality: "Guadalajara" }),
  profile("b", "Diego Hernández", { specialty: "Mecatrónica", municipality: "Tlaquepaque" }),
  profile("c", "Valeria Montes", { specialty: "Ingeniería civil", municipality: "Zapopan" }),
]
const companies = [
  company("1", "a", "Constructora Occidente", { role: "owner", sector: "Construcción e infraestructura", services: ["Obra civil", "Supervisión"], description: "Obra pública" }),
  company("2", "c", "constructora occidente", { sector: "Construcción e infraestructura", services: ["BIM"], municipality: "Zapopan" }),
  company("3", "b", "Continental", { sector: "Automotriz", municipality: "Tlaquepaque" }),
]

describe("filterDirectory", () => {
  it("filters by specialty ignoring accents and case", () => {
    expect(filterDirectory(profiles, companies, { specialty: "ingenieria CIVIL" }).map((p) => p.user_id)).toEqual(["a", "c"])
  })

  it("filters by the sector of any of the member's companies", () => {
    expect(filterDirectory(profiles, companies, { sector: "Automotriz" }).map((p) => p.user_id)).toEqual(["b"])
  })

  it("uses the company's sector for members who did not fill it in", () => {
    const withColleague = [...companies, company("4", "b", "Constructora Occidente", {})]
    expect(filterDirectory(profiles, withColleague, { sector: "Construcción e infraestructura" }).map((p) => p.user_id)).toEqual(["a", "b", "c"])
  })

  it("matches the municipality of the profile or of a company", () => {
    expect(filterDirectory(profiles, companies, { municipality: "zapopan" }).map((p) => p.user_id)).toEqual(["c"])
  })

  it("searches text across profile and company fields, including services", () => {
    expect(filterDirectory(profiles, companies, { q: "bim" }).map((p) => p.user_id)).toEqual(["c"])
    expect(filterDirectory(profiles, companies, { q: "occidente sofia" }).map((p) => p.user_id)).toEqual(["a"])
  })

  it("returns everyone without filters", () => {
    expect(filterDirectory(profiles, companies, {})).toHaveLength(3)
  })
})

describe("groupCompanies", () => {
  it("groups entries with the same name and prefers the owner's data", () => {
    const [group, ...rest] = groupCompanies(companies.filter((c) => c.name.toLowerCase().includes("occidente")))
    expect(rest).toHaveLength(0)
    expect(group.name).toBe("Constructora Occidente")
    expect(group.entries.map((entry) => entry.user_id)).toEqual(["a", "c"])
    expect(group.description).toBe("Obra pública")
    expect(group.municipality).toBe("Zapopan")
    expect(group.services).toEqual(["BIM", "Obra civil", "Supervisión"])
  })

  it("filters groups by sector and text", () => {
    expect(groupCompanies(companies, { sector: "automotriz" }).map((group) => group.name)).toEqual(["Continental"])
    expect(groupCompanies(companies, { q: "supervision" }).map((group) => group.name)).toEqual(["Constructora Occidente"])
  })
})

describe("distinctValues", () => {
  it("dedupes ignoring accents and case and sorts in Spanish", () => {
    expect(distinctValues(["Zapopan", "zapopan", null, "Ávila", "  ", "Tonalá"])).toEqual(["Ávila", "Tonalá", "Zapopan"])
  })
})
