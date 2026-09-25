import { describe, expect, it } from "vitest"

import { getUnusedPhotoPaths } from "@/lib/members/photo-cleanup"

const USER_ID = "00000000-0000-0000-0000-000000000001"

describe("getUnusedPhotoPaths", () => {
  it("keeps the photo the profile uses and returns the rest", () => {
    const unused = getUnusedPhotoPaths(USER_ID, ["a.jpg", "b.png", "c.webp"], `${USER_ID}/b.png`)
    expect(unused).toEqual([`${USER_ID}/a.jpg`, `${USER_ID}/c.webp`])
  })

  it("returns every photo when the profile has none", () => {
    expect(getUnusedPhotoPaths(USER_ID, ["a.jpg", "b.png"], null)).toEqual([`${USER_ID}/a.jpg`, `${USER_ID}/b.png`])
  })

  it("ignores the folder placeholder that Supabase creates", () => {
    expect(getUnusedPhotoPaths(USER_ID, [".emptyFolderPlaceholder", "a.jpg"], `${USER_ID}/a.jpg`)).toEqual([])
  })

  it("returns nothing for an empty folder", () => {
    expect(getUnusedPhotoPaths(USER_ID, [], null)).toEqual([])
  })
})
