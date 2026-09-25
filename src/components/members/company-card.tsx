import Image from "next/image"
import { BriefcaseBusinessIcon, Building2Icon, GlobeIcon, MapPinIcon } from "lucide-react"
import { cn } from "cn"

import { companyRoleLabels, type CompanyRole } from "@/lib/validations/company"

export type CompanyCardData = {
  name: string
  role?: CompanyRole
  job_title?: string | null
  sector: string | null
  description: string | null
  services: string[]
  municipality: string | null
  website_url: string | null
  logoUrl: string | null
}

export function CompanyLogo({ logoUrl, size = 56, className }: { logoUrl: string | null; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary ring-1 ring-brand-blue/10", className)}
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt="" fill sizes={`${size * 2}px`} className="object-contain p-1.5" unoptimized={logoUrl.startsWith("blob:")} />
      ) : (
        <Building2Icon className="size-1/2 text-brand-blue/40" aria-hidden />
      )}
    </span>
  )
}

const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")

// A company card as shown on a member's profile (and, with `actions`, on the owner's own profile page).
export function CompanyCard({
  company,
  actions,
  footer,
  headingLevel = "h3",
}: {
  company: CompanyCardData
  actions?: React.ReactNode
  footer?: React.ReactNode
  headingLevel?: "h2" | "h3"
}) {
  const Heading = headingLevel
  const relation = [company.role ? companyRoleLabels[company.role] : null, company.job_title].filter(Boolean).join(" · ")

  return (
    <article className="flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-brand-blue/10 bg-white p-5">
      <div className="flex items-start gap-4">
        <CompanyLogo logoUrl={company.logoUrl} />
        <div className="min-w-0 flex-1">
          <Heading className="font-heading text-lg leading-tight font-semibold text-brand-blue uppercase">{company.name}</Heading>
          {relation ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/75">
              <BriefcaseBusinessIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
              {relation}
            </p>
          ) : null}
          {company.sector ? <p className="mt-0.5 text-sm text-muted-foreground">{company.sector}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-1">{actions}</div> : null}
      </div>

      {company.description ? <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">{company.description}</p> : null}

      {company.services.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={`Servicios de ${company.name}`}>
          {company.services.map((service) => (
            <li key={service} className="rounded-full bg-brand-blue/5 px-3 py-1 text-xs font-medium text-brand-blue">
              {service}
            </li>
          ))}
        </ul>
      ) : null}

      {company.municipality || company.website_url ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-foreground/75">
          {company.municipality ? (
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="size-4 shrink-0 text-brand-orange" aria-hidden />
              {company.municipality}
            </span>
          ) : null}
          {company.website_url ? (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex min-w-0 items-center gap-1.5 font-medium text-brand-blue hover:underline"
            >
              <GlobeIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{displayUrl(company.website_url)}</span>
            </a>
          ) : null}
        </div>
      ) : null}

      {footer ? <div className="-mx-5 mt-auto -mb-5 border-t border-brand-blue/10 bg-secondary/40 px-5 py-4">{footer}</div> : null}
    </article>
  )
}
