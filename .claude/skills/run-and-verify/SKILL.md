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
| Regenerate Supabase email templates | `pnpm emails:supabase` |
| Production build | `pnpm build` |
| Serve the build | `pnpm start -p 3100` |

Without `.env.local`, the membership form simulates success in development without saving and shows an "unavailable" notice in production. This is expected.

## Minimum verification before finishing

1. `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test` without errors (`pnpm test:db` when SQL changed).
2. `pnpm build` completes and lists the expected routes.
3. Visual check of the affected pages on desktop and mobile (below).
4. Report honestly what could not be tested (e.g. real Supabase writes without credentials).

## Local Supabase for end-to-end checks

`pnpm dlx supabase@latest start` in a scratch folder with the repo migrations and templates gives real Auth, Storage and Mailpit (http://127.0.0.1:54324). Recent CLI versions are needed for security notifications. Build the app against it by exporting `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` before `pnpm build`, and rebuild with the normal env afterwards.

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
