import { getImageProps } from "next/image"
import { cn } from "cn"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts
  return letters.map((part) => part[0]?.toUpperCase() ?? "").join("")
}

// shadcn Avatar with the photo optimized by next/image (getImageProps) and the initials as a fallback.
// It's decorative: the name always appears next to the avatar, so it isn't repeated to screen readers.
export function MemberAvatar({
  name,
  photoUrl,
  size = 64,
  className,
  priority = false,
}: {
  name: string
  photoUrl: string | null
  size?: number
  className?: string
  priority?: boolean
}) {
  const image =
    photoUrl && !photoUrl.startsWith("blob:")
      ? getImageProps({
          src: photoUrl,
          alt: "",
          width: size,
          height: size,
          loading: priority ? "eager" : "lazy",
          fetchPriority: priority ? "high" : undefined,
        }).props
      : null

  return (
    <Avatar
      className={cn("size-(--size) after:border-brand-blue/10", className)}
      style={{ "--size": `${size}px` } as React.CSSProperties}
    >
      {image ? <AvatarImage {...image} /> : photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
      <AvatarFallback
        className="bg-brand-blue font-heading font-semibold text-white"
        style={{ fontSize: Math.round(size * 0.36) }}
      >
        <span aria-hidden>{getInitials(name || "?")}</span>
      </AvatarFallback>
    </Avatar>
  )
}
