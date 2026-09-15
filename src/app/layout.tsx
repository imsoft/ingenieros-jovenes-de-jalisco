import type { Metadata, Viewport } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";

import { sitio } from "@/content/sitio";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${sitio.nombreCorto} | ${sitio.lema}`,
    template: `%s | ${sitio.nombreCorto}`,
  },
  description: `${sitio.descripcion} Únete a la comunidad de ingenieros jóvenes de Jalisco.`,
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: sitio.nombre,
  },
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
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-azul focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
