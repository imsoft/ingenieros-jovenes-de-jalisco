import { NextResponse } from "next/server"

import type { HeaderSession } from "@/lib/account/types"
import { getProfile, getProfilePhotoUrl } from "@/lib/members/profiles"
import { getMemberAccess } from "@/lib/members/session"

// Minimal data for the header's account menu. The browser requests it so that
// public pages stay cached (they don't read cookies on the server).
export async function GET() {
  const access = await getMemberAccess()
  let session: HeaderSession = null

  if (access.kind === "no-access") {
    session = { name: access.email ?? "Mi cuenta", email: access.email, photoUrl: null, isMember: false, isBoardMember: false }
  } else if (access.kind === "member") {
    const { member } = access
    const profile = await getProfile(member.userId)
    session = {
      name: profile?.full_name ?? member.suggestedName,
      email: member.email,
      photoUrl: getProfilePhotoUrl(profile?.photo_path ?? null),
      isMember: true,
      isBoardMember: member.isBoardMember,
    }
  }

  return NextResponse.json(session, { headers: { "Cache-Control": "private, no-store" } })
}
