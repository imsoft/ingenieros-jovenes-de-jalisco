import type { Metadata } from "next"

import { NetworkBar } from "@/components/members/network-bar"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import { getMemberAccess } from "@/lib/members/session"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Each page requires membership again; here we only decide whether to show the bar.
export default async function NetworkLayout({ children }: { children: React.ReactNode }) {
  const access = await getMemberAccess()

  return (
    <>
      <Header />
      {access.kind === "member" ? <NetworkBar isBoardMember={access.member.isBoardMember} /> : null}
      <main id="contenido" className="flex-1 bg-white">
        {children}
      </main>
      <Footer />
    </>
  )
}
