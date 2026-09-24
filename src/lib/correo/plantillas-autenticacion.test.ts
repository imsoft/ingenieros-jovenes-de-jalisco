import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { htmlPlantillaAutenticacion, plantillasAutenticacion } from "@/lib/correo/plantillas-autenticacion"

const CARPETA = join(process.cwd(), "supabase", "plantillas")
// `pnpm correos:supabase` corre esta prueba con ACTUALIZAR_PLANTILLAS=1 para regenerar los archivos.
const actualizar = process.env.ACTUALIZAR_PLANTILLAS === "1"

describe.each(plantillasAutenticacion)("plantilla de Supabase $archivo", (plantilla) => {
  const html = htmlPlantillaAutenticacion(plantilla)
  const ruta = join(CARPETA, `${plantilla.archivo}.html`)
  if (actualizar) writeFileSync(ruta, html)

  it("está al día con el diseño de los correos de la app", () => {
    expect(readFileSync(ruta, "utf8"), "Ejecuta `pnpm correos:supabase`").toBe(html)
  })

  it("lleva el logo del sitio y una acción (enlace, código o botón)", () => {
    expect(html).toContain(`src="{{ .SiteURL }}/brand/logo-correo.png"`)
    expect(plantilla.enlace || plantilla.codigo || plantilla.accion).toBeTruthy()
    if (plantilla.accion) expect(html).toContain(`href="{{ .SiteURL }}${plantilla.accion.ruta}"`)
    if (plantilla.enlace) {
      const { tipo, siguiente } = plantilla.enlace
      expect(html).toContain(`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=${tipo}&amp;siguiente=${siguiente}`)
    }
    if (plantilla.codigo) expect(html).toContain("{{ .Token }}")
  })
})

describe("plantillas de Supabase", () => {
  const nombres = (categoria: string) =>
    plantillasAutenticacion.filter((plantilla) => plantilla.categoria === categoria).map((plantilla) => plantilla.plantillaSupabase).sort()

  it("cubren las seis plantillas de autenticación", () => {
    expect(nombres("autenticacion")).toEqual(
      ["Change email address", "Confirm signup", "Invite user", "Magic link or OTP", "Reauthentication", "Reset password"]
    )
  })

  it("cubren los siete avisos de seguridad", () => {
    expect(nombres("aviso")).toEqual(
      ["Email address changed", "Password changed", "Phone number changed", "Sign-in method linked", "Sign-in method removed", "Verification method added", "Verification method removed"]
    )
  })

  it("solo usan variables que Supabase ofrece en cada aviso", () => {
    const permitidas: Record<string, string[]> = {
      "Password changed": [],
      "Email address changed": [".Email", ".OldEmail"],
      "Phone number changed": [".Phone", ".OldPhone"],
      "Sign-in method linked": [".Provider"],
      "Sign-in method removed": [".Provider"],
      "Verification method added": [".FactorType"],
      "Verification method removed": [".FactorType"],
    }
    for (const plantilla of plantillasAutenticacion.filter((p) => p.categoria === "aviso")) {
      const usadas = [...htmlPlantillaAutenticacion(plantilla).matchAll(/\{\{ (\.\w+) \}\}/g)].map((m) => m[1]).filter((v) => v !== ".SiteURL")
      expect(usadas.every((v) => permitidas[plantilla.plantillaSupabase].includes(v)), `${plantilla.archivo}: ${usadas}`).toBe(true)
    }
  })
})
