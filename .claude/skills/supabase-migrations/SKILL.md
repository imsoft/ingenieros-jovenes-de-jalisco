---
name: supabase-migrations
description: Workflow for database changes of the CIJJ site on Supabase. Use it when creating or changing tables, columns, enums, indexes, functions, triggers or RLS policies, or when wiring code to a new table. Complements supabase-postgres-best-practices with this repo's own rules.
---

# Supabase migrations in CIJJ

Also load the `supabase-postgres-best-practices` skill before writing SQL.

## Rules

1. **One migration per change**; never edit a migration already applied to a real project. To fix something, create a new one.
2. File in `supabase/migrations/` named `YYYYMMDDHHMMSS_description_in_snake_case.sql` (UTC). Example: `20260914000000_membership_applications.sql`.
3. **English `snake_case` names**: plural tables (`membership_applications`), descriptive columns (`accepts_privacy_notice`), booleans prefixed `is_`/`has_` when natural (`is_active`), enums with a clear name (`application_status`). Error codes raised from functions are English UPPER_SNAKE (`EVENT_FULL`).
4. Every table has `id uuid primary key default gen_random_uuid()` (or a natural key), `created_at` and `updated_at timestamptz not null default now()`, and the `public.set_updated_at()` trigger (already exists; don't recreate it).
5. **RLS is mandatory**: `alter table … enable row level security;` in the same migration that creates the table, with explicit policies per operation and role. No policy = no access; never `using (true)` for public writes.
6. Enforce in the database what the public must not control (e.g. `with check (status = 'pending')`), besides validating with Zod in the server action.
7. Explicit privileges: `revoke all … from anon, authenticated` and column-level `grant`s (new tables are not exposed to the Data API automatically).
8. Add `check` constraints for lengths and required values Zod already validates: the database is the last line of defense.
9. Security helper functions live in the unexposed `private` schema, `security definer`, `set search_path = ''`.
10. Comment tables with `comment on table` (English).
11. Add a scenario to `supabase/tests/permissions.sql` for every new policy or function and run `pnpm test:db`.

## Access from code

- Public server operations: `createPublicSupabaseClient()` from `src/lib/supabase/server.ts` (anon key, subject to RLS). Returns `null` when env vars are missing; handle that case.
- Signed-in operations: `createSessionSupabaseClient()` from `src/lib/supabase/session.ts`.
- Public inserts without a `select` policy: don't chain `.select()` after `.insert()`, RLS would block the read.
- Postgres code `23505` = unique violation; map it to a friendly Spanish message.
- The secret (service role) key **only** in one-off admin scripts run by hand (e.g. `scripts/move-event-images.mjs`), passed on the command line, never in the app or in `.env` files.

## Applying migrations

- Until the project is linked to the CLI: paste the SQL into **Supabase → SQL Editor** and run it, in file-name order.
- With the CLI linked (`supabase link --project-ref …`): `supabase db push`.
- `supabase/scripts/` holds one-off scripts for existing databases (e.g. `rename-schema-to-english.sql`); new projects only need `supabase/migrations/`.
- After a schema change, update `.env.example` if there are new variables and tell the user which migration to apply.
