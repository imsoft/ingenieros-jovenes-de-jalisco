import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, BriefcaseBusinessIcon, MapPinIcon, SearchIcon, SearchXIcon, UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"

import { MemberAvatar } from "@/components/members/member-avatar"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { getProfile, getProfilePhotoUrl, listDirectory } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"

export const metadata: Metadata = { title: "Directorio de miembros" }

export default async function MembersPage({ searchParams }: PageProps<"/miembros">) {
  const member = await requireMember("/miembros")
  const { q } = await searchParams
  const search = typeof q === "string" ? q.slice(0, 80) : ""

  const [{ profiles, total }, myProfile] = await Promise.all([listDirectory(search), getProfile(member.userId)])

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
        <form role="search" className="w-full md:max-w-sm">
          <label htmlFor="member-search" className="sr-only">
            Buscar miembros
          </label>
          <InputGroup className="h-11 rounded-xl bg-white">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput id="member-search" name="q" type="search" defaultValue={search} placeholder="Nombre, empresa, especialidad…" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="secondary" size="sm" className="rounded-lg">
                Buscar
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
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
          {profiles.map((profile) => (
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
                  {profile.company ? (
                    <span className="flex items-center gap-2">
                      <BriefcaseBusinessIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
                      <span className="truncate">{[profile.job_title, profile.company].filter(Boolean).join(" · ")}</span>
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
          ))}
        </ul>
      ) : (
        <Empty className="mt-8 rounded-3xl border border-brand-blue/20 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-full bg-brand-blue/10 text-brand-blue [&_svg:not([class*='size-'])]:size-6">
              {search ? <SearchXIcon aria-hidden /> : <UsersRoundIcon aria-hidden />}
            </EmptyMedia>
            <EmptyTitle className="font-heading text-xl text-brand-blue uppercase">
              {search ? "Sin resultados" : "El directorio está por llenarse"}
            </EmptyTitle>
            <EmptyDescription>
              {search ? `Nadie coincide con “${search}”. Prueba con otra palabra.` : "Sé de los primeros en crear tu perfil."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={search ? "/miembros" : "/mi-perfil"} className={buttonVariants({ variant: "outline" })}>
              {search ? "Ver a todos" : "Crear mi perfil"}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
