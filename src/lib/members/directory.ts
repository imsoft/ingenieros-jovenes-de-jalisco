// Pure helpers for the member directory and the companies directory (no database access).
import type { CompanyRole } from "@/lib/validations/company"

type DirectoryProfile = { user_id: string; full_name: string; headline: string | null; specialty: string | null; municipality: string | null }
type DirectoryCompany = {
  id: string
  user_id: string
  name: string
  role: CompanyRole
  job_title: string | null
  sector: string | null
  description: string | null
  services: string[]
  municipality: string | null
  website_url: string | null
  logo_path: string | null
}

export type DirectoryFilters = { q?: string; specialty?: string; sector?: string; municipality?: string }

export const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
const same = (a: string | null | undefined, b: string | null | undefined) => Boolean(a && b && normalize(a) === normalize(b))
const matchesTerms = (text: string, query?: string) => {
  const terms = normalize(query ?? "").split(/\s+/).filter(Boolean)
  const haystack = normalize(text)
  return terms.every((term) => haystack.includes(term))
}

// Distinct values sorted alphabetically, keeping the first spelling seen.
export function distinctValues(values: (string | null | undefined)[]) {
  const byKey = new Map<string, string>()
  for (const value of values) {
    if (value?.trim() && !byKey.has(normalize(value))) byKey.set(normalize(value), value.trim())
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "es"))
}

export function filterDirectory<P extends DirectoryProfile, C extends DirectoryCompany>(
  profiles: P[],
  companies: C[],
  filters: DirectoryFilters
) {
  const companiesByUser = groupByUser(companies)
  // A company's sector is shared by everyone who works there, even if only one of them filled it in.
  const sectorByCompany = new Map<string, string>()
  for (const company of companies) {
    if (company.sector && !sectorByCompany.has(companyKey(company.name))) sectorByCompany.set(companyKey(company.name), company.sector)
  }
  const sectorOf = (company: C) => company.sector ?? sectorByCompany.get(companyKey(company.name)) ?? null

  return profiles.filter((profile) => {
    const own = companiesByUser.get(profile.user_id) ?? []
    if (filters.specialty && !same(profile.specialty, filters.specialty)) return false
    if (filters.sector && !own.some((company) => same(sectorOf(company), filters.sector))) return false
    if (filters.municipality && !same(profile.municipality, filters.municipality) && !own.some((company) => same(company.municipality, filters.municipality))) {
      return false
    }
    const text = [profile.full_name, profile.headline, profile.specialty, profile.municipality, ...own.flatMap((company) => [company.name, company.job_title, sectorOf(company), ...company.services])]
      .filter(Boolean)
      .join(" ")
    return matchesTerms(text, filters.q)
  })
}

// Same company regardless of accents, case and punctuation ("Constructora Occidente" = "constructora occidente").
const companyKey = (name: string) => normalize(name).replace(/[^a-z0-9]+/g, " ").trim()

export function groupByUser<C extends { user_id: string }>(companies: C[]) {
  const map = new Map<string, C[]>()
  for (const company of companies) map.set(company.user_id, [...(map.get(company.user_id) ?? []), company])
  return map
}

export type CompanyGroup<C extends DirectoryCompany> = {
  key: string
  name: string
  sector: string | null
  municipality: string | null
  description: string | null
  websiteUrl: string | null
  logoPath: string | null
  services: string[]
  entries: C[]
}

// Members list their companies independently: entries with the same name (ignoring accents and case)
// are shown as one company with everyone from the Colectivo who works there.
export function groupCompanies<C extends DirectoryCompany>(companies: C[], filters: DirectoryFilters = {}): CompanyGroup<C>[] {
  const groups = new Map<string, C[]>()
  for (const company of companies) {
    const key = companyKey(company.name)
    groups.set(key, [...(groups.get(key) ?? []), company])
  }

  return [...groups.entries()]
    .map(([key, entries]) => {
      // Owners and partners describe the company best.
      const ranked = [...entries].sort((a, b) => rank(a.role) - rank(b.role))
      const pick = <K extends keyof C>(field: K) => ranked.find((entry) => entry[field])?.[field] ?? null
      return {
        key,
        name: ranked[0].name,
        sector: pick("sector") as string | null,
        municipality: pick("municipality") as string | null,
        description: pick("description") as string | null,
        websiteUrl: pick("website_url") as string | null,
        logoPath: pick("logo_path") as string | null,
        services: distinctValues(ranked.flatMap((entry) => entry.services)),
        entries: ranked,
      }
    })
    .filter((group) => {
      if (filters.sector && !same(group.sector, filters.sector)) return false
      if (filters.municipality && !same(group.municipality, filters.municipality)) return false
      return matchesTerms([group.name, group.sector, group.description, ...group.services].filter(Boolean).join(" "), filters.q)
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
}

const rank = (role: CompanyRole) => ({ owner: 0, partner: 1, employee: 2, freelance: 3 })[role]
