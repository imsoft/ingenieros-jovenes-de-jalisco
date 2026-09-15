import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, CircleCheckIcon, ExternalLinkIcon, Trash2Icon, UsersRoundIcon } from "lucide-react"
import { cn } from "cn"

import { eliminarEvento, eliminarFoto } from "@/acciones/eventos-panel"
import { BotonConfirmar } from "@/components/panel/boton-confirmar"
import { FormularioEvento } from "@/components/panel/formulario-evento"
import { SubidaGaleria, SubidaPortada } from "@/components/panel/subida-imagenes"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { urlImagenEvento } from "@/lib/eventos/formato"
import { valoresDesdeEvento } from "@/lib/eventos/formulario"
import { obtenerEventoPanel } from "@/lib/panel/eventos"

export const metadata: Metadata = { title: "Editar evento" }

export default async function EditarEvento({ params, searchParams }: PageProps<"/panel/eventos/[id]">) {
  const [{ id }, { creado }] = await Promise.all([params, searchParams])
  const evento = await obtenerEventoPanel(id)
  if (!evento) notFound()

  const portada = urlImagenEvento(evento.portada_ruta)

  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/eventos" className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-azul hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver a eventos
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("h-6 px-2.5", evento.publicado ? "bg-azul/10 text-azul" : "bg-muted text-muted-foreground")}>
              {evento.publicado ? "Publicado" : "Borrador"}
            </Badge>
            {!evento.registro_abierto ? <Badge className="h-6 bg-naranja/15 px-2.5 text-foreground">Registro cerrado</Badge> : null}
          </div>
          <h1 className="mt-3 font-heading text-3xl font-bold break-words text-azul uppercase sm:text-4xl">{evento.titulo}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/panel/eventos/${evento.id}/registros`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}>
            <UsersRoundIcon data-icon="inline-start" aria-hidden />
            Registros ({evento.lugares_ocupados})
          </Link>
          {evento.publicado ? (
            <a
              href={`/eventos/${evento.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 bg-white")}
            >
              Ver en el sitio
              <ExternalLinkIcon data-icon="inline-end" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      {creado === "1" ? (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-azul/10 px-4 py-3 text-sm text-azul">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          Evento creado. Agrega una portada para que luzca en el sitio{evento.publicado ? "" : " y publícalo cuando esté listo"}.
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="titulo-datos" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10 sm:p-8">
          <h2 id="titulo-datos" className="sr-only">
            Datos del evento
          </h2>
          <FormularioEvento eventoId={evento.id} valoresIniciales={valoresDesdeEvento(evento)} />
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="titulo-portada" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10">
            <h2 id="titulo-portada" className="font-heading text-lg font-semibold text-azul uppercase">
              Portada
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Horizontal, idealmente 1600 × 1000 px. JPG, PNG o WebP de hasta 5 MB.</p>
            <SubidaPortada eventoId={evento.id} portadaUrl={portada} titulo={evento.titulo} />
          </section>

          <section aria-labelledby="titulo-galeria" className="rounded-3xl bg-white p-6 ring-1 ring-azul/10">
            <h2 id="titulo-galeria" className="font-heading text-lg font-semibold text-azul uppercase">
              Galería
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">Fotos del evento para su página y el archivo de eventos anteriores.</p>
            <SubidaGaleria eventoId={evento.id} />
            {evento.fotos.length > 0 ? (
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {evento.fotos.map((foto, indice) => {
                  const url = urlImagenEvento(foto.ruta)
                  return (
                    <li key={foto.id} className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
                      {url ? (
                        <Image src={url} alt={`Foto ${indice + 1} de ${evento.titulo}`} fill sizes="(min-width: 1024px) 10vw, 33vw" className="object-cover" />
                      ) : null}
                      <div className="absolute top-1.5 right-1.5">
                        <BotonConfirmar
                          accion={eliminarFoto.bind(null, foto.id)}
                          titulo="¿Quitar esta foto?"
                          descripcion="Se borrará de la galería del evento."
                          textoConfirmar="Quitar foto"
                          etiqueta={`Quitar foto ${indice + 1}`}
                          variant="secondary"
                          size="icon-sm"
                          className="bg-white/90 text-destructive shadow"
                        >
                          <Trash2Icon />
                        </BotonConfirmar>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </section>

          <section aria-labelledby="titulo-eliminar" className="rounded-3xl bg-white p-6 ring-1 ring-destructive/20">
            <h2 id="titulo-eliminar" className="font-heading text-lg font-semibold text-destructive uppercase">
              Eliminar evento
            </h2>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Solo se pueden eliminar eventos sin registros. Si ya tiene registros, despublícalo para ocultarlo.
            </p>
            <BotonConfirmar
              accion={eliminarEvento.bind(null, evento.id)}
              titulo="¿Eliminar este evento?"
              descripcion="Se borrarán el evento, su portada y sus fotos. Esta acción no se puede deshacer."
              textoConfirmar="Eliminar evento"
              variant="destructive"
              size="lg"
              className="h-10"
            >
              <Trash2Icon data-icon="inline-start" aria-hidden />
              Eliminar evento
            </BotonConfirmar>
          </section>
        </div>
      </div>
    </div>
  )
}
