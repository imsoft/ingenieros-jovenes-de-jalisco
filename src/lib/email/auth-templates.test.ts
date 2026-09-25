import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { authEmailTemplates, renderAuthEmailTemplate } from "@/lib/email/auth-templates"

const FOLDER = join(process.cwd(), "supabase", "templates")
// `pnpm emails:supabase` runs this test with UPDATE_EMAIL_TEMPLATES=1 to regenerate the files.
const shouldUpdate = process.env.UPDATE_EMAIL_TEMPLATES === "1"

describe.each(authEmailTemplates)("Supabase template $file", (template) => {
  const html = renderAuthEmailTemplate(template)
  const path = join(FOLDER, `${template.file}.html`)
  if (shouldUpdate) writeFileSync(path, html)

  it("is up to date with the app email design", () => {
    expect(readFileSync(path, "utf8"), "Run `pnpm emails:supabase`").toBe(html)
  })

  it("carries the site logo and an action (link, code or button)", () => {
    expect(html).toContain(`src="{{ .SiteURL }}/brand/email-logo.png"`)
    expect(template.link || template.code || template.action).toBeTruthy()
    if (template.action) expect(html).toContain(`href="{{ .SiteURL }}${template.action.path}"`)
    if (template.link) {
      const { type, next } = template.link
      expect(html).toContain(`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${type}&amp;next=${next}`)
    }
    if (template.code) expect(html).toContain("{{ .Token }}")
  })
})

describe("Supabase templates", () => {
  const namesIn = (category: string) =>
    authEmailTemplates.filter((template) => template.category === category).map((template) => template.supabaseTemplate).sort()

  it("cover the six authentication templates", () => {
    expect(namesIn("auth")).toEqual(
      ["Change email address", "Confirm signup", "Invite user", "Magic link or OTP", "Reauthentication", "Reset password"]
    )
  })

  it("cover the seven security notifications", () => {
    expect(namesIn("notification")).toEqual(
      ["Email address changed", "Password changed", "Phone number changed", "Sign-in method linked", "Sign-in method removed", "Verification method added", "Verification method removed"]
    )
  })

  it("only use the variables Supabase provides for each notification", () => {
    const allowed: Record<string, string[]> = {
      "Password changed": [],
      "Email address changed": [".Email", ".OldEmail"],
      "Phone number changed": [".Phone", ".OldPhone"],
      "Sign-in method linked": [".Provider"],
      "Sign-in method removed": [".Provider"],
      "Verification method added": [".FactorType"],
      "Verification method removed": [".FactorType"],
    }
    for (const template of authEmailTemplates.filter((item) => item.category === "notification")) {
      const used = [...renderAuthEmailTemplate(template).matchAll(/\{\{ (\.\w+) \}\}/g)].map((match) => match[1]).filter((name) => name !== ".SiteURL")
      expect(used.every((name) => allowed[template.supabaseTemplate].includes(name)), `${template.file}: ${used}`).toBe(true)
    }
  })
})
