import Image from "next/image"
import Link from "next/link"

import { IconoFacebook, IconoInstagram } from "@/components/sitio/iconos-redes"
import { navegacion, sitio } from "@/content/sitio"

export function Pie() {
  return (
    <footer className="bg-azul-profundo text-white/70">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Link href="/" className="flex w-fit items-center gap-3 rounded-lg">
            <Image src="/brand/logo.svg" alt="" width={56} height={56} className="size-14" />
            <span className="max-w-60 font-heading text-lg leading-tight font-semibold text-white uppercase" translate="no">
              {sitio.nombre}
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed">{sitio.descripcion}</p>
          <div className="flex gap-2">
            <RedSocial href={sitio.redes.instagram} etiqueta="Instagram">
              <IconoInstagram className="size-5" />
            </RedSocial>
            <RedSocial href={sitio.redes.facebook} etiqueta="Facebook">
              <IconoFacebook className="size-5" />
            </RedSocial>
          </div>
        </div>

        <nav aria-labelledby="pie-explora">
          <h2 id="pie-explora" className="font-heading text-sm font-semibold tracking-wider text-white uppercase">
            Explora
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm lg:grid-cols-1">
            {navegacion.map((enlace) => (
              <li key={enlace.href}>
                <Link href={enlace.href} className="transition-colors hover:text-naranja">
                  {enlace.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">Colectivo</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/#unete" className="transition-colors hover:text-naranja">
                Solicitud de afiliación
              </Link>
            </li>
            <li>
              <Link href="/aviso-de-privacidad" className="transition-colors hover:text-naranja">
                Aviso de privacidad
              </Link>
            </li>
            <li>
              <Link href="/panel" prefetch={false} className="transition-colors hover:text-naranja">
                Acceso Consejo
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        {/* Espacio inferior extra en móvil para no quedar debajo de la barra fija de afiliación. */}
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-6 pb-28 text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6 sm:pb-6">
          <p>
            © {new Date().getFullYear()} {sitio.nombre} Todos los derechos reservados.
          </p>
          <p>{sitio.lema}</p>
        </div>
      </div>
    </footer>
  )
}

function RedSocial({
  href,
  etiqueta,
  children,
}: {
  href: string
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-naranja"
    >
      <span className="sr-only">{etiqueta}</span>
      {children}
    </a>
  )
}
