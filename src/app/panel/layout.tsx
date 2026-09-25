import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { default: "Panel del Consejo", template: "%s | Panel del Consejo" },
  robots: { index: false, follow: false },
}

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return <div className="flex min-h-screen flex-col bg-secondary">{children}</div>
}
