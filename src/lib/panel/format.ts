const dateTimeFormat = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
})

export function formatDate(iso: string) {
  return dateTimeFormat.format(new Date(iso))
}

// Phone numbers are stored normalized; 10-digit ones are assumed to be Mexican (+52).
export function getWhatsAppLink(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits.length === 10 ? `52${digits}` : digits}`
}

export function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}
