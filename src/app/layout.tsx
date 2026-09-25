import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";

import { JsonLd } from "@/components/seo/json-ld";
import { site } from "@/content/site";
import { getOrganizationStructuredData } from "@/lib/seo/structured-data";
import { getSiteUrl, isIndexable } from "@/lib/site-url";
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

const siteTitle = "Ingenieros Jóvenes de Jalisco | Colectivo de ingenieros en Jalisco";
const siteDescription =
  "Colectivo de ingenieros jóvenes en Guadalajara y todo Jalisco desde 2016. Networking, eventos, capacitación y voz para el gremio. Solicita tu afiliación.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteTitle,
    template: `%s | ${site.shortName}`,
  },
  description: siteDescription,
  applicationName: site.shortName,
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
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  category: "Organización no gubernamental",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: site.name,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: isIndexable()
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
        <JsonLd data={getOrganizationStructuredData()} />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand-blue focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
