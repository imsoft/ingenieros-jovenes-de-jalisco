import { Skeleton } from "@/components/ui/skeleton"

export default function CargandoPerfil() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14" aria-busy="true" aria-label="Cargando perfil">
      <Skeleton className="h-5 w-24" />
      <div className="mt-6 overflow-hidden rounded-3xl border border-azul/10">
        <div className="h-28 bg-azul-profundo sm:h-32" />
        <div className="px-5 pb-8 sm:px-8">
          <Skeleton className="-mt-14 size-28 rounded-full ring-4 ring-white" />
          <Skeleton className="mt-4 h-9 w-2/3" />
          <Skeleton className="mt-3 h-5 w-40" />
          <Skeleton className="mt-5 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-4/5" />
        </div>
      </div>
    </div>
  )
}
