// End-to-end flows against the app built for the local Supabase (run through e2e/run.sh).
// UI strings are asserted in Spanish because that is what users see.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { launchBrowser, wait } from "./lib/browser.mjs"
import { sql } from "./lib/database.mjs"
import { emailsTo, readEmail, waitForEmail } from "./lib/mail.mjs"

const { BASE_URL, ACCOUNTS_FILE, FIXTURES_DIR, ARTIFACTS_DIR } = process.env
const accounts = JSON.parse(readFileSync(ACCOUNTS_FILE, "utf8"))
const fixture = (name) => join(FIXTURES_DIR, name)
mkdirSync(ARTIFACTS_DIR, { recursive: true })

let passed = 0
let failed = 0
function check(condition, description, detail = "") {
  if (condition) {
    passed++
    console.log(`  ✓ ${description}`)
  } else {
    failed++
    console.log(`  ✗ ${description} ${detail}`)
  }
}

const browser = await launchBrowser({ baseUrl: BASE_URL, artifactsDir: ARTIFACTS_DIR })
const { goto, type, click, clickText, clickExpression, textOf, evaluate, waitFor, path } = browser
const alertText = () => textOf("[data-slot=alert]")
const waitForAlert = (text) => waitFor(`[...document.querySelectorAll("[data-slot=alert]")].some((el) => el.textContent.includes(${JSON.stringify(text)}))`)
const dialog = `document.querySelector("[role=alertdialog]")`
const signUpForm = "document.querySelector('form:has(input[name=fullName])')"

async function signIn(email, password = accounts.passwords[email]) {
  await browser.clearCookies()
  await goto("/ingresar")
  await type("input[name=email]", email)
  await type("input[name=password]", password)
  await clickText("Ingresar", "document.querySelector('form:has(input[name=password])')")
  await waitFor(`location.pathname !== "/ingresar" || document.querySelector("[data-slot=alert]")`)
  await browser.waitForLoad()
}

async function fillSignUp(fullName, email, password) {
  await goto("/registro")
  await type("input[name=fullName]", fullName)
  await type("input[name=email]", email)
  await type("input[name=password]", password)
  await type("input[name=confirmation]", password)
  // The checkbox only responds once React has hydrated the page: retry until it is checked.
  for (let attempt = 0; attempt < 5; attempt++) {
    await click("[role=checkbox]")
    if (await waitFor(`document.querySelector("[role=checkbox]")?.getAttribute("aria-checked") === "true"`, 1500)) break
  }
  await clickText("Crear cuenta", signUpForm)
  await waitFor(`document.querySelector("[data-slot=alert]")`)
}

async function signUpFlow() {
  console.log("\nSign-up with email")
  await browser.clearCookies()
  await fillSignUp("Paola Nueva", "intruder@cijj.test", "Clave-segura-2026")
  check((await alertText()).includes("no tiene una solicitud de afiliación aprobada"), "an email without an approved application is rejected with a clear message", await alertText())

  await goto("/registro")
  await clickText("Crear cuenta", signUpForm)
  await waitFor(`document.querySelector("[aria-invalid=true]")`)
  check((await evaluate(`document.querySelectorAll("[aria-invalid=true]").length`)) >= 3, "submitting empty marks the invalid fields")
  check((await evaluate(`document.activeElement?.getAttribute("aria-invalid")`)) === "true", "focus moves to the first invalid field")

  const previous = (await emailsTo("paola@cijj.test")).length
  await fillSignUp("Paola Nueva", "Paola@cijj.test", "Clave-segura-2026")
  check((await alertText()).includes("Te enviamos un correo"), "with an approved application it asks to confirm the email")

  await goto("/ingresar")
  await type("input[name=email]", "paola@cijj.test")
  await type("input[name=password]", "Clave-segura-2026")
  await clickText("Ingresar", "document.querySelector('form:has(input[name=password])')")
  await waitFor(`document.querySelector("[data-slot=alert]")`)
  check((await alertText()).includes("Confirma tu correo"), "sign-in is blocked until the email is confirmed")

  const message = await waitForEmail("paola@cijj.test", previous)
  check(message, "the confirmation email arrives")
  const { subject, confirmLink } = await readEmail(message)
  check(subject === "Confirma tu cuenta de la red de miembros", "the email uses the branded Spanish template", subject)
  check(confirmLink?.startsWith(`${BASE_URL}/auth/confirm?token_hash=`), "the link points to the site's /auth/confirm", confirmLink)
  // Opened in a clean browser, as if on another device.
  await browser.clearCookies()
  await goto(confirmLink)
  check((await path()) === "/mi-perfil", "the link confirms and opens /mi-perfil (even on another device)", await path())
  check((await evaluate(`document.querySelector("input[name=fullName]")?.value`)) === "Paola Nueva", "the sign-up name is prefilled")
}

async function profilePhotoFlow() {
  console.log("\nProfile photo")
  await browser.uploadFile("input[type=file]", fixture("photo-3.png"))
  check(await waitFor(`document.querySelector("input[name=photoPath]").value.length > 10`), "the photo uploads to Storage with a signed URL")
  await type("input[name=headline]", "Diseño plantas de tratamiento de agua")
  await clickText("Crear mi perfil")
  await waitForAlert("Perfil guardado")
  check((await alertText()).includes("Perfil guardado"), "creating the profile shows a confirmation")
  const userId = sql(`select id from auth.users where email = 'paola@cijj.test'`)
  const firstPhoto = sql(`select photo_path from profiles where user_id = '${userId}'`)
  check(firstPhoto.startsWith(`${userId}/`), "the photo path lives in the member's folder", firstPhoto)
  check(sql(`select count(*) from storage.objects where bucket_id = 'profiles' and name = '${firstPhoto}'`) === "1", "the file exists in Storage")

  await goto("/mi-perfil")
  await browser.uploadFile("input[type=file]", fixture("photo-4.png"))
  await waitFor(`document.querySelector("input[name=photoPath]").value !== ${JSON.stringify(firstPhoto)}`)
  await clickText("Guardar cambios")
  await waitForAlert("Perfil guardado")
  check(sql(`select photo_path from profiles where user_id = '${userId}'`) !== firstPhoto, "changing the photo updates the profile")
  check(sql(`select count(*) from storage.objects where bucket_id = 'profiles' and name = '${firstPhoto}'`) === "0", "the previous photo is deleted from Storage")

  const notAnImage = join(ARTIFACTS_DIR, "not-an-image.txt")
  writeFileSync(notAnImage, "hello")
  await browser.uploadFile("input[type=file]", notAnImage)
  await waitForAlert("JPG, PNG o WebP")
  check((await alertText()).includes("Usa una imagen JPG, PNG o WebP"), "a file that is not an image is rejected")

  await goto("/miembros")
  await waitFor(`document.querySelector("ul h2")`)
  check((await textOf("ul h2")).includes("Paola Nueva"), "the new profile shows up in the directory")
}

async function passwordResetFlow() {
  console.log("\nPassword reset")
  await browser.clearCookies()
  const previous = (await emailsTo("sofia@cijj.test")).length
  for (const email of ["sofia@cijj.test", "nobody@cijj.test"]) {
    await goto("/recuperar")
    await type("input[name=email]", email)
    await clickText("Enviar enlace")
    await waitFor(`document.querySelector("[data-slot=alert]")`)
    check((await alertText()).includes("Si ese correo tiene una cuenta"), `same neutral answer for ${email} (does not reveal whether the account exists)`)
  }

  const message = await waitForEmail("sofia@cijj.test", previous)
  check(message, "the reset email arrives")
  const { subject, confirmLink } = await readEmail(message)
  check(subject === "Crea una nueva contraseña", "it uses the branded Spanish template", subject)
  await browser.clearCookies()
  await goto(confirmLink)
  check((await path()) === "/restablecer", "the link opens /restablecer", await path())
  await type("input[name=password]", "corta")
  await type("input[name=confirmation]", "corta")
  await clickText("Guardar contraseña")
  await waitFor(`document.querySelector("[aria-invalid=true]")`)
  check((await evaluate(`document.querySelector("[aria-invalid=true]")?.name`)) === "password", "the minimum length is validated")
  const newPassword = "Nueva-clave-Sofia-2026"
  await type("input[name=password]", newPassword)
  await type("input[name=confirmation]", newPassword)
  await clickText("Guardar contraseña")
  await waitFor(`location.pathname === "/miembros"`)
  check((await path()) === "/miembros", "saving the password opens the directory", await path())
  await signIn("sofia@cijj.test", newPassword)
  check((await path()) === "/miembros", "signs in with the new password")
  accounts.passwords["sofia@cijj.test"] = newPassword

  await browser.clearCookies()
  await goto(confirmLink)
  check((await path()).startsWith("/ingresar?error=invalid-link"), "a used link does not work again", await path())
  check((await alertText()).includes("expiró o no es válido"), "and it explains why")
}

const rowOf = (email) => `[...document.querySelectorAll("li")].find((li) => li.textContent.includes(${JSON.stringify(email)}))`
const buttonInRow = (email, label) => `[...${rowOf(email)}.querySelectorAll("button")].find((button) => button.textContent.includes(${JSON.stringify(label)}))`

async function boardFlow() {
  console.log("\nBoard management from the panel")
  await signIn("admin@cijj.test")
  await goto("/panel/consejo")
  await type("#board-full-name", "Luis Ángel Pérez")
  await type("#board-email", "LUIS@cijj.test")
  await clickText("Agregar al Consejo")
  await waitForAlert("acceso al panel")
  check((await alertText()).includes("ya tiene acceso al panel"), "adding someone with an account grants access right away")
  check(sql(`select m.role::text || m.is_active::text from board_members m join auth.users u on u.id = m.user_id where u.email = 'luis@cijj.test'`) === "reviewertrue", "they join as an active reviewer")

  await type("#board-full-name", "Carla Invitada")
  await type("#board-email", "carla@cijj.test")
  await click("#board-role-admin")
  await clickText("Agregar al Consejo")
  await waitForAlert("invitado")
  check((await alertText()).includes("Quedó invitado"), "adding someone without an account creates an invitation")
  await goto("/panel/consejo")
  check((await textOf("section")).includes("carla@cijj.test"), "the invitation shows up as pending")

  await clickExpression(buttonInRow("admin@cijj.test", "Hacer revisor"), "Make myself reviewer")
  await waitFor(dialog)
  await clickText("Cambiar rol", dialog)
  await waitFor(`document.querySelector("[role=alertdialog] [role=alert]")`)
  check((await textOf("[role=alertdialog] [role=alert]")).includes("al menos un administrador"), "the board is never left without admins, and it says so")
  await browser.pressEscape()
  await wait(400)

  await clickExpression(buttonInRow("reviewer@cijj.test", "Dar de baja"), "Deactivate reviewer")
  await waitFor(dialog)
  await clickText("Dar de baja", dialog)
  await waitFor(`!${dialog}`)
  await browser.waitForLoad()
  check(sql(`select m.is_active from board_members m join auth.users u on u.id = m.user_id where u.email = 'reviewer@cijj.test'`) === "f", "deactivating works from the panel")
  await waitFor(`document.body.innerText.includes("Dados de baja")`)
  await clickExpression(buttonInRow("reviewer@cijj.test", "Reactivar"), "Reactivate reviewer")
  await waitFor(dialog)
  await clickText("Reactivar", dialog)
  await waitFor(`!${dialog}`)
  await wait(800)
  check(sql(`select m.is_active from board_members m join auth.users u on u.id = m.user_id where u.email = 'reviewer@cijj.test'`) === "t", "reactivating works")

  // Moderation
  const diegoId = accounts.ids["diego@cijj.test"]
  await goto(`/miembros/${diegoId}`)
  await clickText("Ocultar (moderación)")
  await waitFor(dialog)
  await clickText("Ocultar perfil", dialog)
  await waitFor(`document.body.innerText.includes("Oculto del directorio por moderación")`)
  check((await evaluate("document.body.innerText")).includes("Oculto del directorio por moderación"), "the admin hides a profile and sees the notice")
  await goto("/panel/consejo")
  check((await textOf("section")).includes("Diego Hernández"), "the hidden profile is listed in the panel")

  await signIn("sofia@cijj.test")
  await waitFor(`document.querySelector("ul h2")`)
  check(!(await textOf("ul h2")).includes("Diego"), "other members no longer see it in the directory")
  await goto(`/miembros/${diegoId}`)
  const body = await evaluate("document.body.innerText")
  check(body.includes("404") || body.toLowerCase().includes("not found"), "not even through its direct link")

  await signIn("diego@cijj.test")
  await goto("/mi-perfil")
  check((await alertText()).includes("El Consejo ocultó tu perfil"), "the owner sees the moderation notice")

  await signIn("admin@cijj.test")
  await goto("/panel/consejo")
  await clickText("Restaurar")
  await waitFor(dialog)
  await clickText("Restaurar", dialog)
  await waitFor(`!${dialog}`)
  await wait(800)
  check(sql(`select is_suspended from profiles where user_id = '${diegoId}'`) === "f", "restoring puts it back in the directory")

  // Deleting events is admin-only
  const eventId = sql(`select id from events where slug = 'evento-prueba-e2e'`)
  await goto(`/panel/eventos/${eventId}`)
  check((await evaluate("document.body.innerText")).includes("Eliminar evento"), "the admin sees Delete event")
  await signIn("reviewer@cijj.test")
  await goto(`/panel/eventos/${eventId}`)
  check(!(await evaluate("document.body.innerText")).includes("Eliminar evento"), "the reviewer does not see Delete event")
  check(!(await evaluate(`!!document.querySelector('a[href="/panel/consejo"]')`)), "the reviewer does not see the Consejo section")

  // The invited person signs up and joins the board
  await browser.clearCookies()
  const previous = (await emailsTo("carla@cijj.test")).length
  await fillSignUp("Carla Invitada", "carla@cijj.test", "Clave-carla-2026")
  check((await alertText()).includes("Te enviamos un correo"), "a person invited to the board can sign up without an application")
  const { confirmLink } = await readEmail(await waitForEmail("carla@cijj.test", previous))
  await browser.clearCookies()
  await goto(confirmLink)
  await goto("/panel/consejo")
  check((await path()) === "/panel/consejo", "and enters the panel as an admin", await path())
}

async function deleteAccountFlow() {
  console.log("\nDelete account")
  await signIn("reviewer@cijj.test")
  await goto("/mi-perfil")
  await clickText("Eliminar mi cuenta")
  await waitFor(dialog)
  await clickText("Eliminar mi cuenta", dialog)
  await waitFor(`document.querySelector("[role=alertdialog] [role=alert]")`)
  check((await textOf("[role=alertdialog] [role=alert]")).includes("Eres parte del Consejo"), "a board member cannot delete their account before being deactivated")
  await browser.pressEscape()

  const paolaId = sql(`select id from auth.users where email = 'paola@cijj.test'`)
  await signIn("paola@cijj.test", "Clave-segura-2026")
  await goto("/mi-perfil")
  await clickText("Eliminar mi cuenta")
  await waitFor(dialog)
  await clickText("Eliminar mi cuenta", dialog)
  await waitFor(`location.pathname === "/ingresar"`, 10000)
  check((await path()) === "/ingresar?notice=account-deleted", "deletes the account and confirms it", await path())
  check((await alertText()).includes("se eliminaron"), "shows the account-deleted notice")
  check(sql(`select count(*) from auth.users where email = 'paola@cijj.test'`) === "0", "the account no longer exists")
  check(sql(`select count(*) from profiles where user_id = '${paolaId}'`) === "0", "the profile was deleted")
  check(sql(`select count(*) from storage.objects where bucket_id = 'profiles' and name like '${paolaId}/%'`) === "0", "their photos were deleted from Storage")
  await goto("/mi-perfil")
  check((await path()).startsWith("/ingresar"), "the session is gone")
}

async function unusedPhotoCleanupFlow() {
  console.log("\nUnused photo cleanup")
  const userId = accounts.ids["jorge@cijj.test"]
  const folder = () => sql(`select coalesce(string_agg(name, ',' order by created_at), '') from storage.objects where bucket_id = 'profiles' and name like '${userId}/%'`).split(",").filter(Boolean)
  const upload = async (file) => {
    const before = await evaluate(`document.querySelector("input[name=photoPath]").value`)
    await browser.uploadFile("input[type=file]", fixture(file))
    await waitFor(`document.querySelector("input[name=photoPath]").value !== ${JSON.stringify(before)}`)
    return evaluate(`document.querySelector("input[name=photoPath]").value`)
  }
  const save = async () => {
    await clickText("Guardar cambios")
    await waitForAlert("Perfil guardado")
  }

  await signIn("jorge@cijj.test")
  await goto("/mi-perfil")
  check(folder().length === 0, "the member starts without photos")
  await upload("photo-1.png")
  await goto("/miembros")
  check(folder().length === 1, "leaving without saving leaves an orphan photo")

  await goto("/mi-perfil")
  const kept = await upload("photo-2.png")
  check(folder().length === 1 && folder()[0] === kept, "uploading a new photo deletes the orphan", JSON.stringify(folder()))
  await save()
  check(sql(`select photo_path from profiles where user_id = '${userId}'`) === kept, "the new photo is saved on the profile")

  await upload("photo-3.png")
  await goto("/mi-perfil")
  await save()
  check(folder().length === 1 && folder()[0] === kept, "saving without using the new upload deletes it and keeps the profile photo", JSON.stringify(folder()))

  await goto("/mi-perfil")
  await clickText("Quitar")
  await save()
  check(folder().length === 0, "removing the photo and saving empties the folder")
  check(sql(`select count(*) from storage.objects where bucket_id = 'profiles' and name like '${accounts.ids["sofia@cijj.test"]}/%'`) === "1", "other members' photos are untouched")
}

try {
  await signUpFlow()
  await profilePhotoFlow()
  await passwordResetFlow()
  await boardFlow()
  await deleteAccountFlow()
  await unusedPhotoCleanupFlow()
} catch (error) {
  failed++
  console.log(`  ✗ ERROR: ${error.message} (at ${await path().catch(() => "?")})`)
  await browser.screenshot("failure").catch(() => {})
}

browser.close()
console.log(failed ? `\n${failed} failed, ${passed} passed` : `\nAll ${passed} checks passed`)
process.exit(failed ? 1 : 0)
