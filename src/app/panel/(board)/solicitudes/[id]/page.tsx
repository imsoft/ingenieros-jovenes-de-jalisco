import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CheckIcon, MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react"
import { cn } from "cn"

import { ReviewForm } from "@/components/panel/review-form"
import { ApplicationStatusBadge } from "@/components/panel/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { getApplication } from "@/lib/panel/applications"
import { formatDate, getFirstName, getWhatsAppLink } from "@/lib/panel/format"
import { applicationStatusLabels } from "@/lib/panel/statuses"

export const metadata: Metadata = { title: "Detalle de solicitud" }

export default async function ApplicationDetailPage({ params }: PageProps<"/panel/solicitudes/[id]">) {
  const { id } = await params
  const result = await getApplication(id)
  if (!result) notFound()

  const { application, reviewerName } = result
  const emailSubject = encodeURIComponent("Tu solicitud al Colectivo de Ingenieros Jóvenes de Jalisco")

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/panel/solicitudes?status=${application.status}`}
        className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver a {applicationStatusLabels[application.status].plural.toLowerCase()}
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold break-words text-brand-blue uppercase sm:text-4xl">{application.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recibida el {formatDate(application.created_at)}</p>
        </div>
        <ApplicationStatusBadge status={application.status} className="h-7 text-sm" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="applicant-heading" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10 sm:p-8">
          <h2 id="applicant-heading" className="font-heading text-xl font-semibold text-brand-blue uppercase">
            Datos del solicitante
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Correo">
              <a href={`mailto:${application.email}`} className="break-all text-brand-blue hover:underline">
                {application.email}
              </a>
            </DetailItem>
            <DetailItem label="Teléfono / WhatsApp">
              <a href={`tel:${application.phone}`} className="text-brand-blue tabular-nums hover:underline">
                {application.phone}
              </a>
            </DetailItem>
            <DetailItem label="Municipio">{application.municipality}</DetailItem>
            <DetailItem label="Confirmaciones">
              <ul className="flex flex-col gap-1 text-sm">
                <Confirmation checked={application.confirms_legal_age}>Mayor de 18 años</Confirmation>
                <Confirmation checked={application.accepts_privacy_notice}>Aceptó el aviso de privacidad</Confirmation>
              </ul>
            </DetailItem>
          </dl>

          <div className="mt-7 flex flex-col gap-2 border-t border-brand-blue/10 pt-6 sm:flex-row">
            <a
              href={getWhatsAppLink(application.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "accent", size: "xl" }), "sm:flex-1")}
            >
              <MessageCircleIcon data-icon="inline-start" aria-hidden />
              WhatsApp
            </a>
            <a
              href={`mailto:${application.email}?subject=${emailSubject}`}
              className={cn(buttonVariants({ variant: "outline", size: "xl" }), "sm:flex-1")}
            >
              <MailIcon data-icon="inline-start" aria-hidden />
              Escribir correo
            </a>
            <a href={`tel:${application.phone}`} className={cn(buttonVariants({ variant: "outline", size: "xl" }), "sm:flex-1")}>
              <PhoneIcon data-icon="inline-start" aria-hidden />
              Llamar
            </a>
          </div>
        </section>

        <section aria-labelledby="review-heading" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10 sm:p-8">
          <h2 id="review-heading" className="font-heading text-xl font-semibold text-brand-blue uppercase">
            Revisión
          </h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">
            {application.status === "pending" || !application.reviewed_at
              ? `Decide si ${getFirstName(application.full_name)} se integra al Colectivo.`
              : `${applicationStatusLabels[application.status].singular} por ${reviewerName ?? "un integrante del Consejo"} el ${formatDate(application.reviewed_at)}`}
          </p>
          <ReviewForm id={application.id} currentStatus={application.status} notes={application.board_notes} />
        </section>
      </div>
    </div>
  )
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Confirmation({ checked, children }: { checked: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2", !checked && "text-destructive")}>
      <CheckIcon className="size-4 shrink-0" aria-hidden />
      {children}
    </li>
  )
}
