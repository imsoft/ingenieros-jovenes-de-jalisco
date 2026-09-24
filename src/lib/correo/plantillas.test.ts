import { describe, expect, it } from "vitest"

import {
  correoInvitacionConsejo,
  correoNuevaSolicitud,
  correoRegistroEvento,
  correoSolicitudAprobada,
  escaparHtml,
} from "@/lib/correo/plantillas"

const SITIO = "https://ingenierosjovenes.example"

describe("escaparHtml", () => {
  it("escapa caracteres peligrosos", () => {
    expect(escaparHtml(`<script>"x" & 'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;")
  })
})

describe("correoNuevaSolicitud", () => {
  it("escapa los datos del solicitante y enlaza al panel del dominio configurado", () => {
    const correo = correoNuevaSolicitud(
      { nombre: "<img src=x onerror=alert(1)>", correo: "a@b.mx", telefono: "3312345678", municipio: "Zapopan" },
      SITIO
    )
    expect(correo.html).not.toContain("<img src=x")
    expect(correo.html).toContain("&lt;img src=x")
    expect(correo.html).toContain(`${SITIO}/panel/solicitudes`)
    expect(correo.texto).toContain("Zapopan")
  })
})

describe("correoSolicitudAprobada", () => {
  it("saluda por el primer nombre e invita a registrarse", () => {
    const correo = correoSolicitudAprobada({ nombre: "María José Pérez" }, SITIO)
    expect(correo.html).toContain("¡Bienvenido, María!")
    expect(correo.html).toContain(`${SITIO}/registro`)
    expect(correo.texto).toContain(`${SITIO}/registro`)
  })
})

describe("correoRegistroEvento", () => {
  const base = {
    nombre: "Ana",
    folio: "CIJJ-0042",
    evento: {
      titulo: "Networking",
      slug: "networking-2026",
      fecha: "Viernes, 20 de noviembre de 2026",
      horario: "19:30",
      lugar: "Casa Jalisco",
      direccion: "Av. Juárez 100",
    },
    monto: "$300.00",
    esGratis: false,
    esMiembro: true,
    instrucciones: "Transferencia a CLABE 000",
  }

  it("incluye folio, monto de miembro e instrucciones de pago", () => {
    const correo = correoRegistroEvento(base, SITIO)
    expect(correo.asunto).toContain("CIJJ-0042")
    expect(correo.texto).toContain("Monto a pagar: $300.00 (precio de miembro).")
    expect(correo.texto).toContain("Transferencia a CLABE 000")
    expect(correo.html).toContain(`${SITIO}/eventos/networking-2026`)
  })

  it("omite pago e instrucciones si el evento es gratis", () => {
    const correo = correoRegistroEvento({ ...base, esGratis: true, monto: "Gratis" }, SITIO)
    expect(correo.texto).toContain("Este evento es gratuito")
    expect(correo.texto).not.toContain("CLABE")
  })
})

describe("correoInvitacionConsejo", () => {
  it("explica el rol y enlaza al registro", () => {
    const correo = correoInvitacionConsejo({ nombre: "Luis Pérez", rol: "admin", invitadoPor: "<b>Ana</b>" }, SITIO)
    expect(correo.html).toContain("administrador")
    expect(correo.html).toContain("&lt;b&gt;Ana&lt;/b&gt;")
    expect(correo.texto).toContain(`${SITIO}/registro`)
  })
})
