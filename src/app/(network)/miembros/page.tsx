import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, BriefcaseBusinessIcon, MapPinIcon, SearchXIcon, UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"

import { DirectoryFilters } from "@/components/members/directory-filters"
import { MemberAvatar } from "@/components/members/member-avatar"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { listVisibleCompanies } from "@/lib/members/companies"
import { distinctValues, filterDirectory, groupByUser, type DirectoryFilters as Filters } from "@/lib/members/directory"
import { getProfile, getProfilePhotoUrl, listDirectoryProfiles } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"

const readParam = (value: string | string[] | undefined) => (typeof value === "string" && value.trim() ? value.slice(0, 80) : undefined)

export const metadata: Metadata = { title: "Directorio de miembros" }

export default async function MembersPage({ searchParams }: PageProps<"/miembros">) {
  const member = await requireMember("/miembros")
  const params = await searchParams
  const filters: Filters = {
    q: readParam(params.q),
    specialty: readParam(params.specialty),
    sector: readParam(params.sector),
    municipality: readParam(params.municipality),
  }
  const isFiltered = Object.values(filters).some(Boolean)

  const [allProfiles, companies, myProfile] = await Promise.all([listDirectoryProfiles(), listVisibleCompanies(), getProfile(member.userId)])
  const profiles = filterDirectory(allProfiles, companies, filters)
  const companiesByUser = groupByUser(companies)
  const total = allProfiles.length

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-widest text-brand-orange uppercase">Red de miembros</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Directorio</h1>
          <p className="mt-2 text-muted-foreground">
            {total === 1 ? "1 miembro" : `${total} miembros`} del Colectivo. Conócelos y conecta.
          </p>
        </div>

      </div>

      <div className="mt-6">
        <DirectoryFilters
          action="/miembros"
          filters={filters}
          searchLabel="Buscar miembros"
          searchPlaceholder="Nombre, empresa, servicio…"
          selects={[
            { name: "specialty", label: "Especialidad", allLabel: "Todas", options: distinctValues(allProfiles.map((profile) => profile.specialty)) },
            { name: "sector", label: "Giro", allLabel: "Todos", options: distinctValues(companies.map((company) => company.sector)) },
            {
              name: "municipality",
              label: "Municipio",
              allLabel: "Todos",
              options: distinctValues([...allProfiles.map((profile) => profile.municipality), ...companies.map((company) => company.municipality)]),
            },
          ]}
        />
      </div>

      {!myProfile ? (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl bg-brand-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-orange">
              <UserRoundPlusIcon className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-xl uppercase">Aún no tienes perfil</h2>
              <p className="mt-1 text-sm text-white/75">Preséntate para que los demás miembros sepan quién eres y a qué te dedicas.</p>
            </div>
          </div>
          <Link href="/mi-perfil" className={buttonVariants({ variant: "accent", size: "lg" })}>
            Crear mi perfil
            <ArrowRightIcon data-icon="inline-end" aria-hidden />
          </Link>
        </div>
      ) : null}

      {profiles.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const company = companiesByUser.get(profile.user_id)?.[0]
            return (
            <li key={profile.user_id} className="min-w-0">
              <Link
                href={`/miembros/${profile.user_id}`}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-brand-blue/10 bg-white p-5 shadow-sm transition-[box-shadow,border-color,translate] hover:-translate-y-0.5 hover:border-brand-blue/25 hover:shadow-lg hover:shadow-brand-blue/5"
              >
                <div className="flex items-center gap-4">
                  <MemberAvatar name={profile.full_name} photoUrl={getProfilePhotoUrl(profile.photo_path)} size={60} />
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-lg font-semibold text-brand-blue uppercase group-hover:text-brand-orange">
                      {profile.full_name}
                    </h2>
                    {profile.specialty ? <p className="truncate text-sm text-muted-foreground">{profile.specialty}</p> : null}
                  </div>
                </div>
                {profile.headline ? <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">{profile.headline}</p> : null}
                <div className="mt-auto flex flex-col gap-1.5 text-sm text-foreground/70">
                  {company ? (
                    <span className="flex items-center gap-2">
                      <BriefcaseBusinessIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
                      <span className="truncate">{[company.job_title, company.name].filter(Boolean).join(" · ")}</span>
                    </span>
                  ) : null}
                  {profile.municipality ? (
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
                      <span className="truncate">{profile.municipality}</span>
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
            )
          })}
        </ul>
      ) : (
        <Empty className="mt-8 rounded-3xl border border-brand-blue/20 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-full bg-brand-blue/10 text-brand-blue [&_svg:not([class*='size-'])]:size-6">
              {isFiltered ? <SearchXIcon aria-hidden /> : <UsersRoundIcon aria-hidden />}
            </EmptyMedia>
            <EmptyTitle className="font-heading text-xl text-brand-blue uppercase">
              {isFiltered ? "Sin resultados" : "El directorio está por llenarse"}
            </EmptyTitle>
            <EmptyDescription>
              {isFiltered ? "Nadie coincide con esos filtros. Prueba con otros." : "Sé de los primeros en crear tu perfil."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={isFiltered ? "/miembros" : "/mi-perfil"} className={buttonVariants({ variant: "outline" })}>
              {isFiltered ? "Ver a todos" : "Crear mi perfil"}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
