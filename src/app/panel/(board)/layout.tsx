import { AppFooter } from "@/components/app/app-footer"
import { AppHeader, type AppNavItem } from "@/components/app/app-header"
import { getProfile, getProfilePhotoUrl } from "@/lib/members/profiles"
import { roleDescriptions } from "@/lib/panel/roles"
import { requireBoardMember } from "@/lib/panel/session"

const navItems: AppNavItem[] = [
  { href: "/panel", label: "Resumen", icon: "summary", exact: true },
  { href: "/panel/solicitudes", label: "Solicitudes", icon: "applications" },
  { href: "/panel/eventos", label: "Eventos", icon: "events" },
]

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const member = await requireBoardMember()
  const profile = await getProfile(member.userId)
  const items: AppNavItem[] =
    member.role === "admin" ? [...navItems, { href: "/panel/consejo", label: "Consejo", icon: "board" }] : navItems

  return (
    <>
      <AppHeader
        area="Panel del Consejo"
        homeHref="/panel"
        items={items}
        account={{
          name: profile?.full_name ?? member.name,
          email: member.email,
          photoUrl: getProfilePhotoUrl(profile?.photo_path ?? null),
          isMember: true,
          isBoardMember: true,
          roleLabel: roleDescriptions[member.role].name,
        }}
      />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <AppFooter />
    </>
  )
}
