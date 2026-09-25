import Image from "next/image"
import Link from "next/link"

import { FacebookIcon, InstagramIcon } from "@/components/site/social-icons"
import { navigation, site } from "@/content/site"

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white/70">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Link href="/" className="flex w-fit items-center gap-3 rounded-lg">
            <Image src="/brand/logo.svg" alt="" width={56} height={56} className="size-14" />
            <span className="max-w-60 font-heading text-lg leading-tight font-semibold text-white uppercase" translate="no">
              {site.name}
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed">{site.description}</p>
          <div className="flex gap-2">
            <SocialLink href={site.social.instagram} label="Instagram">
              <InstagramIcon className="size-5" />
            </SocialLink>
            <SocialLink href={site.social.facebook} label="Facebook">
              <FacebookIcon className="size-5" />
            </SocialLink>
          </div>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="font-heading text-sm font-semibold tracking-wider text-white uppercase">
            Explora
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm lg:grid-cols-1">
            {navigation.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-brand-orange">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">Colectivo</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/#unete" className="transition-colors hover:text-brand-orange">
                Solicitud de afiliación
              </Link>
            </li>
            <li>
              <Link href="/aviso-de-privacidad" className="transition-colors hover:text-brand-orange">
                Aviso de privacidad
              </Link>
            </li>
            <li>
              <Link href="/panel" prefetch={false} className="transition-colors hover:text-brand-orange">
                Acceso Consejo
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        {/* Extra bottom space on mobile so content is not hidden under the fixed membership bar. */}
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-6 pb-28 text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6 sm:pb-6">
          <p>
            © {new Date().getFullYear()} {site.name} Todos los derechos reservados.
          </p>
          <p>
            Desarrollado por{" "}
            <a
              href="https://www.imsoft.io/es?utm_source=ingenieros-jovenes-de-jalisco&utm_medium=referral&utm_campaign=credito-sitio"
              target="_blank"
              rel="noopener"
              className="font-medium text-white/70 underline-offset-4 transition-colors hover:text-brand-orange hover:underline"
            >
              imSoft
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-orange"
    >
      <span className="sr-only">{label}</span>
      {children}
    </a>
  )
}
