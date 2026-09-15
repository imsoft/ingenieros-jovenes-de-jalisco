"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

// Botón de envío para formularios de server actions que muestra el estado pendiente.
export function BotonFormulario({ children, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} type="submit" disabled={pending || disabled}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  )
}
