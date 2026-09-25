import { execFileSync } from "node:child_process"

// Runs a query against the local Supabase database and returns the unaligned text result.
export function sql(query) {
  const url = process.env.DB_URL
  if (!url?.includes("127.0.0.1")) throw new Error("DB_URL must point to the local Supabase database.")
  return execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-c", query]).toString().trim()
}
