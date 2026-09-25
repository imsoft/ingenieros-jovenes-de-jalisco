import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { BridgeDecoration } from "@/components/site/bridge-decoration"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="contenido"
      className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-brand-navy px-4 py-12"
    >
      <BridgeDecoration className="absolute -bottom-10 -left-24 -z-10 w-4xl max-w-none text-white opacity-[0.06]" />
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
        <Link href="/" className="flex w-fit items-center gap-3 rounded-lg">
          <Image src="/brand/logo.svg" alt="" width={44} height={44} className="size-11" />
          <span className="flex flex-col">
            <span className="text-xs font-semibold tracking-widest text-brand-orange uppercase">Ingenieros Jóvenes de Jalisco</span>
            <span className="font-heading text-lg leading-tight font-semibold text-brand-blue uppercase">Red de miembros</span>
          </span>
        </Link>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  )
}
