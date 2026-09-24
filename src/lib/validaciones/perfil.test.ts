import { describe, expect, it } from "vitest"

import { esquemaPerfil } from "@/lib/validaciones/perfil"

const vacio = {
  nombre: "Ana López",
  ocupacion: "",
  especialidad: "",
  empresa: "",
  puesto: "",
  municipio: "",
  biografia: "",
  linkedin_url: "",
  instagram: "",
  sitio_web: "",
  visible: true,
  foto_ruta: "",
}

describe("esquemaPerfil", () => {
  it("convierte los campos vacíos en null", () => {
    const perfil = esquemaPerfil.parse({ ...vacio, empresa: "   " })
    expect(perfil.empresa).toBeNull()
    expect(perfil.linkedin_url).toBeNull()
    expect(perfil.foto_ruta).toBeNull()
  })

  it("completa el protocolo de LinkedIn y del sitio web", () => {
    const perfil = esquemaPerfil.parse({ ...vacio, linkedin_url: "linkedin.com/in/ana", sitio_web: "ana.mx" })
    expect(perfil.linkedin_url).toBe("https://linkedin.com/in/ana")
    expect(perfil.sitio_web).toBe("https://ana.mx")
  })

  it("rechaza enlaces de LinkedIn que no son de LinkedIn", () => {
    expect(esquemaPerfil.safeParse({ ...vacio, linkedin_url: "https://linkedin.com.malicioso.io/in/ana" }).success).toBe(false)
    expect(esquemaPerfil.safeParse({ ...vacio, linkedin_url: "javascript:alert(1)" }).success).toBe(false)
  })

  it("extrae el usuario de Instagram de @usuario o de la URL", () => {
    expect(esquemaPerfil.parse({ ...vacio, instagram: "@ana.lopez" }).instagram).toBe("ana.lopez")
    expect(esquemaPerfil.parse({ ...vacio, instagram: "https://www.instagram.com/ana_lopez/" }).instagram).toBe("ana_lopez")
    expect(esquemaPerfil.safeParse({ ...vacio, instagram: "no válido!" }).success).toBe(false)
  })

  it("rechaza sitios web sin dominio", () => {
    expect(esquemaPerfil.safeParse({ ...vacio, sitio_web: "no es un sitio" }).success).toBe(false)
  })

  it("exige nombre", () => {
    expect(esquemaPerfil.safeParse({ ...vacio, nombre: " " }).success).toBe(false)
  })
})
