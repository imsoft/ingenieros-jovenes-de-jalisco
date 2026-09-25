import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRightIcon, Building2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { deleteMyAccount } from "@/actions/account"
import { deleteCompany } from "@/actions/company"
import { CompanyCard } from "@/components/members/company-card"
import { ProfileForm } from "@/components/members/profile-form"
import { ConfirmButton } from "@/components/panel/confirm-button"
import { Notice } from "@/components/site/notice"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { getCompanyLogoUrl, getContact, listCompaniesForUser } from "@/lib/members/companies"
import { getProfile, getProfilePhotoUrl } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"
import { MAX_COMPANIES } from "@/lib/validations/company"

const notices: Record<string, string> = {
  "company-added": "Empresa agregada a tu perfil.",
  "company-updated": "Empresa actualizada.",
}

export const metadata: Metadata = { title: "Mi perfil" }

export default async function MyProfilePage({ searchParams }: PageProps<"/mi-perfil">) {
  const member = await requireMember("/mi-perfil")
  const [profile, contact, companies, { notice }] = await Promise.all([
    getProfile(member.userId),
    getContact(member.userId),
    listCompaniesForUser(member.userId),
    searchParams,
  ])
  const noticeMessage = typeof notice === "string" ? notices[notice] : undefined

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

      {noticeMessage ? (
        <Notice variant="success" className="mt-6">
          {noticeMessage}
        </Notice>
      ) : null}

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
            municipality: profile?.municipality ?? "",
            bio: profile?.bio ?? "",
            linkedinUrl: profile?.linkedin_url ?? "",
            instagramHandle: profile?.instagram_handle ?? "",
            websiteUrl: profile?.website_url ?? "",
            isVisible: profile?.is_visible ?? true,
            photoPath: profile?.photo_path ?? "",
            whatsapp: contact?.whatsapp ?? "",
            contactEmail: contact?.email ?? member.email ?? "",
            showContact: contact?.is_visible ?? false,
          }}
        />
      </div>

      <section aria-labelledby="companies-title" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="companies-title" className="font-heading text-2xl font-bold text-brand-blue uppercase">
              Mis empresas y emprendimientos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Donde trabajas, tus negocios o proyectos independientes. Hasta {MAX_COMPANIES}.
            </p>
          </div>
          {profile && companies.length < MAX_COMPANIES ? (
            <Link href="/mi-perfil/empresas/nueva" className={cn(buttonVariants({ variant: "outline" }), "h-10")}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              Agregar empresa
            </Link>
          ) : null}
        </div>

        {companies.length > 0 ? (
          <ul className="mt-5 grid grid-cols-1 gap-4">
            {companies.map((company) => (
              <li key={company.id} className="min-w-0">
                <CompanyCard
                  company={{ ...company, logoUrl: getCompanyLogoUrl(company.logo_path) }}
                  actions={
                    <>
                      <Link
                        href={`/mi-perfil/empresas/${company.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                        aria-label={`Editar ${company.name}`}
                      >
                        <PencilIcon aria-hidden />
                      </Link>
                      <ConfirmButton
                        action={deleteCompany.bind(null, company.id)}
                        title={`¿Eliminar ${company.name}?`}
                        description="Se quitará de tu perfil junto con su logo. Esta acción no se puede deshacer."
                        confirmLabel="Eliminar empresa"
                        ariaLabel={`Eliminar ${company.name}`}
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                      >
                        <Trash2Icon aria-hidden />
                      </ConfirmButton>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-5 rounded-2xl border border-brand-blue/15 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-brand-blue/10 text-brand-blue">
                <Building2Icon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{profile ? "Aún no agregas empresas" : "Primero crea tu perfil"}</EmptyTitle>
              <EmptyDescription>
                {profile
                  ? "Agrega dónde trabajas o tu emprendimiento para que otros miembros te encuentren por giro y servicios."
                  : "Guarda tu perfil y después podrás agregar tus empresas y emprendimientos."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

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

