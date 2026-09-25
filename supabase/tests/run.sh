#!/usr/bin/env bash
# Tests the migrations and permissions (RLS, roles, functions) on a disposable local Postgres.
# Requires Postgres installed (brew install postgresql). Never touches Supabase or any real data.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${TEST_DB_PORT:-54329}"
DATA_DIR="$(mktemp -d)"
trap 'pg_ctl -D "$DATA_DIR" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA_DIR"' EXIT

initdb -D "$DATA_DIR" -U postgres -A trust >/dev/null
pg_ctl -D "$DATA_DIR" -o "-p $PORT -k '' -c listen_addresses=127.0.0.1" -l "$DATA_DIR/log.txt" -w start >/dev/null

PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -c "create database tests"
"${PSQL[@]}" -d tests -f "$ROOT/supabase/tests/supabase-stub.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  "${PSQL[@]}" -d tests -f "$migration"
done

"${PSQL[@]}" -d tests -t -f "$ROOT/supabase/tests/permissions.sql" 2>&1 | grep -E "NOTICE|ERROR|FAILED|PASSED" | sed -E 's/^.*NOTICE:  /  /'
