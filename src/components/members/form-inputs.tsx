"use client"

import { useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"

// "@" is fixed at the start, so people only type their user name. Pasted "@user" or profile links are
// cleaned on the server too.
export function HandleInput({
  id,
  name,
  defaultValue,
  invalid,
  placeholder = "tu_usuario",
}: {
  id: string
  name: string
  defaultValue: string
  invalid?: boolean
  placeholder?: string
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <InputGroup className="h-11 rounded-xl">
      <InputGroupAddon className="pl-4">
        <InputGroupText className="text-base text-foreground/60 md:text-sm">@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/^@+/, "").replace(/\s/g, ""))}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={60}
        placeholder={placeholder}
        aria-invalid={invalid ? true : undefined}
      />
    </InputGroup>
  )
}

// "12/1000" under a text area; turns orange near the limit.
export function CharacterCount({ id, length, max }: { id: string; length: number; max: number }) {
  return (
    <p id={id} className={cn("text-right text-xs tabular-nums text-muted-foreground", length >= max * 0.9 && "font-medium text-brand-orange")}>
      {length}/{max}
    </p>
  )
}

const SEPARATORS = /[,;\n]/

// Same cleanup the server applies (parseServices), so the chips show what will be saved.
function addTags(tags: string[], raw: string[]) {
  const next = [...tags]
  for (const item of raw) {
    const text = item.trim().replace(/\s+/g, " ")
    const tag = text.charAt(0).toUpperCase() + text.slice(1)
    if (tag && !next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) next.push(tag)
  }
  return next
}

// List of short values (services, products) shown as chips. Enter, comma or the "Agregar" button adds
// what was typed; the chips' X removes them. The hidden input sends one value per line, including
// whatever is still typed, so nothing is lost if the person submits without pressing Enter.
export function TagInput({
  id,
  name,
  defaultValue,
  invalid,
  placeholder,
  maxLength,
  describedBy,
  itemLabel,
}: {
  id: string
  name: string
  defaultValue: string[]
  invalid?: boolean
  placeholder?: string
  maxLength?: number
  describedBy?: string
  itemLabel: string
}) {
  const [tags, setTags] = useState(defaultValue)
  const [draft, setDraft] = useState("")

  function commit(text = draft) {
    setTags((current) => addTags(current, text.split(SEPARATORS)))
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={[...tags, draft].join("\n")} />
      <div className="flex gap-2">
        <InputGroup className="h-11 flex-1 rounded-xl">
          <InputGroupInput
            id={id}
            value={draft}
            maxLength={maxLength}
            placeholder={placeholder}
            enterKeyHint="done"
            aria-invalid={invalid ? true : undefined}
            aria-describedby={describedBy}
            className="px-4"
            onChange={(event) => {
              const value = event.target.value
              // Typing or pasting a separator adds everything before it.
              if (SEPARATORS.test(value)) {
                const parts = value.split(SEPARATORS)
                const rest = parts.pop() ?? ""
                setTags((current) => addTags(current, parts))
                setDraft(rest.trimStart())
              } else {
                setDraft(value)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commit()
              } else if (event.key === "Backspace" && !draft && tags.length > 0) {
                setTags((current) => current.slice(0, -1))
              }
            }}
            onBlur={() => commit()}
          />
        </InputGroup>
        <Button type="button" variant="outline" className="h-11 rounded-xl px-4" disabled={!draft.trim()} onClick={() => commit()}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          Agregar
        </Button>
      </div>
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={`${itemLabel} agregados`}>
          {tags.map((tag) => (
            <li key={tag.toLowerCase()} className="flex items-center gap-1 rounded-full bg-brand-blue/5 py-1 pr-1 pl-3 text-sm font-medium text-brand-blue">
              {tag}
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-full text-brand-blue/60 transition-colors hover:bg-brand-blue/10 hover:text-brand-blue focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={`Quitar ${tag}`}
                onClick={() => setTags((current) => current.filter((existing) => existing !== tag))}
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
