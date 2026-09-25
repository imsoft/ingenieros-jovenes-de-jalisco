import { describe, expect, it } from "vitest"

import { getEventSlug, isoToLocalDateTime, localDateTimeToIso, slugify } from "@/lib/events/form"

describe("event slugs", () => {
  it("generates slugs without accents or symbols", () => {
    expect(slugify("  ¡Networking de Ingeniería Civil!  ")).toBe("networking-de-ingenieria-civil")
  })

  it("appends the year only if the title does not include it", () => {
    expect(getEventSlug("Jalisco al Grito", "2026-09-15")).toBe("jalisco-al-grito-2026")
    expect(getEventSlug("Congreso 2026", "2026-09-15")).toBe("congreso-2026")
  })
})

describe("Guadalajara times", () => {
  it("converts local time to UTC and back", () => {
    const iso = localDateTimeToIso("2026-11-20", "19:30")
    expect(iso).toBe("2026-11-21T01:30:00.000Z")
    expect(isoToLocalDateTime(iso)).toEqual({ date: "2026-11-20", time: "19:30" })
  })
})
