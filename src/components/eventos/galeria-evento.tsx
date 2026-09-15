import Image from "next/image"

import { urlImagenEvento } from "@/lib/eventos/formato"
import type { FotoEvento } from "@/lib/eventos/tipos"

export function GaleriaEvento({ fotos, titulo }: { fotos: FotoEvento[]; titulo: string }) {
  const conUrl = fotos
    .map((foto) => ({ ...foto, url: urlImagenEvento(foto.ruta) }))
    .filter((foto): foto is FotoEvento & { url: string } => foto.url !== null)

  if (conUrl.length === 0) return null

  return (
    <section aria-labelledby="titulo-galeria">
      <h2 id="titulo-galeria" className="font-heading text-2xl font-semibold text-azul uppercase">
        Galería
      </h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {conUrl.map((foto, indice) => (
          <li key={foto.id}>
            <a
              href={foto.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-2xl bg-secondary"
            >
              <Image
                src={foto.url}
                alt={`${titulo}, foto ${indice + 1}`}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
              />
              <span className="sr-only">Abrir foto {indice + 1} en tamaño completo</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
