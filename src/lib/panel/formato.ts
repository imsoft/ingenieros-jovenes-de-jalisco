const formatoFechaHora = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
})

export function formatearFecha(iso: string) {
  return formatoFechaHora.format(new Date(iso))
}

// Los teléfonos se guardan normalizados; los de 10 dígitos se asumen de México (+52).
export function enlaceWhatsApp(telefono: string) {
  const digitos = telefono.replace(/\D/g, "")
  return `https://wa.me/${digitos.length === 10 ? `52${digitos}` : digitos}`
}

export function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? nombre
}
