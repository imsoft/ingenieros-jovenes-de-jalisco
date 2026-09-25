import Image from "next/image"

import { getEventImageUrl } from "@/lib/events/format"
import type { EventPhoto } from "@/lib/events/types"

export function EventGallery({ photos, title }: { photos: EventPhoto[]; title: string }) {
  const withUrl = photos
    .map((photo) => ({ ...photo, url: getEventImageUrl(photo.path) }))
    .filter((photo): photo is EventPhoto & { url: string } => photo.url !== null)

  if (withUrl.length === 0) return null

  return (
    <section aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="font-heading text-2xl font-semibold text-brand-blue uppercase">
        Galería
      </h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {withUrl.map((photo, index) => (
          <li key={photo.id}>
            <a
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-2xl bg-secondary"
            >
              <Image
                src={photo.url}
                alt={`${title}, foto ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
              />
              <span className="sr-only">Abrir foto {index + 1} en tamaño completo</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
