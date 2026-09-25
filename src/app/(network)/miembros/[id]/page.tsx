import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, BriefcaseBusinessIcon, EyeIcon, EyeOffIcon, GlobeIcon, MapPinIcon, PencilIcon } from "lucide-react"

import { moderateProfile } from "@/actions/board"
import { ConfirmButton } from "@/components/panel/confirm-button"
import { Notice } from "@/components/site/notice"
import { MemberAvatar } from "@/components/members/member-avatar"
import { InstagramIcon } from "@/components/site/social-icons"
import { buttonVariants } from "@/components/ui/button"
import { getProfile, getProfilePhotoUrl } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export const metadata: Metadata = { title: "Perfil de miembro" }

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

export default async function MemberProfilePage({ params }: PageProps<"/miembros/[id]">) {
  const { id } = await params
  const member = await requireMember(`/miembros/${id}`)
  if (!isUuid(id)) notFound()

  const profile = await getProfile(id)
  if (!profile) notFound()

  const isOwn = profile.user_id === member.userId
  const links = [
    profile.linkedin_url ? { href: profile.linkedin_url, label: "LinkedIn", icon: LinkedInIcon } : null,
    profile.instagram_handle
      ? { href: `https://www.instagram.com/${profile.instagram_handle}`, label: `@${profile.instagram_handle}`, icon: InstagramIcon }
      : null,
    profile.website_url
      ? { href: profile.website_url, label: profile.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), icon: GlobeIcon }
      : null,
  ].filter((link) => link !== null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Link href="/miembros" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue underline-offset-4 hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Directorio
      </Link>

      <article className="mt-6 overflow-hidden rounded-3xl border border-brand-blue/10 bg-white shadow-sm">
        <div className="h-28 bg-brand-navy sm:h-32" aria-hidden />
        <div className="px-5 pb-8 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <MemberAvatar
              name={profile.full_name}
              photoUrl={getProfilePhotoUrl(profile.photo_path)}
              size={112}
              priority
              className="ring-4 ring-white"
            />
            {isOwn ? (
              <Link href="/mi-perfil" className={buttonVariants({ variant: "outline" })}>
                <PencilIcon data-icon="inline-start" aria-hidden />
                Editar perfil
              </Link>
            ) : member.isBoardAdmin ? (
              profile.is_suspended ? (
                <ConfirmButton
                  action={moderateProfile.bind(null, profile.user_id, false)}
                  title="¿Mostrar de nuevo este perfil?"
                  description="Volverá a aparecer en el directorio de miembros (si su dueño lo tiene visible)."
                  confirmLabel="Restaurar"
                  confirmVariant="default"
                  variant="outline"
                >
                  <EyeIcon data-icon="inline-start" aria-hidden />
                  Restaurar en el directorio
                </ConfirmButton>
              ) : (
                <ConfirmButton
                  action={moderateProfile.bind(null, profile.user_id, true)}
                  title="¿Ocultar este perfil del directorio?"
                  description="Úsalo para contenido inapropiado. Su dueño lo seguirá viendo y editando, pero no podrá volver a mostrarlo. Lo puedes restaurar desde Panel → Consejo."
                  confirmLabel="Ocultar perfil"
                  variant="ghost"
                  className="text-destructive"
                >
                  <EyeOffIcon data-icon="inline-start" aria-hidden />
                  Ocultar (moderación)
                </ConfirmButton>
              )
            ) : null}
          </div>

          {profile.is_suspended ? (
            <Notice variant="warning" className="mt-4">
              {isOwn
                ? "El Consejo ocultó tu perfil del directorio. Si crees que es un error, escríbele al Consejo."
                : "Oculto del directorio por moderación. Solo los administradores y su dueño lo ven."}
            </Notice>
          ) : null}

          {isOwn && !profile.is_visible ? (
            <Notice variant="warning" className="mt-4">
              Tu perfil está oculto del directorio. Solo tú lo ves.
            </Notice>
          ) : null}

          <h1 className="mt-4 font-heading text-3xl font-bold text-brand-blue uppercase">{profile.full_name}</h1>
          {profile.specialty ? <p className="mt-1 text-lg text-brand-orange">{profile.specialty}</p> : null}
          {profile.headline ? <p className="mt-3 text-lg leading-relaxed text-foreground/85">{profile.headline}</p> : null}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-foreground/75">
            {profile.company || profile.job_title ? (
              <span className="flex items-center gap-2">
                <BriefcaseBusinessIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
                {[profile.job_title, profile.company].filter(Boolean).join(" en ")}
              </span>
            ) : null}
            {profile.municipality ? (
              <span className="flex items-center gap-2">
                <MapPinIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
                {profile.municipality}, Jalisco
              </span>
            ) : null}
          </div>

          {profile.bio ? (
            <section className="mt-8 border-t border-brand-blue/10 pt-6">
              <h2 className="font-heading text-lg text-brand-blue uppercase">Sobre mí</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-foreground/85">{profile.bio}</p>
            </section>
          ) : null}

          {links.length > 0 ? (
            <section className="mt-8 border-t border-brand-blue/10 pt-6">
              <h2 className="font-heading text-lg text-brand-blue uppercase">Contacto</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {links.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-brand-blue/15 px-4 text-sm font-medium text-brand-blue transition-colors hover:border-brand-blue/40 hover:bg-secondary"
                    >
                      <Icon className="size-4" />
                      <span className="max-w-56 truncate">{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>
    </div>
  )
}
