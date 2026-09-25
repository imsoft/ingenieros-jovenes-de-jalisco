import type { Metadata } from "next"
import Link from "next/link"
import { EyeIcon, EyeOffIcon, MailIcon, ShieldCheckIcon, UserRoundXIcon } from "lucide-react"
import { cn } from "cn"

import { cancelBoardInvitation, moderateProfile, updateBoardMember } from "@/actions/board"
import { BoardMemberForm } from "@/components/panel/board-member-form"
import { ConfirmButton } from "@/components/panel/confirm-button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { listBoard, listModeratedProfiles, type BoardMemberListing } from "@/lib/panel/board"
import { roleDescriptions } from "@/lib/panel/roles"
import { requireBoardAdmin } from "@/lib/panel/session"

export const metadata: Metadata = { title: "Consejo" }

const dateFormat = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" })

export default async function BoardPage() {
  const admin = await requireBoardAdmin()
  const [boardMembers, moderatedProfiles] = await Promise.all([listBoard(), listModeratedProfiles()])

  const activeMembers = boardMembers.filter((boardMember) => boardMember.status === "active")
  const invitedMembers = boardMembers.filter((boardMember) => boardMember.status === "invited")
  const inactiveMembers = boardMembers.filter((boardMember) => boardMember.status === "inactive")

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Consejo</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Quién tiene acceso al panel y con qué rol. Solo los administradores ven esta sección.
        </p>
      </div>

      <section aria-labelledby="add-heading" className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10 sm:p-8">
        <h2 id="add-heading" className="font-heading text-xl font-semibold text-brand-blue uppercase">
          Agregar integrante
        </h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Si ya tiene cuenta, entra de inmediato. Si no, queda invitado y entra al crear su cuenta con ese correo.
        </p>
        <BoardMemberForm />
      </section>

      <section aria-labelledby="active-heading">
        <SectionTitle id="active-heading" title="Integrantes" total={activeMembers.length} />
        <ul className="mt-4 flex flex-col gap-3">
          {activeMembers.map((boardMember) => (
            <BoardMemberRow key={boardMember.email} boardMember={boardMember} isSelf={boardMember.user_id === admin.userId} />
          ))}
        </ul>
      </section>

      {invitedMembers.length > 0 ? (
        <section aria-labelledby="invited-heading">
          <SectionTitle
            id="invited-heading"
            title="Invitaciones pendientes"
            total={invitedMembers.length}
            description="Aún no crean su cuenta. Entrarán al Consejo al registrarse con ese correo."
          />
          <ul className="mt-4 flex flex-col gap-3">
            {invitedMembers.map((boardMember) => (
              <li key={boardMember.email} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-blue/10 sm:flex-row sm:items-center sm:justify-between">
                <MemberDetails boardMember={boardMember} />
                <ConfirmButton
                  action={cancelBoardInvitation.bind(null, boardMember.email)}
                  title="¿Cancelar la invitación?"
                  description={`${boardMember.email} ya no podrá entrar al Consejo al crear su cuenta.`}
                  confirmLabel="Cancelar invitación"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-destructive"
                >
                  Cancelar invitación
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {inactiveMembers.length > 0 ? (
        <section aria-labelledby="inactive-heading">
          <SectionTitle id="inactive-heading" title="Dados de baja" total={inactiveMembers.length} description="Ya no tienen acceso al panel. Su historial de revisiones se conserva." />
          <ul className="mt-4 flex flex-col gap-3">
            {inactiveMembers.map((boardMember) => (
              <li key={boardMember.email} className="flex flex-col gap-3 rounded-2xl bg-white/60 p-4 ring-1 ring-brand-blue/10 sm:flex-row sm:items-center sm:justify-between">
                <MemberDetails boardMember={boardMember} />
                <ConfirmButton
                  action={updateBoardMember.bind(null, boardMember.user_id ?? "", boardMember.role, true)}
                  title={`¿Reactivar a ${boardMember.full_name}?`}
                  description={`Volverá a tener acceso al panel como ${roleDescriptions[boardMember.role].name.toLowerCase()}.`}
                  confirmLabel="Reactivar"
                  confirmVariant="default"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                >
                  Reactivar
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="moderated-heading">
        <SectionTitle
          id="moderated-heading"
          title="Perfiles ocultos por moderación"
          total={moderatedProfiles.length}
          description="Perfiles que un administrador ocultó del directorio. Sus dueños no pueden volver a mostrarlos."
        />
        {moderatedProfiles.length === 0 ? (
          <Empty className="mt-4 rounded-2xl bg-white ring-1 ring-brand-blue/10">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-brand-blue/10 text-brand-blue">
                <EyeOffIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No hay perfiles ocultos</EmptyTitle>
              <EmptyDescription>Para ocultar uno, ábrelo desde el directorio de miembros.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {moderatedProfiles.map((profile) => (
              <li key={profile.user_id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-blue/10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">Oculto desde el {dateFormat.format(new Date(profile.updated_at))}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/miembros/${profile.user_id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand-blue hover:bg-secondary"
                  >
                    <EyeIcon className="size-4" aria-hidden />
                    Ver perfil
                  </Link>
                  <ConfirmButton
                    action={moderateProfile.bind(null, profile.user_id, false)}
                    title={`¿Mostrar de nuevo a ${profile.full_name}?`}
                    description="Su perfil volverá a aparecer en el directorio de miembros (si su dueño lo tiene visible)."
                    confirmLabel="Restaurar"
                    confirmVariant="default"
                    variant="outline"
                    size="sm"
                  >
                    Restaurar
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SectionTitle({ id, title, total, description }: { id: string; title: string; total: number; description?: string }) {
  return (
    <>
      <h2 id={id} className="flex items-center gap-3 font-heading text-xl font-semibold text-brand-blue uppercase">
        {title}
        <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-medium text-muted-foreground tabular-nums ring-1 ring-brand-blue/10">
          {total}
        </span>
      </h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </>
  )
}

function MemberDetails({ boardMember, isSelf = false }: { boardMember: BoardMemberListing; isSelf?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        {boardMember.full_name}
        {isSelf ? <span className="text-sm font-normal text-muted-foreground">(tú)</span> : null}
        <Badge className={cn("h-6 px-2.5", boardMember.role === "admin" ? "bg-brand-orange/15 text-foreground" : "bg-brand-blue/10 text-brand-blue")}>
          {boardMember.role === "admin" ? <ShieldCheckIcon data-icon="inline-start" aria-hidden /> : null}
          {roleDescriptions[boardMember.role].name}
        </Badge>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
        <MailIcon className="size-3.5 shrink-0" aria-hidden />
        {boardMember.email}
      </p>
    </div>
  )
}

function BoardMemberRow({ boardMember, isSelf }: { boardMember: BoardMemberListing; isSelf: boolean }) {
  const userId = boardMember.user_id ?? ""
  const otherRole = boardMember.role === "admin" ? "reviewer" : "admin"

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-brand-blue/10 sm:flex-row sm:items-center sm:justify-between">
      <MemberDetails boardMember={boardMember} isSelf={isSelf} />
      <div className="flex flex-wrap gap-2">
        <ConfirmButton
          action={updateBoardMember.bind(null, userId, otherRole, true)}
          title={`¿Hacer ${roleDescriptions[otherRole].name.toLowerCase()} a ${isSelf ? "ti mismo" : boardMember.full_name}?`}
          description={roleDescriptions[otherRole].summary}
          confirmLabel="Cambiar rol"
          confirmVariant="default"
          variant="outline"
          size="sm"
        >
          Hacer {roleDescriptions[otherRole].name.toLowerCase()}
        </ConfirmButton>
        <ConfirmButton
          action={updateBoardMember.bind(null, userId, boardMember.role, false)}
          title={`¿Dar de baja a ${isSelf ? "ti mismo" : boardMember.full_name}?`}
          description="Perderá el acceso al panel de inmediato. Su historial de revisiones se conserva y puedes reactivarlo después."
          confirmLabel="Dar de baja"
          variant="ghost"
          size="sm"
          className="text-destructive"
        >
          <UserRoundXIcon data-icon="inline-start" aria-hidden />
          Dar de baja
        </ConfirmButton>
      </div>
    </li>
  )
}
