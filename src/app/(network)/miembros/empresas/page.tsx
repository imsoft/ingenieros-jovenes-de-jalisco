import type { Metadata } from "next"
import Link from "next/link"
import { Building2Icon, SearchXIcon } from "lucide-react"

import { CompanyCard } from "@/components/members/company-card"
import { DirectoryFilters } from "@/components/members/directory-filters"
import { MemberAvatar } from "@/components/members/member-avatar"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { getCompanyLogoUrl, listVisibleCompanies } from "@/lib/members/companies"
import { distinctValues, groupCompanies, type DirectoryFilters as Filters } from "@/lib/members/directory"
import { getProfilePhotoUrl, listDirectoryProfiles } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"
import { companyRoleLabels } from "@/lib/validations/company"

export const metadata: Metadata = { title: "Empresas de los miembros" }

const readParam = (value: string | string[] | undefined) => (typeof value === "string" && value.trim() ? value.slice(0, 80) : undefined)

export default async function CompaniesPage({ searchParams }: PageProps<"/miembros/empresas">) {
  await requireMember("/miembros/empresas")
  const params = await searchParams
  const filters: Filters = { q: readParam(params.q), sector: readParam(params.sector), municipality: readParam(params.municipality) }
  const isFiltered = Object.values(filters).some(Boolean)

  // Only companies of profiles in the directory (RLS already hides hidden, suspended and former members).
  const [companies, profiles] = await Promise.all([listVisibleCompanies(), listDirectoryProfiles()])
  const profilesById = new Map(profiles.map((profile) => [profile.user_id, profile]))
  const listed = companies.filter((company) => profilesById.has(company.user_id))
  const allGroups = groupCompanies(listed)
  const groups = groupCompanies(listed, filters)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-sm font-semibold tracking-widest text-brand-orange uppercase">Red de miembros</p>
      <h1 className="mt-1 font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Empresas</h1>
      <p className="mt-2 text-muted-foreground">
        {allGroups.length === 1 ? "1 empresa" : `${allGroups.length} empresas`} donde trabajan o emprenden los miembros del Colectivo.
      </p>

      <div className="mt-6">
        <DirectoryFilters
          action="/miembros/empresas"
          filters={filters}
          searchLabel="Buscar empresas"
          searchPlaceholder="Empresa, servicio, giro…"
          selects={[
            { name: "sector", label: "Giro", allLabel: "Todos", options: distinctValues(allGroups.map((group) => group.sector)) },
            { name: "municipality", label: "Municipio", allLabel: "Todos", options: distinctValues(allGroups.map((group) => group.municipality)) },
          ]}
        />
      </div>

      {groups.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <li key={group.key} className="min-w-0">
              <CompanyCard
                headingLevel="h2"
                company={{
                  name: group.name,
                  sector: group.sector,
                  description: group.description,
                  services: group.services,
                  municipality: group.municipality,
                  website_url: group.websiteUrl,
                  logoUrl: getCompanyLogoUrl(group.logoPath),
                }}
                footer={
                  <>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Del Colectivo</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {group.entries.map((entry) => {
                        const profile = profilesById.get(entry.user_id)
                        if (!profile) return null
                        return (
                          <li key={entry.id}>
                            <Link href={`/miembros/${profile.user_id}`} className="group flex items-center gap-3 rounded-lg">
                              <MemberAvatar name={profile.full_name} photoUrl={getProfilePhotoUrl(profile.photo_path)} size={32} />
                              <span className="min-w-0 text-sm">
                                <span className="block truncate font-medium text-brand-blue group-hover:underline">{profile.full_name}</span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {[companyRoleLabels[entry.role], entry.job_title].filter(Boolean).join(" · ")}
                                </span>
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-8 rounded-3xl border border-brand-blue/20 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-full bg-brand-blue/10 text-brand-blue [&_svg:not([class*='size-'])]:size-6">
              {isFiltered ? <SearchXIcon aria-hidden /> : <Building2Icon aria-hidden />}
            </EmptyMedia>
            <EmptyTitle className="font-heading text-xl text-brand-blue uppercase">{isFiltered ? "Sin resultados" : "Aún no hay empresas"}</EmptyTitle>
            <EmptyDescription>
              {isFiltered ? "Ninguna empresa coincide con esos filtros." : "Agrega tu empresa o emprendimiento desde Mi perfil y sé de los primeros."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={isFiltered ? "/miembros/empresas" : "/mi-perfil"} className={buttonVariants({ variant: "outline" })}>
              {isFiltered ? "Ver todas" : "Ir a Mi perfil"}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
