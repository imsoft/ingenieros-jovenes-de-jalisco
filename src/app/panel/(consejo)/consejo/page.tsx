import type { Metadata } from "next"
import Link from "next/link"
import { EyeIcon, EyeOffIcon, MailIcon, ShieldCheckIcon, UserRoundXIcon } from "lucide-react"
import { cn } from "cn"

import { actualizarIntegrante, cancelarInvitacion, moderarPerfil } from "@/acciones/consejo"
import { BotonConfirmar } from "@/components/panel/boton-confirmar"
import { FormularioConsejo } from "@/components/panel/formulario-consejo"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { listarConsejo, listarPerfilesModerados, type IntegranteConsejo } from "@/lib/panel/consejo"
import { descripcionRoles } from "@/lib/panel/roles"
import { exigirAdminConsejo } from "@/lib/panel/sesion"

export const metadata: Metadata = { title: "Consejo" }

const formatoFecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" })

export default async function PaginaConsejo() {
  const admin = await exigirAdminConsejo()
  const [integrantes, moderados] = await Promise.all([listarConsejo(), listarPerfilesModerados()])

  const activos = integrantes.filter((integrante) => integrante.estado === "activo")
  const invitados = integrantes.filter((integrante) => integrante.estado === "invitado")
  const bajas = integrantes.filter((integrante) => integrante.estado === "baja")

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">Consejo</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Quién tiene acceso al panel y con qué rol. Solo los administradores ven esta sección.
        </p>
      </div>

      <section aria-labelledby="titulo-agregar" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10 sm:p-8">
        <h2 id="titulo-agregar" className="font-heading text-xl font-semibold text-azul uppercase">
          Agregar integrante
        </h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Si ya tiene cuenta, entra de inmediato. Si no, queda invitado y entra al crear su cuenta con ese correo.
        </p>
        <FormularioConsejo />
      </section>

      <section aria-labelledby="titulo-activos">
        <TituloSeccion id="titulo-activos" titulo="Integrantes" total={activos.length} />
        <ul className="mt-4 flex flex-col gap-3">
          {activos.map((integrante) => (
            <FilaIntegrante key={integrante.correo} integrante={integrante} esYo={integrante.usuario_id === admin.usuarioId} />
          ))}
        </ul>
      </section>

      {invitados.length > 0 ? (
        <section aria-labelledby="titulo-invitados">
          <TituloSeccion
            id="titulo-invitados"
            titulo="Invitaciones pendientes"
            total={invitados.length}
            descripcion="Aún no crean su cuenta. Entrarán al Consejo al registrarse con ese correo."
          />
          <ul className="mt-4 flex flex-col gap-3">
            {invitados.map((integrante) => (
              <li key={integrante.correo} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-azul/10 sm:flex-row sm:items-center sm:justify-between">
                <Datos integrante={integrante} />
                <BotonConfirmar
                  accion={cancelarInvitacion.bind(null, integrante.correo)}
                  titulo="¿Cancelar la invitación?"
                  descripcion={`${integrante.correo} ya no podrá entrar al Consejo al crear su cuenta.`}
                  textoConfirmar="Cancelar invitación"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-destructive"
                >
                  Cancelar invitación
                </BotonConfirmar>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bajas.length > 0 ? (
        <section aria-labelledby="titulo-bajas">
          <TituloSeccion id="titulo-bajas" titulo="Dados de baja" total={bajas.length} descripcion="Ya no tienen acceso al panel. Su historial de revisiones se conserva." />
          <ul className="mt-4 flex flex-col gap-3">
            {bajas.map((integrante) => (
              <li key={integrante.correo} className="flex flex-col gap-3 rounded-2xl bg-white/60 p-4 ring-1 ring-azul/10 sm:flex-row sm:items-center sm:justify-between">
                <Datos integrante={integrante} />
                <BotonConfirmar
                  accion={actualizarIntegrante.bind(null, integrante.usuario_id ?? "", integrante.rol, true)}
                  titulo={`¿Reactivar a ${integrante.nombre}?`}
                  descripcion={`Volverá a tener acceso al panel como ${descripcionRoles[integrante.rol].nombre.toLowerCase()}.`}
                  textoConfirmar="Reactivar"
                  variantConfirmar="default"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                >
                  Reactivar
                </BotonConfirmar>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="titulo-moderados">
        <TituloSeccion
          id="titulo-moderados"
          titulo="Perfiles ocultos por moderación"
          total={moderados.length}
          descripcion="Perfiles que un administrador ocultó del directorio. Sus dueños no pueden volver a mostrarlos."
        />
        {moderados.length === 0 ? (
          <Empty className="mt-4 rounded-2xl bg-white ring-1 ring-azul/10">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-azul/10 text-azul">
                <EyeOffIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>No hay perfiles ocultos</EmptyTitle>
              <EmptyDescription>Para ocultar uno, ábrelo desde el directorio de miembros.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {moderados.map((perfil) => (
              <li key={perfil.usuario_id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-azul/10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{perfil.nombre}</p>
                  <p className="text-sm text-muted-foreground">Oculto desde el {formatoFecha.format(new Date(perfil.updated_at))}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/miembros/${perfil.usuario_id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-azul hover:bg-secondary"
                  >
                    <EyeIcon className="size-4" aria-hidden />
                    Ver perfil
                  </Link>
                  <BotonConfirmar
                    accion={moderarPerfil.bind(null, perfil.usuario_id, false)}
                    titulo={`¿Mostrar de nuevo a ${perfil.nombre}?`}
                    descripcion="Su perfil volverá a aparecer en el directorio de miembros (si su dueño lo tiene visible)."
                    textoConfirmar="Restaurar"
                    variantConfirmar="default"
                    variant="outline"
                    size="sm"
                  >
                    Restaurar
                  </BotonConfirmar>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function TituloSeccion({ id, titulo, total, descripcion }: { id: string; titulo: string; total: number; descripcion?: string }) {
  return (
    <>
      <h2 id={id} className="flex items-center gap-3 font-heading text-xl font-semibold text-azul uppercase">
        {titulo}
        <span className="rounded-full bg-white px-2.5 py-0.5 font-sans text-sm font-medium text-muted-foreground tabular-nums ring-1 ring-azul/10">
          {total}
        </span>
      </h2>
      {descripcion ? <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p> : null}
    </>
  )
}

function Datos({ integrante, esYo = false }: { integrante: IntegranteConsejo; esYo?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        {integrante.nombre}
        {esYo ? <span className="text-sm font-normal text-muted-foreground">(tú)</span> : null}
        <Badge className={cn("h-6 px-2.5", integrante.rol === "admin" ? "bg-naranja/15 text-foreground" : "bg-azul/10 text-azul")}>
          {integrante.rol === "admin" ? <ShieldCheckIcon data-icon="inline-start" aria-hidden /> : null}
          {descripcionRoles[integrante.rol].nombre}
        </Badge>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
        <MailIcon className="size-3.5 shrink-0" aria-hidden />
        {integrante.correo}
      </p>
    </div>
  )
}

function FilaIntegrante({ integrante, esYo }: { integrante: IntegranteConsejo; esYo: boolean }) {
  const usuarioId = integrante.usuario_id ?? ""
  const otroRol = integrante.rol === "admin" ? "revisor" : "admin"

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-azul/10 sm:flex-row sm:items-center sm:justify-between">
      <Datos integrante={integrante} esYo={esYo} />
      <div className="flex flex-wrap gap-2">
        <BotonConfirmar
          accion={actualizarIntegrante.bind(null, usuarioId, otroRol, true)}
          titulo={`¿Hacer ${descripcionRoles[otroRol].nombre.toLowerCase()} a ${esYo ? "ti mismo" : integrante.nombre}?`}
          descripcion={descripcionRoles[otroRol].resumen}
          textoConfirmar="Cambiar rol"
          variantConfirmar="default"
          variant="outline"
          size="sm"
        >
          Hacer {descripcionRoles[otroRol].nombre.toLowerCase()}
        </BotonConfirmar>
        <BotonConfirmar
          accion={actualizarIntegrante.bind(null, usuarioId, integrante.rol, false)}
          titulo={`¿Dar de baja a ${esYo ? "ti mismo" : integrante.nombre}?`}
          descripcion="Perderá el acceso al panel de inmediato. Su historial de revisiones se conserva y puedes reactivarlo después."
          textoConfirmar="Dar de baja"
          variant="ghost"
          size="sm"
          className="text-destructive"
        >
          <UserRoundXIcon data-icon="inline-start" aria-hidden />
          Dar de baja
        </BotonConfirmar>
      </div>
    </li>
  )
}
