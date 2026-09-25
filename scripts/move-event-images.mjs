// ONE-TIME script: copies the event images from the old "eventos" bucket to the "events" bucket,
// keeping the same paths (event.cover_path and event_photos.path stay valid), then deletes the old bucket.
// Run it after supabase/scripts/rename-schema-to-english.sql (see docs/go-live.md):
//
//   SUPABASE_URL=https://<project>.supabase.co SUPABASE_SECRET_KEY=<secret key> node scripts/move-event-images.mjs
//   ...add --apply to actually copy and delete (without it, it only lists what it would do).
//
// The secret (service role) key is only passed on the command line: never save it in the repo or in .env files.
import { createClient } from "@supabase/supabase-js"

const OLD_BUCKET = "eventos"
const NEW_BUCKET = "events"
const apply = process.argv.includes("--apply")

const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
if (!url || !secretKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY.")
  process.exit(1)
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
const storage = supabase.storage

// Lists every file in the bucket, walking folders recursively (folders come back without an id).
async function listFiles(prefix = "") {
  const files = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await storage.from(OLD_BUCKET).list(prefix, { limit: 100, offset })
    if (error) throw new Error(`Could not list "${prefix}": ${error.message}`)
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id) files.push(path)
      else files.push(...(await listFiles(path)))
    }
    if (data.length < 100) return files
  }
}

const { data: oldBucket } = await storage.getBucket(OLD_BUCKET)
if (!oldBucket) {
  console.log(`The "${OLD_BUCKET}" bucket no longer exists: nothing to move.`)
  process.exit(0)
}
const { data: newBucket } = await storage.getBucket(NEW_BUCKET)
if (!newBucket) {
  console.error(`The "${NEW_BUCKET}" bucket does not exist yet. Run supabase/scripts/rename-schema-to-english.sql first.`)
  process.exit(1)
}

const files = await listFiles()
console.log(`${files.length} file(s) in "${OLD_BUCKET}".`)

if (!apply) {
  files.forEach((path) => console.log(`  would copy ${path}`))
  console.log(`\nDry run. Add --apply to copy them to "${NEW_BUCKET}" and delete "${OLD_BUCKET}".`)
  process.exit(0)
}

let failures = 0
for (const path of files) {
  const { error } = await storage.from(OLD_BUCKET).copy(path, path, { destinationBucket: NEW_BUCKET })
  // An existing destination means a previous run already copied it.
  if (error && !/exists/i.test(error.message)) {
    failures++
    console.error(`  ✗ ${path}: ${error.message}`)
  } else {
    console.log(`  ✓ ${path}`)
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) failed. "${OLD_BUCKET}" was NOT deleted; run the script again.`)
  process.exit(1)
}

for (let i = 0; i < files.length; i += 100) {
  const { error } = await storage.from(OLD_BUCKET).remove(files.slice(i, i + 100))
  if (error) throw new Error(`Could not empty "${OLD_BUCKET}": ${error.message}`)
}
const { error: deleteError } = await storage.deleteBucket(OLD_BUCKET)
if (deleteError) throw new Error(`Could not delete "${OLD_BUCKET}": ${deleteError.message}`)

console.log(`\nDone: ${files.length} file(s) now in "${NEW_BUCKET}" and "${OLD_BUCKET}" was deleted.`)
