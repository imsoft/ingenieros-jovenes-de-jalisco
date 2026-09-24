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

type ResultadoAccion = { ok: boolean; mensaje?: string } | void

// Pide confirmación antes de ejecutar una server action destructiva y muestra su error si falla.
export function BotonConfirmar({
  accion,
  titulo,
  descripcion,
  textoConfirmar,
  etiqueta,
  children,
  variant,
  size,
  className,
  variantConfirmar = "destructive",
}: {
  accion: () => Promise<ResultadoAccion>
  titulo: string
  descripcion: string
  textoConfirmar: string
  etiqueta?: string
  children: React.ReactNode
  variantConfirmar?: "destructive" | "default"
} & Pick<React.ComponentProps<typeof Button>, "variant" | "size" | "className">) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, iniciarTransicion] = useTransition()

  const confirmar = () => {
    setError(null)
    iniciarTransicion(async () => {
      const resultado = await accion()
      if (resultado && !resultado.ok) {
        setError(resultado.mensaje ?? "No se pudo completar la acción.")
        return
      }
      setAbierto(false)
    })
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        if (pendiente) return
        setAbierto(siguiente)
        if (!siguiente) setError(null)
      }}
    >
      <AlertDialogTrigger render={<Button variant={variant} size={size} className={className} aria-label={etiqueta} />}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={variantConfirmar} disabled={pendiente} onClick={confirmar}>
            {pendiente ? <Spinner data-icon="inline-start" /> : null}
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
