import { describe, expect, it } from "vitest"

import { safeRedirectPath } from "@/lib/account/routes"

describe("safeRedirectPath", () => {
  it("accepts internal paths", () => {
    expect(safeRedirectPath("/mi-perfil")).toBe("/mi-perfil")
    expect(safeRedirectPath("/miembros/abc?x=1")).toBe("/miembros/abc?x=1")
  })

  it.each([
    ["https://malicioso.com"],
    ["//malicioso.com"],
    ["/\\malicioso.com"],
    ["miembros"],
    [""],
    [null],
    [undefined],
  ])("rejects %s and uses the fallback", (value) => {
    expect(safeRedirectPath(value)).toBe("/miembros")
    expect(safeRedirectPath(value, "/panel")).toBe("/panel")
  })
})
