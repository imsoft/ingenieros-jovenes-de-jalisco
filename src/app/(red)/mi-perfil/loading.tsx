import { Skeleton } from "@/components/ui/skeleton"

export default function CargandoMiPerfil() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14" aria-busy="true" aria-label="Cargando tu perfil">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-48" />
      <div className="mt-8 flex flex-col gap-6 rounded-3xl border border-azul/10 p-5 sm:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-28 rounded-full" />
          <Skeleton className="h-10 w-32" />
        </div>
        {Array.from({ length: 5 }, (_, indice) => (
          <div key={indice} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
