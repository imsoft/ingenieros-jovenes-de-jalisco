import Link from "next/link"
import { SearchIcon, XIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { DirectoryFilters as Filters } from "@/lib/members/directory"

type SelectFilter = { name: "specialty" | "sector" | "municipality"; label: string; allLabel: string; options: string[] }

// Plain GET form: works before hydration and keeps filters in the URL (shareable, back button friendly).
export function DirectoryFilters({
  action,
  filters,
  selects,
  searchLabel,
  searchPlaceholder,
}: {
  action: string
  filters: Filters
  selects: SelectFilter[]
  searchLabel: string
  searchPlaceholder: string
}) {
  const isFiltered = Boolean(filters.q || filters.specialty || filters.sector || filters.municipality)
  // Literal classes so Tailwind can see them: one column per select plus the buttons on large screens.
  const columns = selects.length >= 3 ? "lg:grid-cols-[1fr_1fr_1fr_auto]" : "lg:grid-cols-[1fr_1fr_auto]"

  return (
    <form role="search" action={action} className="flex flex-col gap-3 rounded-3xl border border-brand-blue/10 bg-secondary/40 p-4 sm:p-5">
      <label htmlFor="directory-search" className="sr-only">
        {searchLabel}
      </label>
      <InputGroup className="h-11 rounded-xl bg-white">
        <InputGroupAddon>
          <SearchIcon aria-hidden />
        </InputGroupAddon>
        <InputGroupInput id="directory-search" name="q" type="search" defaultValue={filters.q} placeholder={searchPlaceholder} />
      </InputGroup>

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end ${columns}`}>
        {selects.map((select) => (
          <div key={select.name} className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`filter-${select.name}`} className="text-xs font-medium text-muted-foreground">
              {select.label}
            </label>
            <NativeSelect
              id={`filter-${select.name}`}
              name={select.name}
              defaultValue={filters[select.name] ?? ""}
              className="w-full [&_select]:h-11 [&_select]:rounded-xl [&_select]:bg-white [&_select]:pl-3.5"
            >
              <NativeSelectOption value="">{select.allLabel}</NativeSelectOption>
              {select.options.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {option}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ))}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit" className="h-11 flex-1 rounded-xl px-5 sm:flex-none">
            Filtrar
          </Button>
          {isFiltered ? (
            <Link href={action} className={buttonVariants({ variant: "ghost", className: "h-11 rounded-xl" })} aria-label="Quitar filtros">
              <XIcon data-icon="inline-start" aria-hidden />
              Limpiar
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  )
}
