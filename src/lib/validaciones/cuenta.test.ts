import { describe, expect, it } from "vitest"

import { esquemaRegistroMiembro, esquemaRestablecer } from "@/lib/validaciones/cuenta"

const registroValido = {
  nombre: "Ana López",
  correo: "  Ana@Correo.MX ",
  contrasena: "segura123",
  confirmacion: "segura123",
  aceptaAvisoPrivacidad: "on",
}

describe("esquemaRegistroMiembro", () => {
  it("normaliza el correo", () => {
    const resultado = esquemaRegistroMiembro.parse(registroValido)
    expect(resultado.correo).toBe("ana@correo.mx")
  })

  it("exige contraseñas iguales", () => {
    const resultado = esquemaRegistroMiembro.safeParse({ ...registroValido, confirmacion: "otra1234" })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.path).toEqual(["confirmacion"])
  })

  it("exige mínimo 8 caracteres y el aviso de privacidad", () => {
    expect(esquemaRegistroMiembro.safeParse({ ...registroValido, contrasena: "corta", confirmacion: "corta" }).success).toBe(false)
    expect(esquemaRegistroMiembro.safeParse({ ...registroValido, aceptaAvisoPrivacidad: null }).success).toBe(false)
  })
})

describe("esquemaRestablecer", () => {
  it("valida la nueva contraseña", () => {
    expect(esquemaRestablecer.safeParse({ contrasena: "nueva1234", confirmacion: "nueva1234" }).success).toBe(true)
    expect(esquemaRestablecer.safeParse({ contrasena: "nueva1234", confirmacion: "nueva12345" }).success).toBe(false)
  })
})
