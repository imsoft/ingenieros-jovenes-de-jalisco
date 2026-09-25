import { describe, expect, it } from "vitest"

import { addBoardMemberSchema, boardErrorMessages, getBoardErrorMessage } from "@/lib/validations/board"

describe("addBoardMemberSchema", () => {
  it("normalizes the email and accepts both roles", () => {
    const data = addBoardMemberSchema.parse({ fullName: " Ana ", email: " Ana@CIJJ.mx ", role: "admin" })
    expect(data).toEqual({ fullName: "Ana", email: "ana@cijj.mx", role: "admin" })
    expect(addBoardMemberSchema.safeParse({ fullName: "Ana", email: "ana@cijj.mx", role: "reviewer" }).success).toBe(true)
  })

  it("rejects made-up roles", () => {
    expect(addBoardMemberSchema.safeParse({ fullName: "Ana", email: "ana@cijj.mx", role: "superadmin" }).success).toBe(false)
  })
})

describe("getBoardErrorMessage", () => {
  it("translates database errors", () => {
    expect(getBoardErrorMessage("P0001: LAST_ADMIN", "generic")).toBe(boardErrorMessages.LAST_ADMIN)
    expect(getBoardErrorMessage("some other error", "generic")).toBe("generic")
  })
})
