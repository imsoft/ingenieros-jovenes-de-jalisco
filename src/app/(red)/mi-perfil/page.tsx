import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRightIcon, Trash2Icon } from "lucide-react"

import { eliminarMiCuenta } from "@/acciones/cuenta"
import { FormularioPerfil } from "@/components/miembros/formulario-perfil"
import { BotonConfirmar } from "@/components/panel/boton-confirmar"
import { Aviso } from "@/components/sitio/aviso"
import { obtenerPerfil, urlFotoPerfil } from "@/lib/miembros/perfiles"
import { exigirMiembro } from "@/lib/miembros/sesion"

export const metadata: Metadata = { title: "Mi perfil" }

export default async function PaginaMiPerfil() {
  const miembro = await exigirMiembro("/mi-perfil")
  const perfil = await obtenerPerfil(miembro.usuarioId)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-widest text-naranja uppercase">Red de miembros</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-azul uppercase sm:text-4xl">
            {perfil ? "Mi perfil" : "Crea tu perfil"}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {perfil
              ? "Mantén tu información al día para que otros miembros sepan a qué te dedicas."
              : "Preséntate con el Colectivo: quién eres, a qué te dedicas y dónde trabajas."}
          </p>
        </div>
        {perfil ? (
          <Link
            href={`/miembros/${miembro.usuarioId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-azul underline-offset-4 hover:underline"
          >
            Ver cómo se ve
            <ArrowUpRightIcon className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {perfil?.suspendido ? (
        <Aviso tipo="advertencia" className="mt-6">
          El Consejo ocultó tu perfil del directorio. Puedes seguir editándolo; si crees que es un error, escríbele al Consejo.
        </Aviso>
      ) : null}

      <div className="mt-8 rounded-3xl border border-azul/10 bg-white p-5 shadow-sm sm:p-8">
        <FormularioPerfil
          esNuevo={!perfil}
          fotoUrlInicial={urlFotoPerfil(perfil?.foto_ruta ?? null)}
          valores={{
            nombre: perfil?.nombre ?? miembro.nombreSugerido,
            ocupacion: perfil?.ocupacion ?? "",
            especialidad: perfil?.especialidad ?? "",
            empresa: perfil?.empresa ?? "",
            puesto: perfil?.puesto ?? "",
            municipio: perfil?.municipio ?? "",
            biografia: perfil?.biografia ?? "",
            linkedin_url: perfil?.linkedin_url ?? "",
            instagram: perfil?.instagram ?? "",
            sitio_web: perfil?.sitio_web ?? "",
            visible: perfil?.visible ?? true,
            foto_ruta: perfil?.foto_ruta ?? "",
          }}
        />
      </div>

      <section aria-labelledby="titulo-eliminar-cuenta" className="mt-10 rounded-3xl p-5 ring-1 ring-destructive/20 sm:p-8">
        <h2 id="titulo-eliminar-cuenta" className="font-heading text-lg font-semibold text-destructive uppercase">
          Eliminar mi cuenta
        </h2>
        <p className="mt-1 mb-4 max-w-xl text-sm text-muted-foreground">
          Borra tu cuenta, tu perfil y tu foto de forma permanente. Tu afiliación al Colectivo no cambia: podrás crear una
          cuenta nueva cuando quieras.
        </p>
        <BotonConfirmar
          accion={eliminarMiCuenta}
          titulo="¿Eliminar tu cuenta?"
          descripcion="Se borrarán tu cuenta, tu perfil y tu foto. Esta acción no se puede deshacer."
          textoConfirmar="Eliminar mi cuenta"
          variant="outline"
          size="lg"
          className="h-10 text-destructive"
        >
          <Trash2Icon data-icon="inline-start" aria-hidden />
          Eliminar mi cuenta
        </BotonConfirmar>
      </section>
    </div>
  )
}

