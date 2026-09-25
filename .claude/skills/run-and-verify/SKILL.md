---
name: run-and-verify
description: How to run, build and visually verify the CIJJ site. Use it to run the project, confirm a change works, before calling a task done or before commit/deploy — includes typecheck, lint, unit and SQL tests, build and desktop/mobile screenshots with headless Chrome.
---

# Run and verify the CIJJ site

Run from the repo root. Package manager: **pnpm**.

## Commands

| Goal | Command |
| --- | --- |
| Install dependencies | `pnpm install` |
| Development (http://localhost:3000) | `pnpm dev` |
| Types | `pnpm exec tsc --noEmit` |
| Lint | `pnpm lint` (must finish without errors) |
| Unit tests | `pnpm test` |
| SQL permission tests (local Postgres) | `pnpm test:db` |
| End-to-end flows (local Supabase + real Chrome) | `pnpm test:e2e` (~2 min) |
| Regenerate Supabase email templates | `pnpm emails:supabase` |
| Production build | `pnpm build` |
| Serve the build | `pnpm start -p 3100` |

Without `.env.local`, the membership form simulates success in development without saving and shows an "unavailable" notice in production. This is expected.

## Minimum verification before finishing

1. `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test` without errors (`pnpm test:db` when SQL changed, `pnpm test:e2e` when auth, profiles, the panel, events or emails changed).
2. `pnpm build` completes and lists the expected routes.
3. Visual check of the affected pages on desktop and mobile (below).
4. Report honestly what could not be tested (e.g. real Supabase writes without credentials).

## End-to-end tests (`pnpm test:e2e`)

`e2e/run.sh` spins up a disposable local Supabase (Docker, latest CLI via `pnpm dlx`) with the repo migrations, branded templates, sign-up hook and security notifications; seeds members, board and an event (`e2e/seed.mjs`); builds the app against it; and drives headless Chrome through `e2e/flows.mjs`: sign-up and email confirmation (via Mailpit), profile photos, password reset, board management and moderation, account deletion and unused photo cleanup.

- Requirements: Docker running, `psql`, Google Chrome (or `CHROME_PATH`). Port 3123 must be free (`E2E_APP_PORT` to change it) and no other local Supabase stack on the default ports.
- Everything is removed at the end: Supabase containers and volumes, the app server and the `.next` build (route types are regenerated so `tsc` keeps working).
- On failure a screenshot lands in `e2e/.artifacts/failure.png`; `E2E_KEEP=1 pnpm test:e2e` leaves the app and Supabase running to debug.
- New user-facing flows get a function in `e2e/flows.mjs`; assert the Spanish UI copy, write everything else in English.

## Screenshots with headless Chrome

1. Start the build in the background: `pnpm start -p 3100` (with `run_in_background`).
2. Wait with curl retries (no `sleep`) and capture:

```bash
S="<scratchpad directory>"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
curl -s -o /dev/null -w "HTTP %{http_code}\n" --retry 30 --retry-connrefused --retry-delay 1 http://localhost:3100/
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 \
  --window-size=1440,5200 --screenshot="$S/desktop.png" http://localhost:3100/
"$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=6000 \
  --window-size=500,1400 --screenshot="$S/mobile.png" http://localhost:3100/
```

For true 390px mobile widths or signed-in pages, drive Chrome over CDP (`Emulation.setDeviceMetricsOverride`).

3. Open the images with Read and check: horizontal overflow, clipped text, contrast, spacing and that the "Únete" button is visible.
4. Stop the server: `lsof -ti tcp:3100 | xargs kill`.

## Known pitfalls

- Headless Chrome CLI **does not honor widths under ~500px**; use CDP for narrower widths.
- A large blank area at the bottom of a desktop capture is usually the window taller than the page, not a bug.
- Save screenshots in the session scratchpad, never in the repo.
- The image optimizer caches by URL: when replacing a file at the same path during tests, clear `.next/cache/images`.
