import { describe, expect, it } from "vitest"

import { generarSlug, horaLocalDesdeIso, isoDesdeHoraLocal, slugParaEvento } from "@/lib/eventos/formulario"

describe("slugs de eventos", () => {
  it("genera slugs sin acentos ni símbolos", () => {
    expect(generarSlug("  ¡Networking de Ingeniería Civil!  ")).toBe("networking-de-ingenieria-civil")
  })

  it("agrega el año solo si el título no lo trae", () => {
    expect(slugParaEvento("Jalisco al Grito", "2026-09-15")).toBe("jalisco-al-grito-2026")
    expect(slugParaEvento("Congreso 2026", "2026-09-15")).toBe("congreso-2026")
  })
})

describe("horas de Guadalajara", () => {
  it("convierte hora local a UTC y de regreso", () => {
    const iso = isoDesdeHoraLocal("2026-11-20", "19:30")
    expect(iso).toBe("2026-11-21T01:30:00.000Z")
    expect(horaLocalDesdeIso(iso)).toEqual({ fecha: "2026-11-20", hora: "19:30" })
  })
})
