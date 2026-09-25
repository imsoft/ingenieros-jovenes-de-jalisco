import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { site } from "@/content/site"

// Image shown when the site is shared on WhatsApp, Facebook, LinkedIn or X.
export const alt = `${site.name}: ${site.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const BRAND_BLUE = "#10436f"
const BRAND_NAVY = "#0a2c4a"
const BRAND_ORANGE = "#e27227"

const root = process.cwd()
const [oswald, sourceSans, logo] = await Promise.all([
  readFile(join(root, "src/assets/fonts/Oswald-Bold.woff")),
  readFile(join(root, "src/assets/fonts/SourceSans3-SemiBold.woff")),
  readFile(join(root, "public/brand/logo-512.png")),
])
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

const bridgeColumns = [
  { x: 80, y: 352 },
  { x: 180, y: 300 },
  { x: 300, y: 250 },
  { x: 420, y: 212 },
  { x: 540, y: 182 },
  { x: 660, y: 156 },
]

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px 72px",
          position: "relative",
          color: "white",
          fontFamily: "Source Sans",
          backgroundColor: BRAND_BLUE,
          backgroundImage: `linear-gradient(135deg, ${BRAND_BLUE} 0%, ${BRAND_NAVY} 100%)`,
        }}
      >
        <svg
          width="760"
          height="380"
          viewBox="0 0 800 400"
          fill="none"
          stroke="white"
          strokeOpacity="0.08"
          strokeWidth="14"
          style={{ position: "absolute", right: -60, bottom: 0 }}
        >
          <path d="M0 120 H800" />
          <path d="M0 400 C 200 220, 520 140, 800 132" />
          {bridgeColumns.map(({ x, y }) => (
            <path key={x} d={`M${x} 127 V${y}`} strokeWidth="10" />
          ))}
        </svg>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={logoSrc} alt="" width={96} height={96} style={{ borderRadius: 14 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, letterSpacing: 4, color: BRAND_ORANGE, textTransform: "uppercase" }}>
              {`Colectivo A.C. · Desde ${site.foundedYear}`}
            </span>
            <span style={{ fontFamily: "Oswald", fontSize: 42, textTransform: "uppercase" }}>
              {site.shortName}
            </span>
          </div>
        </div>

        {/* Fixed line breaks so no word is left alone on a line. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Oswald",
            fontSize: 88,
            lineHeight: 1.02,
            textTransform: "uppercase",
          }}
        >
          <span>¡Cuando la ingeniería</span>
          <div style={{ display: "flex", gap: 22 }}>
            <span>se une,</span>
            <span style={{ color: BRAND_ORANGE }}>Jalisco avanza!</span>
          </div>
        </div>

        <span style={{ fontSize: 30, color: "rgba(255, 255, 255, 0.82)" }}>
          Comunidad de ingenieros en Guadalajara y todo Jalisco · Afiliación abierta
        </span>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, display: "flex", backgroundColor: BRAND_ORANGE }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Oswald", data: oswald, weight: 700, style: "normal" },
        { name: "Source Sans", data: sourceSans, weight: 600, style: "normal" },
      ],
    }
  )
}
