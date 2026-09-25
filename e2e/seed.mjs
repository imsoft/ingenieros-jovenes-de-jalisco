// Test data for the LOCAL Supabase used by the end-to-end run. Refuses to run against anything else.
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY, DB_URL, ACCOUNTS_FILE, FIXTURES_DIR
import { randomBytes, randomUUID } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createClient } from "@supabase/supabase-js"

import { sql } from "./lib/database.mjs"

const { SUPABASE_URL, SUPABASE_SECRET_KEY, ACCOUNTS_FILE, FIXTURES_DIR } = process.env
if (!SUPABASE_URL?.startsWith("http://127.0.0.1")) throw new Error("The seed only runs against a local Supabase.")

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
const newPassword = () => randomBytes(12).toString("base64url")

const members = [
  { email: "sofia@cijj.test", fullName: "Sofía Ramírez Castellanos", specialty: "Ingeniería civil", headline: "Superviso obra de infraestructura hidráulica para el SIAPA", company: "Constructora Occidente", jobTitle: "Residente de obra", municipality: "Guadalajara", photo: 1, bio: "Me apasiona la infraestructura que cambia la vida de las colonias.", linkedinUrl: "https://www.linkedin.com/in/sofia-ramirez", instagramHandle: "sofi.ingeniera", websiteUrl: "https://constructoraoccidente.mx" },
  { email: "diego@cijj.test", fullName: "Diego Hernández", specialty: "Mecatrónica", headline: "Automatizo líneas de producción en la industria electrónica", company: "Continental Automotive Guadalajara Tech Center", jobTitle: "Ingeniero de automatización Sr.", municipality: "Tlaquepaque", photo: 2 },
  { email: "valeria@cijj.test", fullName: "Valeria Montes de Oca Villaseñor", specialty: "Ingeniería industrial", headline: "Mejora continua y Lean Six Sigma", company: "Freelance", municipality: "Zapopan", photo: 3 },
  { email: "luis@cijj.test", fullName: "Luis Ángel Pérez", specialty: "Ingeniería en sistemas", headline: "Desarrollo software para despachos de arquitectura", company: "Estudio Plano", jobTitle: "CTO", municipality: "Tlajomulco de Zúñiga" },
  { email: "mariana@cijj.test", fullName: "Mariana López", specialty: "Ingeniería ambiental", municipality: "Tonalá", photo: 4 },
  { email: "jorge@cijj.test", fullName: "Jorge", specialty: "Ingeniería eléctrica", headline: "Instalaciones eléctricas residenciales e industriales", company: "Electro Jorge", jobTitle: "Dueño", municipality: "El Salto" },
  { email: "hidden@cijj.test", fullName: "Perfil Oculto", specialty: "Química", isVisible: false },
  { email: "no-profile@cijj.test", fullName: null },
  { email: "former@cijj.test", fullName: "Ex Miembro", specialty: "Civil", isFormer: true },
]
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`

// Board members join through invitations (this also exercises the invitation trigger).
sql(`insert into private.board_invitations (email, full_name, role) values ('admin@cijj.test', 'Ana Admin', 'admin'), ('reviewer@cijj.test', 'Rafa Revisor', 'reviewer')`)
for (const member of members) {
  sql(`insert into public.membership_applications (full_name, email, phone, municipality, confirms_legal_age, accepts_privacy_notice, status, reviewed_at)
       values (${quote(member.fullName ?? "Nuevo Miembro")}, ${quote(member.email)}, '3312345678', ${quote(member.municipality ?? "Zapopan")}, true, true, 'approved', now())`)
}
// Approved applicant without an account (signs up during the run) and an event for the permission checks.
sql(`insert into public.membership_applications (full_name, email, phone, municipality, confirms_legal_age, accepts_privacy_notice, status, reviewed_at)
     values ('Paola Nueva', 'paola@cijj.test', '3312345678', 'Zapopan', true, true, 'approved', now())`)
sql(`insert into public.events (slug, title, summary, starts_at, venue, is_published)
     values ('evento-prueba-e2e', 'Evento de prueba', 'Resumen del evento de prueba', now() + interval '20 days', 'Guadalajara', true)`)

const accounts = { ids: {}, passwords: {} }
for (const email of ["admin@cijj.test", "reviewer@cijj.test", ...members.map((member) => member.email)]) {
  const password = newPassword()
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw new Error(`${email}: ${error.message}`)
  accounts.ids[email] = data.user.id
  accounts.passwords[email] = password
}

for (const member of members) {
  if (!member.fullName) continue
  let photoPath = null
  if (member.photo) {
    photoPath = `${accounts.ids[member.email]}/${randomUUID()}.png`
    const file = readFileSync(join(FIXTURES_DIR, `photo-${member.photo}.png`))
    const { error } = await admin.storage.from("profiles").upload(photoPath, file, { contentType: "image/png" })
    if (error) throw error
  }
  const { error } = await admin.from("profiles").insert({
    user_id: accounts.ids[member.email],
    full_name: member.fullName,
    headline: member.headline ?? null,
    specialty: member.specialty ?? null,
    company: member.company ?? null,
    job_title: member.jobTitle ?? null,
    municipality: member.municipality ?? null,
    bio: member.bio ?? null,
    linkedin_url: member.linkedinUrl ?? null,
    instagram_handle: member.instagramHandle ?? null,
    website_url: member.websiteUrl ?? null,
    photo_path: photoPath,
    is_visible: member.isVisible ?? true,
  })
  if (error) throw error
}
sql(`update public.membership_applications set status = 'rejected' where email = 'former@cijj.test'`)

writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2))
console.log(`Seeded ${Object.keys(accounts.ids).length} accounts; board: ${sql("select string_agg(full_name || ' (' || role || ')', ', ') from public.board_members")}`)
