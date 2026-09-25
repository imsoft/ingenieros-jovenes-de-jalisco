import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { z } from "zod"

import { CompanyForm } from "@/components/members/company-form"
import { getCompanyLogoUrl, getOwnCompany } from "@/lib/members/companies"
import { requireMember } from "@/lib/members/session"

export const metadata: Metadata = { title: "Editar empresa" }

export default async function EditCompanyPage({ params }: PageProps<"/mi-perfil/empresas/[id]">) {
  const { id } = await params
  const member = await requireMember(`/mi-perfil/empresas/${id}`)
  if (!z.uuid().safeParse(id).success) notFound()
  const company = await getOwnCompany(member.userId, id)
  if (!company) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Link href="/mi-perfil" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue underline-offset-4 hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Mi perfil
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Editar empresa</h1>
      <div className="mt-8 rounded-3xl border border-brand-blue/10 bg-white p-5 shadow-sm sm:p-8">
        <CompanyForm
          companyId={company.id}
          initialLogoUrl={getCompanyLogoUrl(company.logo_path)}
          values={{
            name: company.name,
            role: company.role,
            jobTitle: company.job_title ?? "",
            sector: company.sector ?? "",
            description: company.description ?? "",
            services: company.services,
            municipality: company.municipality ?? "",
            address: company.address ?? "",
            websiteUrl: company.website_url ?? "",
            linkedinUrl: company.linkedin_url ?? "",
            instagramHandle: company.instagram_handle ?? "",
            facebookUrl: company.facebook_url ?? "",
            logoPath: company.logo_path ?? "",
          }}
        />
      </div>
    </div>
  )
}
