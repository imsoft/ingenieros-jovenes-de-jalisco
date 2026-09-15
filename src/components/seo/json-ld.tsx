// Datos estructurados (schema.org) para buscadores y asistentes de IA.
// Se escapa "<" para evitar inyección de HTML dentro del <script>.
export function JsonLd({ datos }: { datos: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  )
}
