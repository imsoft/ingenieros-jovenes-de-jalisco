import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, BriefcaseBusinessIcon, MapPinIcon, SearchIcon, SearchXIcon, UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"

import { AvatarMiembro } from "@/components/miembros/avatar-miembro"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { listarDirectorio, obtenerPerfil, urlFotoPerfil } from "@/lib/miembros/perfiles"
import { exigirMiembro } from "@/lib/miembros/sesion"

export const metadata: Metadata = { title: "Directorio de miembros" }

export default async function PaginaMiembros({ searchParams }: PageProps<"/miembros">) {
  const miembro = await exigirMiembro("/miembros")
  const { q } = await searchParams
  const busqueda = typeof q === "string" ? q.slice(0, 80) : ""

  const [{ perfiles, total }, miPerfil] = await Promise.all([listarDirectorio(busqueda), obtenerPerfil(miembro.usuarioId)])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-widest text-naranja uppercase">Red de miembros</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">Directorio</h1>
          <p className="mt-2 text-muted-foreground">
            {total === 1 ? "1 miembro" : `${total} miembros`} del Colectivo. Conócelos y conecta.
          </p>
        </div>
        <form role="search" className="w-full md:max-w-sm">
          <label htmlFor="busqueda" className="sr-only">
            Buscar miembros
          </label>
          <InputGroup className="h-11 rounded-xl bg-white">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput id="busqueda" name="q" type="search" defaultValue={busqueda} placeholder="Nombre, empresa, especialidad…" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="secondary" size="sm" className="rounded-lg">
                Buscar
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>

      {!miPerfil ? (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl bg-azul-profundo p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-naranja">
              <UserRoundPlusIcon className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-xl uppercase">Aún no tienes perfil</h2>
              <p className="mt-1 text-sm text-white/75">Preséntate para que los demás miembros sepan quién eres y a qué te dedicas.</p>
            </div>
          </div>
          <Link href="/mi-perfil" className={buttonVariants({ variant: "acento", size: "lg" })}>
            Crear mi perfil
            <ArrowRightIcon data-icon="inline-end" aria-hidden />
          </Link>
        </div>
      ) : null}

      {perfiles.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perfiles.map((perfil) => (
            <li key={perfil.usuario_id} className="min-w-0">
              <Link
                href={`/miembros/${perfil.usuario_id}`}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-azul/10 bg-white p-5 shadow-sm transition-[box-shadow,border-color,translate] hover:-translate-y-0.5 hover:border-azul/25 hover:shadow-lg hover:shadow-azul/5"
              >
                <div className="flex items-center gap-4">
                  <AvatarMiembro nombre={perfil.nombre} fotoUrl={urlFotoPerfil(perfil.foto_ruta)} tamano={60} />
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-lg font-semibold text-azul uppercase group-hover:text-naranja">
                      {perfil.nombre}
                    </h2>
                    {perfil.especialidad ? <p className="truncate text-sm text-muted-foreground">{perfil.especialidad}</p> : null}
                  </div>
                </div>
                {perfil.ocupacion ? <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">{perfil.ocupacion}</p> : null}
                <div className="mt-auto flex flex-col gap-1.5 text-sm text-foreground/70">
                  {perfil.empresa ? (
                    <span className="flex items-center gap-2">
                      <BriefcaseBusinessIcon className="size-4 shrink-0 text-naranja" aria-hidden />
                      <span className="truncate">{[perfil.puesto, perfil.empresa].filter(Boolean).join(" · ")}</span>
                    </span>
                  ) : null}
                  {perfil.municipio ? (
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="size-4 shrink-0 text-naranja" aria-hidden />
                      <span className="truncate">{perfil.municipio}</span>
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-8 rounded-3xl border border-azul/20 py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-12 rounded-full bg-azul/10 text-azul [&_svg:not([class*='size-'])]:size-6">
              {busqueda ? <SearchXIcon aria-hidden /> : <UsersRoundIcon aria-hidden />}
            </EmptyMedia>
            <EmptyTitle className="font-heading text-xl text-azul uppercase">
              {busqueda ? "Sin resultados" : "El directorio está por llenarse"}
            </EmptyTitle>
            <EmptyDescription>
              {busqueda ? `Nadie coincide con “${busqueda}”. Prueba con otra palabra.` : "Sé de los primeros en crear tu perfil."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={busqueda ? "/miembros" : "/mi-perfil"} className={buttonVariants({ variant: "outline" })}>
              {busqueda ? "Ver a todos" : "Crear mi perfil"}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
