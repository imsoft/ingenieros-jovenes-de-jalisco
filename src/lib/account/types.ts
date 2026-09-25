// What the header needs to know about the session (served by /auth/session).
export type HeaderSession = {
  name: string
  email: string | null
  photoUrl: string | null
  isMember: boolean
  isBoardMember: boolean
} | null
