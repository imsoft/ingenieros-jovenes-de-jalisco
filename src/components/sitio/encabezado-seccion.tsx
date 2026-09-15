import { cn } from "cn"

export function EncabezadoSeccion({
  antetitulo,
  titulo,
  descripcion,
  id,
  claro = false,
  centrado = false,
}: {
  antetitulo: string
  titulo: string
  descripcion?: string
  id?: string
  claro?: boolean
  centrado?: boolean
}) {
  return (
    <div className={cn("flex flex-col", centrado && "items-center text-center")}>
      <p className="flex items-center gap-3 text-sm font-semibold tracking-widest text-naranja uppercase">
        <span aria-hidden className="h-px w-8 bg-naranja" />
        {antetitulo}
      </p>
      <h2
        id={id}
        className={cn(
          "mt-4 max-w-2xl font-heading text-4xl leading-[1.05] font-bold text-balance uppercase sm:text-5xl",
          claro ? "text-white" : "text-azul"
        )}
      >
        {titulo}
      </h2>
      {descripcion ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-lg leading-relaxed text-pretty",
            claro ? "text-white/70" : "text-foreground/70"
          )}
        >
          {descripcion}
        </p>
      ) : null}
    </div>
  )
}
