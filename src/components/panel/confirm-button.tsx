"use client"

import { useState, useTransition } from "react"
import { TriangleAlertIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ActionResult = { ok: boolean; message?: string } | void

// Asks for confirmation before running a destructive server action and shows its error if it fails.
export function ConfirmButton({
  action,
  title,
  description,
  confirmLabel,
  ariaLabel,
  children,
  variant,
  size,
  className,
  confirmVariant = "destructive",
}: {
  action: () => Promise<ActionResult>
  title: string
  description: string
  confirmLabel: string
  ariaLabel?: string
  children: React.ReactNode
  confirmVariant?: "destructive" | "default"
} & Pick<React.ComponentProps<typeof Button>, "variant" | "size" | "className">) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const confirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result && !result.ok) {
        setError(result.message ?? "No se pudo completar la acción.")
        return
      }
      setOpen(false)
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        setOpen(nextOpen)
        if (!nextOpen) setError(null)
      }}
    >
      <AlertDialogTrigger render={<Button variant={variant} size={size} className={className} aria-label={ariaLabel} />}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={confirmVariant} disabled={isPending} onClick={confirm}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
