"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

// Submit button for server action forms that shows the pending state.
export function SubmitButton({ children, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} type="submit" disabled={pending || disabled}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  )
}
