#!/usr/bin/env bash
# End-to-end tests: disposable local Supabase (Docker) + production build of the app + real headless Chrome.
# Requirements: Docker running, psql (brew install postgresql) and Google Chrome (or CHROME_PATH).
# E2E_KEEP=1 leaves the app and Supabase running afterwards to debug a failure.
# Never touches the real Supabase project: everything runs on 127.0.0.1 and is deleted at the end.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
APP_PORT="${E2E_APP_PORT:-3123}"
ARTIFACTS_DIR="$ROOT/e2e/.artifacts"
SUPABASE=(pnpm dlx supabase@latest)
APP_PID=""
APP_PORT_BUSY=""

cleanup() {
  if [ "${E2E_KEEP:-}" = "1" ]; then
    echo "E2E_KEEP=1: app on http://localhost:$APP_PORT, Supabase project in $WORK_DIR (stop it with: cd $WORK_DIR && pnpm dlx supabase@latest stop --no-backup; kill $APP_PID)"
    return
  fi
  # Killing pnpm leaves the Next.js server running: stop whatever listens on the port (checked free at start).
  [ -z "${APP_PORT_BUSY:-}" ] && { lsof -ti "tcp:$APP_PORT" | xargs kill >/dev/null 2>&1 || true; }
  (cd "$WORK_DIR" && "${SUPABASE[@]}" stop --no-backup >/dev/null 2>&1) || true
  rm -rf "$WORK_DIR"
  # The build points at the local Supabase: never leave it behind. Route types are regenerated so `tsc` keeps working.
  rm -rf "$ROOT/.next"
  (cd "$ROOT" && pnpm exec next typegen >/dev/null 2>&1) || true
}
trap cleanup EXIT

for tool in docker psql; do
  command -v "$tool" >/dev/null || { echo "Missing $tool."; exit 1; }
done
docker info >/dev/null 2>&1 || { echo "Docker is not running."; exit 1; }
if lsof -ti "tcp:$APP_PORT" >/dev/null 2>&1; then
  APP_PORT_BUSY=1
  echo "Port $APP_PORT is busy; free it or set E2E_APP_PORT."
  exit 1
fi

echo "== Local Supabase"
cd "$WORK_DIR"
"${SUPABASE[@]}" init </dev/null >/dev/null 2>&1
mkdir -p supabase/migrations supabase/templates
cp "$ROOT"/supabase/migrations/*.sql supabase/migrations/
cp "$ROOT"/supabase/templates/*.html supabase/templates/
node "$ROOT/e2e/configure-supabase.mjs" supabase/config.toml "$APP_PORT"
"${SUPABASE[@]}" stop --project-id cijj-e2e --no-backup >/dev/null 2>&1 || true
"${SUPABASE[@]}" start -x studio,realtime,edge-runtime,imgproxy,logflare,vector,supavisor,postgres-meta >/dev/null
STATUS="$("${SUPABASE[@]}" status -o json 2>/dev/null)"
read_status() { echo "$STATUS" | node -e "const s = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log($1)"; }
export SUPABASE_URL="$(read_status 's.API_URL')"
export SUPABASE_SECRET_KEY="$(read_status 's.SECRET_KEY ?? s.SERVICE_ROLE_KEY')"
export DB_URL="$(read_status 's.DB_URL')"
export MAILPIT_URL="$(read_status 's.MAILPIT_URL ?? s.INBUCKET_URL ?? "http://127.0.0.1:54324"')"
PUBLISHABLE_KEY="$(read_status 's.PUBLISHABLE_KEY ?? s.ANON_KEY')"

echo "== Test data"
export ACCOUNTS_FILE="$WORK_DIR/accounts.json" FIXTURES_DIR="$ROOT/e2e/fixtures" ARTIFACTS_DIR
cd "$ROOT"
node e2e/seed.mjs

echo "== App build against the local Supabase"
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$PUBLISHABLE_KEY" NEXT_PUBLIC_SITE_URL="http://localhost:$APP_PORT"
pnpm build >/dev/null
pnpm start -p "$APP_PORT" >"$WORK_DIR/app.log" 2>&1 &
APP_PID=$!
disown "$APP_PID"
curl -s -o /dev/null --retry 30 --retry-connrefused --retry-delay 1 "http://localhost:$APP_PORT/"
# Warm up the routes so the first flows don't race a cold server.
for route in / /registro /ingresar /recuperar /miembros /mi-perfil /panel/ingresar; do
  curl -s -o /dev/null "http://localhost:$APP_PORT$route"
done

echo "== Flows"
rm -rf "$ARTIFACTS_DIR"
BASE_URL="http://localhost:$APP_PORT" node e2e/flows.mjs
