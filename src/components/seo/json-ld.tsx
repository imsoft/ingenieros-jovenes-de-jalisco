// Structured data (schema.org) for search engines and AI assistants.
// "<" is escaped to prevent HTML injection inside the <script>.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
