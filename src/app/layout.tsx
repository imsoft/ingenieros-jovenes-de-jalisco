import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { sitio } from "@/content/sitio";
import { datosOrganizacion } from "@/lib/seo/datos-estructurados";
import { esIndexable, obtenerUrlSitio } from "@/lib/url-sitio";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const tituloSitio = "Ingenieros Jóvenes de Jalisco | Colectivo de ingenieros en Jalisco";
const descripcionSitio =
  "Colectivo de ingenieros jóvenes en Guadalajara y todo Jalisco desde 2016. Networking, eventos, capacitación y voz para el gremio. Solicita tu afiliación.";

export const metadata: Metadata = {
  metadataBase: obtenerUrlSitio(),
  title: {
    default: tituloSitio,
    template: `%s | ${sitio.nombreCorto}`,
  },
  description: descripcionSitio,
  applicationName: sitio.nombreCorto,
  keywords: [
    "Colectivo de Ingenieros Jóvenes de Jalisco",
    "ingenieros jóvenes",
    "ingenieros en Jalisco",
    "ingenieros en Guadalajara",
    "colectivo de ingenieros",
    "asociación de ingenieros Jalisco",
    "networking de ingeniería",
    "comunidad de ingenieros",
  ],
  authors: [{ name: sitio.nombre }],
  creator: sitio.nombre,
  publisher: sitio.nombre,
  category: "Organización no gubernamental",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: sitio.nombre,
    title: tituloSitio,
    description: descripcionSitio,
  },
  twitter: {
    card: "summary_large_image",
    title: tituloSitio,
    description: descripcionSitio,
  },
  robots: esIndexable()
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
      }
    : { index: false, follow: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      className={`${oswald.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd datos={datosOrganizacion()} />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-azul focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
