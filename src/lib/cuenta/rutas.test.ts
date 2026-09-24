import { describe, expect, it } from "vitest"

import { rutaSegura } from "@/lib/cuenta/rutas"

describe("rutaSegura", () => {
  it("acepta rutas internas", () => {
    expect(rutaSegura("/mi-perfil")).toBe("/mi-perfil")
    expect(rutaSegura("/miembros/abc?x=1")).toBe("/miembros/abc?x=1")
  })

  it.each([
    ["https://malicioso.com"],
    ["//malicioso.com"],
    ["/\\malicioso.com"],
    ["miembros"],
    [""],
    [null],
    [undefined],
  ])("rechaza %s y usa el valor por defecto", (valor) => {
    expect(rutaSegura(valor)).toBe("/miembros")
    expect(rutaSegura(valor, "/panel")).toBe("/panel")
  })
})
