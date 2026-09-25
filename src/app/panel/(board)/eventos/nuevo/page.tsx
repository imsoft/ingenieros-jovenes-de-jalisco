import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { EventForm } from "@/components/panel/event-form"
import { emptyEventFormValues } from "@/lib/events/form"

export const metadata: Metadata = { title: "Nuevo evento" }

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/eventos" className="flex w-fit items-center gap-2 rounded-md text-sm font-medium text-brand-blue hover:underline">
        <ArrowLeftIcon className="size-4" aria-hidden />
        Volver a eventos
      </Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-brand-blue uppercase sm:text-4xl">Nuevo evento</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Guárdalo como borrador y publícalo cuando esté listo. Después de crearlo podrás subir la portada y las fotos.
        </p>
      </div>
      <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-blue/10 sm:p-8">
        <EventForm eventId={null} initialValues={emptyEventFormValues} />
      </div>
    </div>
  )
}
