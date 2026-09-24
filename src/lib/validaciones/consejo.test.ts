import { describe, expect, it } from "vitest"

import { esquemaAgregarConsejo, mensajeDeErrorConsejo, mensajesConsejo } from "@/lib/validaciones/consejo"

describe("esquemaAgregarConsejo", () => {
  it("normaliza el correo y acepta los dos roles", () => {
    const datos = esquemaAgregarConsejo.parse({ nombre: " Ana ", correo: " Ana@CIJJ.mx ", rol: "admin" })
    expect(datos).toEqual({ nombre: "Ana", correo: "ana@cijj.mx", rol: "admin" })
  })

  it("rechaza roles inventados", () => {
    expect(esquemaAgregarConsejo.safeParse({ nombre: "Ana", correo: "ana@cijj.mx", rol: "superadmin" }).success).toBe(false)
  })
})

describe("mensajeDeErrorConsejo", () => {
  it("traduce los errores de la base de datos", () => {
    expect(mensajeDeErrorConsejo('P0001: ULTIMO_ADMINISTRADOR', "genérico")).toBe(mensajesConsejo.ULTIMO_ADMINISTRADOR)
    expect(mensajeDeErrorConsejo("otro error", "genérico")).toBe("genérico")
  })
})
