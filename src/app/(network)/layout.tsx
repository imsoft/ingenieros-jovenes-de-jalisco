import type { Metadata } from "next"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader, type AppNavItem } from "@/components/app/app-header"
import { getMemberAccess } from "@/lib/members/session"
import { getProfile, getProfilePhotoUrl } from "@/lib/members/profiles"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const navItems: AppNavItem[] = [
  { href: "/miembros", label: "Directorio", icon: "directory" },
  { href: "/mi-perfil", label: "Mi perfil", icon: "profile" },
]

// Each page requires membership again; the layout only builds the header for members.
export default async function NetworkLayout({ children }: { children: React.ReactNode }) {
  const access = await getMemberAccess()
  const member = access.kind === "member" ? access.member : null
  const profile = member ? await getProfile(member.userId) : null

  return (
    <>
      {member ? (
        <AppHeader
          area="Red de miembros"
          homeHref="/miembros"
          items={navItems}
          account={{
            name: profile?.full_name ?? member.suggestedName,
            email: member.email,
            photoUrl: getProfilePhotoUrl(profile?.photo_path ?? null),
            isMember: true,
            isBoardMember: member.isBoardMember,
            roleLabel: member.isBoardMember ? "Consejo Directivo" : undefined,
          }}
        />
      ) : null}
      <main id="contenido" className="flex-1 bg-white">
        {children}
      </main>
      <AppFooter />
    </>
  )
}
