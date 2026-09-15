import { BarraCtaMovil } from "@/components/sitio/barra-cta-movil"
import { Encabezado } from "@/components/sitio/encabezado"
import { Pie } from "@/components/sitio/pie"
import { Actividades } from "@/components/sitio/secciones/actividades"
import { Beneficios } from "@/components/sitio/secciones/beneficios"
import { Cifras } from "@/components/sitio/secciones/cifras"
import { Nosotros } from "@/components/sitio/secciones/nosotros"
import { Pilares } from "@/components/sitio/secciones/pilares"
import { Portada } from "@/components/sitio/secciones/portada"
import { Preguntas } from "@/components/sitio/secciones/preguntas"
import { Unete } from "@/components/sitio/secciones/unete"

export default function Inicio() {
  return (
    <>
      <Encabezado />
      <main id="contenido" className="flex-1">
        <Portada />
        <Cifras />
        <Nosotros />
        <Pilares />
        <Actividades />
        <Beneficios />
        <Preguntas />
        <Unete />
      </main>
      <Pie />
      <BarraCtaMovil />
    </>
  )
}
