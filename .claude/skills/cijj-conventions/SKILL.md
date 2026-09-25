---
name: cijj-conventions
description: Conventions of the Colectivo de Ingenieros Jóvenes de Jalisco (CIJJ) website. Load it BEFORE creating or changing pages, components, copy, styles, server actions, validations or SQL in this repo — English code with Spanish UI, where content lives, brand tokens, form patterns, auth/roles, emails and Next.js 16 specifics.
---

# CIJJ project conventions

Website of the **Colectivo de Ingenieros Jóvenes de Jalisco A.C.** (founded January 1, 2016, VII Consejo Directivo). Stack: Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS 4, shadcn/ui `base-nova` style on **Base UI** (not Radix), Zod 4, Supabase, Resend, deployed on Vercel.

## Language

- **All code is in English**: identifiers, file and folder names, comments, log messages, test descriptions, env vars and every SQL object (tables, columns, enums, functions, policies, buckets, error codes).
- **Everything the user sees stays in Spanish (es-MX)**: UI copy, labels, aria-labels, alt text, metadata, user-facing error messages and email copy, with accents and opening marks (¡ ¿).
- **Public URL paths stay in Spanish** (`/miembros`, `/eventos`, `/ingresar`, `/registro`, `/mi-perfil`, `/panel/solicitudes`, `/panel/consejo`, `/aviso-de-privacidad`…) and so do the route folders that produce them and the in-page anchors linked from navigation (`#nosotros`, `#pilares`, `#unete`…). Route **groups** are English: `(account)`, `(network)`, `panel/(board)`.
- Query params and internal endpoints are English (`?next=`, `?notice=`, `?error=invalid-link`, `/auth/session`).
- Brief comments, only to explain the why.

## Structure

| What | Where |
| --- | --- |
| Copy, pillars, activities, FAQ, social links | `src/content/site.ts` — never hardcode repeated content in components |
| Public site pieces and home sections | `src/components/site/`, `src/components/site/sections/` |
| shadcn primitives | `src/components/ui/` (add with `pnpm dlx shadcn@latest add <component>`) |
| Server actions (`"use server"`) | `src/actions/` |
| Zod schemas and form-state types | `src/lib/validations/` |
| Supabase clients | `src/lib/supabase/` (`server.ts`, `session.ts`, `browser.ts`, `proxy.ts`) |
| Email (Resend + Supabase templates) | `src/lib/email/` |
| SQL migrations / tests / one-off scripts | `supabase/migrations/`, `supabase/tests/`, `supabase/scripts/` (see skill `supabase-migrations`) |
| Images | `public/images/` (provisional stock in `public/images/stock/`), brand in `public/brand/` |

## Home page and UI patterns

- `src/app/page.tsx` only composes sections from `src/components/site/sections/` in this order: Hero → Stats → About → Pillars → Activities → Benefits → Faq → Join. Each anchored section has an `id` matching `navigation` in `site.ts`.
- Section titles with `SectionHeading` (props `light` for dark backgrounds, `centered`).
- Subtle motion: wrap blocks in `Reveal` (`as="li"` inside lists, `delay` to stagger) and numbers in `Counter`. All motion respects `prefers-reduced-motion`.
- Brand button variants in `button.tsx`: `variant="accent"` (orange, main CTA), `variant="light"` (on blue backgrounds) and `size="xl"`. Don't override button colors with `className`. **Never overwrite `src/components/ui/button.tsx`** when installing shadcn components.
- Mobile navigation with `Sheet` (Base UI: triggers with `render={<Button />}`, links with `render={<Link />}` + `nativeButton={false}`).
- Prefer shadcn primitives over custom markup: `Alert` (through `Notice` in `src/components/site/notice.tsx`, variants `error`/`success`/`warning`), `Avatar` (through `MemberAvatar`, which uses `getImageProps` from next/image), `Switch`, `Checkbox`, `RadioGroup` (option cards with `FieldLabel` > `Field`), `InputGroup`, `Empty`, `Skeleton` (in `loading.tsx`), `DropdownMenu`, `Separator`.
- `Switch`/`Checkbox`: the label points at them with `htmlFor`; never wrap them in the label (it toggles twice). They submit `"on"` like a native checkbox.
- Card grids: explicit `grid-cols-1` and `min-w-0` on children, otherwise `truncate` text overflows on mobile.
- The header knows the session by fetching `/auth/session` from the browser only when a `*-auth-token` cookie exists, so public pages stay static.
- Design mobile-first (~360–500px).

## Forms and server actions

1. Zod schema in `src/lib/validations/` with Spanish messages; export the form state as a union discriminated by `status` (`"idle" | "success" | "error"`, with `message`, `errors`, `values`).
2. The action receives `(previousState, formData)`, validates with `safeParse` and returns errors with `z.flattenError(error).fieldErrors` plus the submitted `values`.
3. The form is a Client Component with `useActionState`; fields use `defaultValue`, `aria-invalid` and `aria-describedby`. Field `name=` attributes are English camelCase and must match the action's `formData.get()` keys.
4. Public forms include the `website` honeypot field.
5. Never trust the client: validate and authorize inside every action. Never ship the Supabase secret/service-role key to the browser.
6. Action results for buttons: `{ ok: true } | { ok: false; message }`.

## Auth, roles and access

- Sessions with `@supabase/ssr`: `createSessionSupabaseClient()` (reads cookies first, then env) and `src/proxy.ts` → `updateSession()`. Never `getSession()` on the server; use `getClaims()`.
- Layered authorization: proxy (optimistic) → `requireBoardMember()` / `requireBoardAdmin()` (`src/lib/panel/session.ts`) or `requireMember()` (`src/lib/members/session.ts`) in every page, query and action → RLS with `private.is_board_member()`, `private.is_board_admin()`, `private.is_member()`. No layer replaces the others.
- Member = approved membership application, `private.authorized_emails`, or active board member. Sign-up is filtered by the `hook_only_authorized_emails` Auth Hook (email and Google; not admin-API users, which RLS still blocks).
- Roles: `reviewer` (applications, create/edit events, registrations) and `admin` (plus board management at `/panel/consejo`, deleting events, moderating profiles). The board can never be left without an active admin (`LAST_ADMIN`).
- Database errors raised with `P0001` use English codes (`EVENT_FULL`, `ADMINS_ONLY`, `LAST_ADMIN`, `EMAIL_NOT_AUTHORIZED`, `IS_BOARD_MEMBER`…); map them to Spanish messages in the app.

## Events

- Public: `src/app/eventos/` and the `UpcomingEvents` section. Reads with the anon client in `src/lib/events/public.ts` (memoized with `cache`).
- Caching (the project does NOT use Cache Components): public pages export `revalidate`, and panel actions call their revalidation helper (home, `/eventos`, detail, sitemap and panel).
- Registration only through `public.register_for_event` (security definer): locks the event for capacity, detects members by approved email, computes `amount_due` and `confirmation_code`.
- `events.spots_taken` is maintained by a trigger; never written by the app.
- Dates are stored in UTC and shown/entered in `America/Mexico_City` (`src/lib/events/format.ts`, `form.ts`).
- Images: public `events` bucket (≤5 MB, JPG/PNG/WebP). Two-step upload: `createImageUpload` (server, board check, signed URL) → `uploadToSignedUrl` in the browser → `confirmCoverImage`/`addGalleryPhoto`. New paths `{eventId}/{cover|gallery}/{uuid}.{ext}` (older `portada`/`galeria` paths remain valid).

## Emails

- All emails share `wrapEmail()` in `src/lib/email/templates.ts` (logo `public/brand/email-logo.png`, brand colors, tagline). App emails are sent with `sendEmail` inside `after()`; it never throws and sends nothing without `RESEND_API_KEY` and `EMAIL_FROM`.
- Supabase templates (6 auth + 7 security notifications) are GENERATED from `src/lib/email/auth-templates.ts` into `supabase/templates/` with `pnpm emails:supabase`; never edit those HTML files by hand (a test catches drift). Links go to `{{ .SiteURL }}/auth/confirm?token_hash=…&type=…&next=…` (verifyOtp, works across devices); Google uses `/auth/callback` (PKCE).

## SEO

- Absolute URLs always with `getSiteUrl()` from `src/lib/site-url.ts` (NEXT_PUBLIC_SITE_URL → Vercel production domain → localhost). Never hardcode domains.
- Global metadata in `src/app/layout.tsx`. Each new page exports `metadata` with `title`, `description`, `alternates.canonical` and `openGraph.url`.
- Every new public page goes into `src/app/sitemap.ts`. Private routes are excluded from the sitemap, blocked in `src/app/robots.ts` and set `robots: { index: false }`.
- Only production is indexable (`isIndexable()`).
- Structured data with `<JsonLd data={…} />` and builders in `src/lib/seo/structured-data.ts`, generated from `site.ts`.
- The share image is `src/app/opengraph-image.tsx` (Satori: flexbox only; WOFF/TTF fonts in `src/assets/fonts/`).
- Guide for the Consejo (Search Console, domain): `docs/seo.md`.

## Brand

- Logo colors as Tailwind utilities: `brand-blue` (`#10436f`), `brand-navy` (`#0a2c4a`), `brand-orange` (`#e27227`), e.g. `bg-brand-blue`, `text-brand-orange`, `ring-brand-blue/10`. `--primary` points at the blue. Don't introduce other brand colors.
- Fonts: `font-heading` = Oswald (titles, uppercase), `font-sans` = Source Sans 3 (body).
- Tagline: “¡Cuando la ingeniería se une, Jalisco avanza!”. Pillars: Empresarial, Gremial, Académico, Político, Técnico.
- `public/brand/logo.svg` is a provisional recreation of the official logo.

## Provisional content

- Any copy, image or data not confirmed by the Consejo is marked with a `// Provisional: …` comment (or a visible note in legal documents).
- Never invent figures, board member names, emails or phone numbers. If data is missing, make it configurable and ask.
- Confirmed membership requirement: being over 18.

## Next.js 16

- Before using a Next API, read the matching guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).
- `next/image`: `priority` is deprecated; use `loading="eager"` and `fetchPriority="high"`. Only quality `75` is allowed by default.
- Global `LayoutProps<"/route">` and `PageProps<"/route">` types for layouts and pages.

## Deployment (overrides `deploy-to-vercel`)

- Ask for explicit confirmation before every `vercel link`, `git commit`, `git push` or `vercel deploy`.
- **Never** use the "no-auth fallback" (`resources/deploy.sh` or `deploy-codex.sh`).
- Never `git add .` blindly: review `git status` and add specific files; never commit `.env.local` or real keys (`.env.example` holds empty values only).
- Production deploys only when the user asks (push to `main` = production).

## Tooling and tests

- Package manager: **pnpm**, pinned in `package.json`. TypeScript 6.0 and ESLint 9 on purpose (typescript-eslint and eslint-plugin-react compatibility).
- Unit tests with Vitest (`pnpm test`), `*.test.ts` next to the module. Every new validation, template or helper gets a test.
- SQL permission tests: `pnpm test:db` (disposable local Postgres, `supabase/tests/`). Every new policy or function gets a scenario.
- End-to-end flows: `pnpm test:e2e` (local Supabase + real Chrome, `e2e/`). Every new user-facing flow gets a function in `e2e/flows.mjs`.
- Verification: see skill `run-and-verify`.
