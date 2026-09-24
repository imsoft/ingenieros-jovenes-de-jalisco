#!/usr/bin/env bash
# Prueba las migraciones y los permisos (RLS, roles, funciones) en un Postgres local desechable.
# Requiere Postgres instalado (brew install postgresql). No toca Supabase ni ningún dato real.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
PUERTO="${PUERTO_PRUEBAS:-54329}"
DATOS="$(mktemp -d)"
trap 'pg_ctl -D "$DATOS" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATOS"' EXIT

initdb -D "$DATOS" -U postgres -A trust >/dev/null
pg_ctl -D "$DATOS" -o "-p $PUERTO -k '' -c listen_addresses=127.0.0.1" -l "$DATOS/log.txt" -w start >/dev/null

P=(psql -h 127.0.0.1 -p "$PUERTO" -U postgres -v ON_ERROR_STOP=1 -q)
"${P[@]}" -c "create database prueba"
"${P[@]}" -d prueba -f "$RAIZ/supabase/pruebas/supabase-minimo.sql"
for migracion in "$RAIZ"/supabase/migrations/*.sql; do
  "${P[@]}" -d prueba -f "$migracion"
done

"${P[@]}" -d prueba -t -f "$RAIZ/supabase/pruebas/permisos.sql" 2>&1 | grep -E "NOTICE|ERROR|FALLÓ|PASARON" | sed -E 's/^.*NOTICE:  /  /'
