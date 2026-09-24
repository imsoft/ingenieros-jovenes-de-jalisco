import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, BriefcaseBusinessIcon, EyeIcon, EyeOffIcon, GlobeIcon, MapPinIcon, PencilIcon } from "lucide-react"

import { moderarPerfil } from "@/acciones/consejo"
import { BotonConfirmar } from "@/components/panel/boton-confirmar"
import { Aviso } from "@/components/sitio/aviso"
import { AvatarMiembro } from "@/components/miembros/avatar-miembro"
import { IconoInstagram } from "@/components/sitio/iconos-redes"
import { buttonVariants } from "@/components/ui/button"
import { obtenerPerfil, urlFotoPerfil } from "@/lib/miembros/perfiles"
import { exigirMiembro } from "@/lib/miembros/sesion"

const esUuid = (valor: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)

export const metadata: Metadata = { title: "Perfil de miembro" }

function IconoLinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

export default async function PaginaPerfilMiembro({ params }: PageProps<"/miembros/[id]">) {
  const { id } = await params
  const miembro = await exigirMiembro(`/miembros/${id}`)
  if (!esUuid(id)) notFound()

  const perfil = await obtenerPerfil(id)
  if (!perfil) notFound()

  const esPropio = perfil.usuario_id === miembro.usuarioId
  const enlaces = [
    perfil.linkedin_url ? { href: perfil.linkedin_url, etiqueta: "LinkedIn", icono: IconoLinkedIn } : null,
    perfil.instagram
      ? { href: `https://www.instagram.com/${perfil.instagram}`, etiqueta: `@${perfil.instagram}`, icono: IconoInstagram }
      : null,
    perfil.sitio_web
      ? { href: perfil.sitio_web, etiqueta: perfil.sitio_web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), icono: GlobeIcon }
      : null,
  ].filter((enlace) => enlace !== null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <Link href="/miembros" className="inline-flex items-center gap-1.5 text-sm font-medium text-azul underline-offset-4 hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Directorio
      </Link>

      <article className="mt-6 overflow-hidden rounded-3xl border border-azul/10 bg-white shadow-sm">
        <div className="h-28 bg-azul-profundo sm:h-32" aria-hidden />
        <div className="px-5 pb-8 sm:px-8">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <AvatarMiembro
              nombre={perfil.nombre}
              fotoUrl={urlFotoPerfil(perfil.foto_ruta)}
              tamano={112}
              prioridad
              className="ring-4 ring-white"
            />
            {esPropio ? (
              <Link href="/mi-perfil" className={buttonVariants({ variant: "outline" })}>
                <PencilIcon data-icon="inline-start" aria-hidden />
                Editar perfil
              </Link>
            ) : miembro.esAdminConsejo ? (
              perfil.suspendido ? (
                <BotonConfirmar
                  accion={moderarPerfil.bind(null, perfil.usuario_id, false)}
                  titulo="¿Mostrar de nuevo este perfil?"
                  descripcion="Volverá a aparecer en el directorio de miembros (si su dueño lo tiene visible)."
                  textoConfirmar="Restaurar"
                  variantConfirmar="default"
                  variant="outline"
                >
                  <EyeIcon data-icon="inline-start" aria-hidden />
                  Restaurar en el directorio
                </BotonConfirmar>
              ) : (
                <BotonConfirmar
                  accion={moderarPerfil.bind(null, perfil.usuario_id, true)}
                  titulo="¿Ocultar este perfil del directorio?"
                  descripcion="Úsalo para contenido inapropiado. Su dueño lo seguirá viendo y editando, pero no podrá volver a mostrarlo. Lo puedes restaurar desde Panel → Consejo."
                  textoConfirmar="Ocultar perfil"
                  variant="ghost"
                  className="text-destructive"
                >
                  <EyeOffIcon data-icon="inline-start" aria-hidden />
                  Ocultar (moderación)
                </BotonConfirmar>
              )
            ) : null}
          </div>

          {perfil.suspendido ? (
            <Aviso tipo="advertencia" className="mt-4">
              {esPropio
                ? "El Consejo ocultó tu perfil del directorio. Si crees que es un error, escríbele al Consejo."
                : "Oculto del directorio por moderación. Solo los administradores y su dueño lo ven."}
            </Aviso>
          ) : null}

          {esPropio && !perfil.visible ? (
            <Aviso tipo="advertencia" className="mt-4">
              Tu perfil está oculto del directorio. Solo tú lo ves.
            </Aviso>
          ) : null}

          <h1 className="mt-4 font-heading text-3xl font-bold text-azul uppercase">{perfil.nombre}</h1>
          {perfil.especialidad ? <p className="mt-1 text-lg text-naranja">{perfil.especialidad}</p> : null}
          {perfil.ocupacion ? <p className="mt-3 text-lg leading-relaxed text-foreground/85">{perfil.ocupacion}</p> : null}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-foreground/75">
            {perfil.empresa || perfil.puesto ? (
              <span className="flex items-center gap-2">
                <BriefcaseBusinessIcon className="size-4 shrink-0 text-naranja" aria-hidden />
                {[perfil.puesto, perfil.empresa].filter(Boolean).join(" en ")}
              </span>
            ) : null}
            {perfil.municipio ? (
              <span className="flex items-center gap-2">
                <MapPinIcon className="size-4 shrink-0 text-naranja" aria-hidden />
                {perfil.municipio}, Jalisco
              </span>
            ) : null}
          </div>

          {perfil.biografia ? (
            <section className="mt-8 border-t border-azul/10 pt-6">
              <h2 className="font-heading text-lg text-azul uppercase">Sobre mí</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-foreground/85">{perfil.biografia}</p>
            </section>
          ) : null}

          {enlaces.length > 0 ? (
            <section className="mt-8 border-t border-azul/10 pt-6">
              <h2 className="font-heading text-lg text-azul uppercase">Contacto</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {enlaces.map(({ href, etiqueta, icono: Icono }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-azul/15 px-4 text-sm font-medium text-azul transition-colors hover:border-azul/40 hover:bg-secondary"
                    >
                      <Icono className="size-4" />
                      <span className="max-w-56 truncate">{etiqueta}</span>
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
