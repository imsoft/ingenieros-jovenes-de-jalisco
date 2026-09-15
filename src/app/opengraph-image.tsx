import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

import { sitio } from "@/content/sitio"

// Imagen que aparece al compartir el sitio en WhatsApp, Facebook, LinkedIn o X.
export const alt = `${sitio.nombre}: ${sitio.lema}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const AZUL = "#10436f"
const AZUL_PROFUNDO = "#0a2c4a"
const NARANJA = "#e27227"

const raiz = process.cwd()
const [oswald, sourceSans, logo] = await Promise.all([
  readFile(join(raiz, "src/assets/fuentes/Oswald-Bold.woff")),
  readFile(join(raiz, "src/assets/fuentes/SourceSans3-SemiBold.woff")),
  readFile(join(raiz, "public/brand/logo-512.png")),
])
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

const columnasPuente = [
  { x: 80, y: 352 },
  { x: 180, y: 300 },
  { x: 300, y: 250 },
  { x: 420, y: 212 },
  { x: 540, y: 182 },
  { x: 660, y: 156 },
]

export default function ImagenParaCompartir() {
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
          backgroundColor: AZUL,
          backgroundImage: `linear-gradient(135deg, ${AZUL} 0%, ${AZUL_PROFUNDO} 100%)`,
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
          {columnasPuente.map(({ x, y }) => (
            <path key={x} d={`M${x} 127 V${y}`} strokeWidth="10" />
          ))}
        </svg>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={logoSrc} alt="" width={96} height={96} style={{ borderRadius: 14 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, letterSpacing: 4, color: NARANJA, textTransform: "uppercase" }}>
              {`Colectivo A.C. · Desde ${sitio.fundacion}`}
            </span>
            <span style={{ fontFamily: "Oswald", fontSize: 42, textTransform: "uppercase" }}>
              {sitio.nombreCorto}
            </span>
          </div>
        </div>

        {/* Saltos de línea fijos para que ninguna palabra quede sola. */}
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
            <span style={{ color: NARANJA }}>Jalisco avanza!</span>
          </div>
        </div>

        <span style={{ fontSize: 30, color: "rgba(255, 255, 255, 0.82)" }}>
          Comunidad de ingenieros en Guadalajara y todo Jalisco · Afiliación abierta
        </span>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, display: "flex", backgroundColor: NARANJA }} />
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
