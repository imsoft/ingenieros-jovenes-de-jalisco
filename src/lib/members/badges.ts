// Badges shown on member profiles and directory cards (pure helpers, no database access).

export type BadgeKind = "board" | "platform_creator"
export type MemberBadge = { kind: BadgeKind; label: string }

export const specialBadgeLabels: Record<Exclude<BadgeKind, "board">, string> = {
  platform_creator: "Creador de la plataforma",
}

// "Presidente" → "Presidente del Consejo"; no title → "Consejo Directivo".
export function boardBadgeLabel(title: string | null) {
  const clean = title?.trim()
  if (!clean) return "Consejo Directivo"
  return /consejo/i.test(clean) ? clean : `${clean} del Consejo`
}

// Consejo first, then special badges, grouped by member.
export function buildBadges(
  board: { user_id: string; title: string | null }[],
  special: { user_id: string; kind: string }[]
): Map<string, MemberBadge[]> {
  const badges = new Map<string, MemberBadge[]>()
  const add = (userId: string, badge: MemberBadge) => badges.set(userId, [...(badges.get(userId) ?? []), badge])
  for (const row of board) add(row.user_id, { kind: "board", label: boardBadgeLabel(row.title) })
  for (const row of special) {
    if (row.kind in specialBadgeLabels) {
      const kind = row.kind as keyof typeof specialBadgeLabels
      add(row.user_id, { kind, label: specialBadgeLabels[kind] })
    }
  }
  return badges
}
