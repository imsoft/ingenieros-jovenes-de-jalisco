import { describe, expect, it } from "vitest"

import { boardBadgeLabel, buildBadges } from "@/lib/members/badges"

describe("boardBadgeLabel", () => {
  it("adds 'del Consejo' to the title, or falls back to Consejo Directivo", () => {
    expect(boardBadgeLabel("Presidente")).toBe("Presidente del Consejo")
    expect(boardBadgeLabel("Presidenta del Consejo")).toBe("Presidenta del Consejo")
    expect(boardBadgeLabel(null)).toBe("Consejo Directivo")
    expect(boardBadgeLabel("  ")).toBe("Consejo Directivo")
  })
})

describe("buildBadges", () => {
  it("groups badges by member, Consejo first, and ignores unknown kinds", () => {
    const badges = buildBadges(
      [{ user_id: "a", title: "Tesorero" }],
      [
        { user_id: "a", kind: "platform_creator" },
        { user_id: "b", kind: "unknown" },
      ]
    )
    expect(badges.get("a")).toEqual([
      { kind: "board", label: "Tesorero del Consejo" },
      { kind: "platform_creator", label: "Creador de la plataforma" },
    ])
    expect(badges.has("b")).toBe(false)
  })
})
