import { Encabezado } from "@/components/sitio/encabezado"
import { Pie } from "@/components/sitio/pie"

export default function LayoutEventos({ children }: LayoutProps<"/eventos">) {
  return (
    <>
      <Encabezado />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Pie />
    </>
  )
}
