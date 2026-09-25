import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { CompanyForm } from "@/components/members/company-form"
import { listCompaniesForUser } from "@/lib/members/companies"
import { getProfile } from "@/lib/members/profiles"
import { requireMember } from "@/lib/members/session"
import { MAX_COMPANIES } from "@/lib/validations/company"

export const metadata: Metadata = { title: "Agregar empresa" }

export default async function NewCompanyPage() {
  const member = await requireMember("/mi-perfil/empresas/nueva")
  const [profile, companies] = await Promise.all([getProfile(member.userId), listCompaniesForUser(member.userId)])
  if (!profile || companies.length >= MAX_COMPANIES) redirect("/mi-perfil")

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Link href="/mi-perfil" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue underline-offset-4 hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Mi perfil
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Agregar empresa</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Donde trabajas, tu negocio o tu proyecto independiente.</p>
      <div className="mt-8 rounded-3xl border border-brand-blue/10 bg-white p-5 shadow-sm sm:p-8">
        <CompanyForm
          companyId={null}
          initialLogoUrl={null}
          values={{ name: "", role: "employee", jobTitle: "", sector: "", description: "", services: "", municipality: profile.municipality ?? "", websiteUrl: "", logoPath: "" }}
        />
      </div>
    </div>
  )
}
