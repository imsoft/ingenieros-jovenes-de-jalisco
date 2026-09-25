import { cn } from "cn"

// Silhouette of the bridge from the logo, used as a decorative texture on dark sections.
const columns = [
  { x: 80, y: 352 },
  { x: 180, y: 300 },
  { x: 300, y: 250 },
  { x: 420, y: 212 },
  { x: 540, y: 182 },
  { x: 660, y: 156 },
]

export function BridgeDecoration({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 400"
      fill="none"
      stroke="currentColor"
      strokeWidth={14}
      className={cn("pointer-events-none", className)}
    >
      <path d="M0 120 H800" />
      <path d="M0 400 C 200 220, 520 140, 800 132" />
      {columns.map(({ x, y }) => (
        <path key={x} d={`M${x} 127 V${y}`} strokeWidth={10} />
      ))}
    </svg>
  )
}
