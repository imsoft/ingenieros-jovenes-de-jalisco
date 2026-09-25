"use client"

import { useSyncExternalStore } from "react"

import { Notice } from "@/components/site/notice"
import { signInErrorMessages } from "@/lib/account/routes"

// Supabase sometimes returns the error in the fragment (#error_description=…), which the server can't see.
function readErrorFromHash() {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const description = hash.get("error_description") ?? hash.get("error")
  if (!description) return null
  if (description.includes("EMAIL_NOT_AUTHORIZED")) return signInErrorMessages["not-authorized"]
  return /expired|invalid/i.test(description) ? signInErrorMessages["invalid-link"] : signInErrorMessages.google
}

const subscribe = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

export function LinkError({ serverMessage }: { serverMessage: string | null }) {
  const hashMessage = useSyncExternalStore(subscribe, readErrorFromHash, () => null)
  const message = serverMessage ?? hashMessage
  if (!message) return null

  return <Notice variant="error">{message}</Notice>
}
