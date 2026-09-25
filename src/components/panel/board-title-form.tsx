"use client"

import { useActionState } from "react"
import { CheckIcon } from "lucide-react"

import { setBoardTitle } from "@/actions/board"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { BoardTitleFormState } from "@/lib/validations/board"

const initialState: BoardTitleFormState = { status: "idle" }

// Inline editor of the title shown as a badge on the member's profile.
export function BoardTitleForm({ userId, fullName, title }: { userId: string; fullName: string; title: string | null }) {
  const [state, formAction, isPending] = useActionState(setBoardTitle.bind(null, userId), initialState)
  const inputId = `board-title-${userId}`

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">
        Cargo en el Consejo <span className="font-normal">(se muestra en su perfil)</span>
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          name="title"
          defaultValue={title ?? ""}
          maxLength={60}
          placeholder="Presidente, Secretaria, Vocal…"
          aria-label={`Cargo de ${fullName} en el Consejo`}
          aria-invalid={state.status === "error" ? true : undefined}
          className="h-9 max-w-64 rounded-lg"
        />
        <Button type="submit" variant="outline" size="sm" className="h-9" disabled={isPending}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          Guardar
        </Button>
      </div>
      {state.status !== "idle" ? (
        <p role="status" className={state.status === "error" ? "text-xs text-destructive" : "flex items-center gap-1 text-xs text-green-700"}>
          {state.status === "success" ? <CheckIcon className="size-3.5" aria-hidden /> : null}
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
