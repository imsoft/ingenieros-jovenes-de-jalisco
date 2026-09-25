import { cn } from "cn"

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  light = false,
  centered = false,
}: {
  eyebrow: string
  title: string
  description?: string
  id?: string
  light?: boolean
  centered?: boolean
}) {
  return (
    <div className={cn("flex flex-col", centered && "items-center text-center")}>
      <p className="flex items-center gap-3 text-sm font-semibold tracking-widest text-brand-orange uppercase">
        <span aria-hidden className="h-px w-8 bg-brand-orange" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={cn(
          "mt-4 max-w-2xl font-heading text-4xl leading-[1.05] font-bold text-balance uppercase sm:text-5xl",
          light ? "text-white" : "text-brand-blue"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-lg leading-relaxed text-pretty",
            light ? "text-white/70" : "text-foreground/70"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
