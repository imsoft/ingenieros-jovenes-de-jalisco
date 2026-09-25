import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRightIcon, Trash2Icon } from "lucide-react"

import { deleteMyAccount } from "@/actions/account"
import { ProfileForm } from "@/components/members/profile-form"
import { ConfirmButton } from "@/components/panel/confirm-button"
import { Notice } from "@/components/site/notice"
import { getProfile, getProfilePhotoUrl } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"

export const metadata: Metadata = { title: "Mi perfil" }

export default async function MyProfilePage() {
  const member = await requireMember("/mi-perfil")
  const profile = await getProfile(member.userId)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-widest text-brand-orange uppercase">Red de miembros</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">
            {profile ? "Mi perfil" : "Crea tu perfil"}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {profile
              ? "Mantén tu información al día para que otros miembros sepan a qué te dedicas."
              : "Preséntate con el Colectivo: quién eres, a qué te dedicas y dónde trabajas."}
          </p>
        </div>
        {profile ? (
          <Link
            href={`/miembros/${member.userId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue underline-offset-4 hover:underline"
          >
            Ver cómo se ve
            <ArrowUpRightIcon className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {profile?.is_suspended ? (
        <Notice variant="warning" className="mt-6">
          El Consejo ocultó tu perfil del directorio. Puedes seguir editándolo; si crees que es un error, escríbele al Consejo.
        </Notice>
      ) : null}

      <div className="mt-8 rounded-3xl border border-brand-blue/10 bg-white p-5 shadow-sm sm:p-8">
        <ProfileForm
          isNew={!profile}
          initialPhotoUrl={getProfilePhotoUrl(profile?.photo_path ?? null)}
          values={{
            fullName: profile?.full_name ?? member.suggestedName,
            headline: profile?.headline ?? "",
            specialty: profile?.specialty ?? "",
            company: profile?.company ?? "",
            jobTitle: profile?.job_title ?? "",
            municipality: profile?.municipality ?? "",
            bio: profile?.bio ?? "",
            linkedinUrl: profile?.linkedin_url ?? "",
            instagramHandle: profile?.instagram_handle ?? "",
            websiteUrl: profile?.website_url ?? "",
            isVisible: profile?.is_visible ?? true,
            photoPath: profile?.photo_path ?? "",
          }}
        />
      </div>

      <section aria-labelledby="delete-account-title" className="mt-10 rounded-3xl p-5 ring-1 ring-destructive/20 sm:p-8">
        <h2 id="delete-account-title" className="font-heading text-lg font-semibold text-destructive uppercase">
          Eliminar mi cuenta
        </h2>
        <p className="mt-1 mb-4 max-w-xl text-sm text-muted-foreground">
          Borra tu cuenta, tu perfil y tu foto de forma permanente. Tu afiliación al Colectivo no cambia: podrás crear una
          cuenta nueva cuando quieras.
        </p>
        <ConfirmButton
          action={deleteMyAccount}
          title="¿Eliminar tu cuenta?"
          description="Se borrarán tu cuenta, tu perfil y tu foto. Esta acción no se puede deshacer."
          confirmLabel="Eliminar mi cuenta"
          variant="outline"
          size="lg"
          className="h-10 text-destructive"
        >
          <Trash2Icon data-icon="inline-start" aria-hidden />
          Eliminar mi cuenta
        </ConfirmButton>
      </section>
    </div>
  )
}

