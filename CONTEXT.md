# CONTEXT.md — PrimeCoat session log

This file is the hand-off between development sessions. Update it at the end of every major session. Newest entry first.

---

## Current state at a glance

| Area | Status |
|---|---|
| Planning docs (PRD, AGENTS, README, CONTEXT) | ✅ Complete |
| Next.js scaffold | ✅ Next 16.3 · TS strict · Tailwind v4 · pnpm |
| UI (homepage, shop, product, services, projects, cart, checkout, account, orders) | ✅ Complete against static catalogue; verified at 375 px and 1440 px |
| Supabase Auth + Google OAuth | ✅ Verified against the live project (see Session 4) |
| Database migrations + RLS + seed | ✅ Applied to the live project; 32 products seeded; RLS verified |
| Cart + checkout + `create_order` | ✅ Verified end to end against the live database |
| Orders + account pages wired to DB | ✅ Verified (owner sees, other user gets 404) |
| Mailgun confirmation email | 🟡 Implemented; API accepts credentials; **sandbox rejects recipients not on the Authorized list** |
| Tests | ✅ 105 Vitest tests passing |
| Vercel deployment | ✅ Live at https://primecoatt.vercel.app (user deployed); Supabase + Mailgun env present |
| Production E2E | 🟡 Automated order flow passes on production; human Google sign-in + real email delivery pending |

---

## Session 7 — 4 October 2026 — Cart moved to Supabase (no browser storage)

### Why
User requirement: everything that persists must live in Supabase. An audit of production found exactly one browser-stored item, the Zustand cart under localStorage key `primecoat.cart.v1`.

### Changes
- Migration `20261004120000_server_cart.sql`: `cart_items` (user, product, quantity; unique per user+product; owner-only RLS for select/insert/update/delete), `profiles.delivery_state`, `cart_add_item()` (atomic increment clamped to stock, security invoker), and `create_order()` now deletes the buyer's cart rows and saves their delivery state **inside the order transaction**.
- `lib/cart/queries.ts` (request-cached server read, priced from current products), `app/cart/actions.ts` (add, set quantity, remove, set delivery state; each revalidates the layout).
- `POST /api/orders` takes only `{ customer }` and reads items from the Supabase cart; empty cart → 400 `CART_EMPTY`.
- Header badge count comes from the database. Cart, checkout and order summary are server-rendered from Supabase. Add to Cart while signed out → `/login?next=<product>`.
- Removed `lib/cart/store.ts`, `CartHydration` and the `zustand` dependency.

### Verified
- `pnpm verify:rls`: 20/20, including cart isolation (B cannot read, change or insert into A's cart; anon sees nothing) and the cart emptying inside `create_order()`.
- Browser E2E (local): signed-out add → login with return path; rows land in Supabase; badge counts from DB; a second browser sees the same cart; quantity, remove and delivery state persist; checkout prices from the DB cart (2 × ₦18,500 + Kano ₦7,500 = ₦44,500); cart empty after order. **localStorage and sessionStorage empty at every step.**
- 106 Vitest tests, typecheck, lint, build all pass.

### Remaining browser-side state
Only the Supabase auth cookie `sb-<ref>-auth-token`, required for the session.

---

## Session 6 — 2 October 2026 — Phase 9 deployment verified

### Verified on https://primecoatt.vercel.app
- `/`, `/shop` (32 products from Supabase), product pages, `/cart`, `/login` all 200. `/orders` and `/checkout` → 307 to `/login?next=…`. `/auth/callback` without code → `/login?error=auth`. Security headers present.
- Full automated order flow (two throwaway users, deleted afterwards): order `PC-20261002-0004` created from production, totals 42,600 + 2,500 = 45,100, two snapshot items, email = account email, `/orders` and `/orders/[id]` render, user B gets 404 everywhere and zero rows via REST, anonymous redirected, cart cleared, fresh session still sees the order.
- `confirmation_email_status = 'failed'` with the Mailgun **403 authorised-recipient** reason — proves `MAILGUN_*` variables are set on Vercel and the only blocker is the sandbox recipient list.

### Not verifiable from here (user must confirm)
- Supabase → Authentication → URL Configuration: *Site URL* = `https://primecoatt.vercel.app`; *Redirect URLs* include `https://primecoatt.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`. Without the production entry, Google sign-in would bounce back to the Site URL instead of production.
- Vercel env `NEXT_PUBLIC_SITE_URL=https://primecoatt.vercel.app` (used only for links inside emails; OAuth uses the browser origin).
- Google Cloud consent screen: the reviewer's Google account is a test user, or the app is published.
- Mailgun authorised recipient for the Google account email.

### Next recommended task
Phase 10: the user performs the 12-step acceptance test in README on production with a real Google account and confirms the Mailgun email arrives. Then flip the status table to ✅ and record the order number here.

---

## Session 5 — 2 October 2026 — Phases 4–8 applied and verified

### Database (live project)
- Applied `20261002120000_initial_schema.sql`, `20261002120100_order_functions.sql`, `20261002130000_create_order_jsonb_lines.sql` with `pnpm db:push` (Supabase CLI `--db-url`, session pooler `aws-1-eu-west-3`). First attempt timed out while the CLI downloaded; the retry succeeded.
- Seeded 32 products (`pnpm db:seed`). Generated `lib/supabase/database.types.ts` (`pnpm db:types`).
- **Bug found and fixed:** the original `create_order()` used a temp table with `DELETE FROM tmp…` — rejected by Supabase's safeupdate guard (`21000 DELETE requires a WHERE clause`). Rewritten to accumulate lines in `jsonb` (migration 3).
- RLS probe as `anon`: products readable (32), orders/profiles/counters return `[]`, product insert 401, `create_order` 401 (`42501`), service-request insert 201 with `return=minimal`, select of requests `[]`. `calculate_delivery_fee` returns 2500/4000/5000/7500/0 as specified.

### End-to-end order flow (Playwright, two throwaway users, cleaned up afterwards)
- Profile row created by trigger. Shop renders 32 cards from the DB. Add 2× Sage Grove + 1× roller → cart shows 3 items / ₦42,600 → checkout (email locked) → **Place Order** → `/checkout/confirmation/PC-20261002-0001` with full receipt → cart cleared.
- Stored row: `subtotal 42600, delivery_fee 2500, total 45100`, two `order_items` with name/price snapshots, email = account email, `confirmation_email_status = 'failed'` with the Mailgun 403 reason recorded.
- `/orders` lists it; `/orders/[id]` shows it; a fresh session for the same user still sees it (persistence).
- User B: 404 on A's `/orders/[id]` and confirmation page, empty list, zero rows via REST with B's JWT. Anonymous → redirected to `/login?next=…`.
- API probes: over-stock 409 `INSUFFICIENT_STOCK` ("Only 3 of Professional Brush Set…"), out-of-stock 409, unknown product 409 `PRODUCT_UNAVAILABLE`, client `price` field ignored and duplicate lines merged (3 × ₦2,400 stored), empty cart 400, no session 401.

### Mailgun (Phase 7)
- Implemented `lib/mailgun/client.ts` (fetch + Basic auth, 15 s timeout, tags/variables), `templates/order-confirmation.ts` (table layout, escaped, HTML + text), `send-order-confirmation.ts`, `scripts/mailgun-test.ts`.
- `pnpm mailgun:test techdev2@tehcoop.com` → **403**: *"Free accounts are for test purposes only. Please upgrade or add the address to your authorized recipients."* Credentials and domain are therefore valid; the recipient is simply not authorised yet. **User action:** add the Google account email they will order with to Mailgun → Sending → Domains → sandbox → Authorized Recipients, confirm the verification email, then re-run the test and place a real order.

### Tests (Phase 8)
- Vitest configured (`vitest.config.ts`, `server-only` aliased to a no-op for tests). 105 tests: cart calculations incl. the delivery-fee matrix, checkout/cart/service-request schemas, email template (content, escaping, text part), currency/redirect/protected-path/filter parsing, order and product mappers, `create_order` error mapping, and `POST /api/orders` behaviour (401, 400, account-email override, email-failure still 201, 409 mapping, 500).

### Not yet done
- Human Google sign-in on the real consent screen (user).
- Real email delivery (blocked on authorised recipient).
- Phase 9 Vercel deployment and Phase 10 production E2E.

### Next recommended task
1. User adds the authorised recipient; re-run `pnpm mailgun:test <that email>`; then sign in with Google and place a real order; confirm the email arrives and `confirmation_email_status = 'sent'`.
2. Phase 9: create the Vercel project, set env vars, add production redirect URLs in Supabase and the production origin in Google Cloud, redeploy, run the acceptance test on production.

---

## Session 4 — 2 October 2026 — Phase 3 verified; Phases 4–6 code written

### Verified (live Supabase project `ddvpwizhnsorvqpizgog`, `.env.local` populated by the user)
- `/login` → **Continue with Google** navigates to accounts.google.com; Supabase's authorize hop sends `redirect_uri=https://<ref>.supabase.co/auth/v1/callback` with a client_id and `email profile` scope.
- With a real Supabase session (throwaway email/password user created via the admin API, cookies encoded exactly as `@supabase/ssr` does): `/account` shows the profile, `/orders` renders, `/checkout` pre-fills and locks the account email, `/login` bounces to `/account`, **Sign out** redirects home, and `/orders` then redirects to `/login?next=%2Forders`. Test user deleted afterwards. Script: scratchpad `auth-test.mjs` (not committed).
- Not yet exercised by a human: the Google consent screen itself and browser-restart persistence. Both are standard Supabase behaviour; the user should do one real Google sign-in to confirm their test-user list.

### Written this session (untested — database not yet migrated)
- `supabase/migrations/20261002120000_initial_schema.sql`: enums, `profiles` (+ `handle_new_user` trigger on insert/update of `auth.users`), `products`, `orders`, `order_items`, `order_number_counters`, `painting_service_requests`, indexes, RLS on every table with the policies from PRD §8.
- `supabase/migrations/20261002120100_order_functions.sql`: `calculate_delivery_fee`, `generate_order_number` (daily counter, Africa/Lagos), `create_order(p_customer, p_items)` — SECURITY DEFINER, requires `auth.uid()`, aggregates duplicate lines, locks products `FOR UPDATE`, validates stock, prices from `products`, forces the order email to `auth.jwt()->>'email'`, inserts order + items atomically, returns the order with items. Execute granted to `authenticated` only.
- `supabase/seed.sql` generated from `lib/products/seed-data.ts` (`pnpm seed:sql`); `scripts/seed.ts` upserts the same data via service role (`pnpm db:seed`).
- `scripts/db.ts`: `pnpm db:push` / `pnpm db:types` through `pnpm dlx supabase --db-url` (no CLI login needed).
- Data layer switched to Supabase: `lib/supabase/public.ts` (anon, cookie-less, for catalogue), `lib/supabase/admin.ts` (service role), `lib/products/{filters,mappers,queries}.ts` (Zod-validated rows), `lib/orders/{mappers,queries,create-order,mark-email-status}.ts`.
- `POST /api/orders` (401 → 400 → RPC → email after commit → status recorded → 201) and `POST /api/service-requests`.
- `/checkout/confirmation/[orderNumber]` now loads the real order (RLS-scoped, 404 for foreign orders) and renders the full receipt.
- `lib/mailgun/send-order-confirmation.ts` is a deliberate stub that **throws**, so orders record `confirmation_email_status = 'failed'` until Phase 7 — nothing pretends to send.
- Homepage and product pages use ISR (`revalidate = 600`).

### Known state
- Because `lib/products/queries.ts` now reads from Supabase and the tables do not exist yet, `/`, `/shop` and product pages render the error boundary until `pnpm db:push && pnpm db:seed` run. This is expected.

### Environment variables still required from the user
- `SUPABASE_DB_URL` (Session pooler URI with password) — to apply migrations and generate types.
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL` (+ optional `MAILGUN_API_BASE_URL`, `MAILGUN_REPLY_TO`) — Phase 7.
- `NEXT_PUBLIC_SITE_URL` — set to `http://localhost:3000` locally (defaults to that if absent).

### Next recommended task
1. `pnpm db:push` → `pnpm db:seed` → `pnpm db:types`; confirm tables, policies and 32 products in Supabase Studio.
2. Run the full checkout with a real session; confirm one `orders` row + `order_items`, totals match `calculate_delivery_fee`, `/orders` and `/orders/[id]` show it, a second user gets 404.
3. Phase 7 Mailgun.

---

## Session 3 — 2 October 2026 — Phase 3: Authentication (code written, awaiting credentials)

### Completed
- `lib/env.ts`: public env accessors, `isSupabaseConfigured()`, `requireServerEnv()`. The app renders fully when Supabase is not configured; auth-dependent UI degrades to "sign in" prompts instead of crashing.
- `lib/supabase/client.ts` (browser), `server.ts` (cookies-based, server-only), `middleware.ts` (`updateSession`, protected-path logic).
- `proxy.ts` (Next 16 middleware): refreshes the session with `auth.getUser()`, redirects anonymous users from `/checkout`, `/orders`, `/account` to `/login?next=…`, and bounces signed-in users off `/login`.
- `app/auth/callback/route.ts`: exchanges `?code` for a session, sanitises `next`, honours `x-forwarded-host` in production, redirects to `/login?error=auth` on failure or when unconfigured.
- `app/auth/actions.ts`: `signOut` server action.
- `lib/auth/session.ts`: `getCurrentUser()` (React-cached) mapping Google `user_metadata` to `{ id, email, fullName, avatarUrl, createdAt }`.
- `GoogleSignInButton` calls `signInWithOAuth({ provider: "google", redirectTo: <origin>/auth/callback?next=… })`; disabled with an explanatory note when unconfigured.
- `AccountMenu` is session-aware (avatar popover with Account / Orders / Sign out). `SignOutButton` component.
- `/login` redirects signed-in users; `/account` renders profile + recent orders + sign-out; `/checkout` pre-fills name/email from the session and locks the email field.
- Protected and session pages marked `dynamic = "force-dynamic"`.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` pass. Verified in unconfigured mode: all pages 200, `/auth/callback` without a code → 307 to `/login?error=auth`.

### Not yet verified (blocked on user configuration)
- Real Google sign-in round-trip, session persistence after browser restart, proxy redirects with a live session, sign-out. These need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` and the Google provider enabled in Supabase. See README → *Supabase setup* and *Google OAuth setup*.

### Next recommended task
Once credentials exist: run `pnpm dev`, sign in at `/login`, confirm redirect to `/account` with avatar, visit `/orders` (should render, empty), sign out, confirm `/orders` redirects to `/login?next=/orders`. Then **Phase 4 — Database**: migrations (enums, tables, RLS, `handle_new_user`, `calculate_delivery_fee`, `generate_order_number`, `create_order`), `supabase/seed.sql` generated from `lib/products/seed-data.ts`, switch `lib/products/queries.ts` to Supabase, generate `database.types.ts`.

---

## Session 2 — 2 October 2026 — Phase 2: UI

### Completed
- Scaffolded Next.js 16.3.8 (App Router, Turbopack, TypeScript strict, Tailwind v4, ESLint flat config) with pnpm. Dependencies installed: `@supabase/ssr`, `@supabase/supabase-js`, `zod` v4, `zustand`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `clsx`, `tailwind-merge`, `server-only`; dev: `vitest`, Testing Library, `jsdom`, `tsx`, `dotenv`.
- Design system: palette, type (Fraunces display + Inter body via `next/font`), focus rings and utilities in `app/globals.css`; UI primitives in `components/ui/`.
- Static catalogue of 32 products in `lib/products/seed-data.ts` (fixed UUIDs, NGN prices, sizes, colours, stock) and a generator that renders an on-brand SVG for each product into `public/images/products/`.
- Verified Unsplash photography registry (`lib/content/images.ts`) for hero, services, about and 14 project tiles; every image was viewed before use.
- Pages: `/`, `/shop` (search, category, price, in-stock, sort — all URL-driven, works without JS), `/products/[slug]` (SSG for all 32, related products, sticky mobile buy bar), `/services` (+ request form with Zod validation), `/projects` (category filter), `/about`, `/contact`, `/cart`, `/checkout`, `/checkout/confirmation/[orderNumber]`, `/orders`, `/orders/[id]`, `/account`, `/login`, root `not-found` and `error`.
- Cart: Zustand store persisted to `localStorage` under `primecoat.cart.v1` with `skipHydration` + `CartHydration` to avoid SSR mismatches; pure reducers and totals in `lib/cart/calculations.ts`; delivery-fee estimate by state.
- Checkout form fully built: react-hook-form + shared Zod schema, posts to `POST /api/orders`, clears cart only on success, redirects to confirmation, 401 → `/login?next=/checkout`.
- Validation schemas: `lib/validations/checkout.ts` (checkout, cart items, createOrder) and `service-request.ts`.
- Security headers and image `remotePatterns` in `next.config.ts`.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass (46 static/SSG routes). Visual review done via Playwright + installed Chrome at 375 px and 1440 px for home, shop, product, cart, checkout, services, projects, login, order-not-found and the mobile menu.

### Currently working
- Full browsing, filtering, product detail, add-to-cart, cart editing and the checkout form UI run locally with `pnpm dev`.
- Cart survives refresh.

### Incomplete (by design — later phases)
- `POST /api/orders` and `POST /api/service-requests` do not exist yet; submitting those forms shows the inline error state. (Phase 5)
- `/login` button is disabled; `/account` shows the sign-in prompt; `/orders` always empty; `/orders/[id]` always 404 (stubs in `lib/orders/queries.ts`). (Phases 3 and 6)
- Confirmation page shows only the order number from the URL. (Phase 6)
- `AccountMenu` in the header is a static link. (Phase 3)
- No tests written yet. (Phase 8)

### Bugs discovered and fixed this session
- Mobile menu was clipped to the header: `backdrop-filter` on the sticky header made it the containing block for the `fixed` panel. Fixed by portalling the menu to `document.body`.
- `/orders/[id]` returned HTTP 200 for unknown orders because `app/orders/loading.tsx` streamed the shell before `notFound()`. Removed the loading file; now returns 404.
- `react-hooks/set-state-in-effect` lint error in MobileNav: replaced the effect with "pathname the menu was opened on" derived state.
- pnpm refused to run scripts because `esbuild` postinstall was blocked; allowed it in `pnpm-workspace.yaml`.

### Environment variables still required from the user
Unchanged — none are needed to run the UI. Phase 3 needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the Google provider configured in Supabase.

### Database changes
- None applied. Catalogue lives in `lib/products/seed-data.ts` and will be emitted as `supabase/seed.sql` in Phase 4.

### Next recommended task
**Phase 3 — Authentication.** Add `lib/supabase/{client,server,middleware}.ts` with `@supabase/ssr`, `proxy.ts` to refresh sessions and guard `/checkout`, `/orders`, `/account`; `app/auth/callback/route.ts`; sign-out server action; wire `GoogleSignInButton`; make `AccountMenu` session-aware; pass the user's name/email into `CheckoutForm`. Requires the user's Supabase project + Google OAuth client first.

---

## Session 1 — 2 October 2026 — Phase 1: Planning

### Completed
- Created `PRD.md` with full product, functional, non-functional, security, database, checkout, email, responsive and deployment requirements, acceptance criteria, and phases.
- Created `AGENTS.md` with architecture, conventions, Supabase/Mailgun/security rules, environment variables, and a do-not-change list.
- Created `README.md` with setup, external-service configuration guides, HNG acceptance test and known limitations.
- Created `.env.example` and `.gitignore`.
- Fixed architecture decisions (see `AGENTS.md` §12): Postgres `create_order()` RPC for atomic, server-priced order creation; `@supabase/ssr` cookie sessions; Zustand cart; Mailgun via `fetch`; daily-sequence order numbers.

### Currently working
- Nothing runnable yet. Repository contains documentation only.

### Incomplete
- All application code (Phases 2–10).

### Bugs discovered
- None.

### Environment variables still required from the user
All of them. See `.env.example`. The user must create:
1. A Supabase project (URL + anon key; service-role key for seeding).
2. A Google Cloud OAuth client (client ID + secret, entered in the Supabase dashboard, not in this repo).
3. A Mailgun account (API key, domain, from address).
4. A Vercel project (for deployment).

### Database changes
- None applied yet. Schema is specified in `PRD.md` §8 and will be implemented as migrations in Phase 4.

### Next recommended task
**Phase 2 — UI.** Scaffold Next.js (App Router, TypeScript, Tailwind v4, pnpm), define design tokens and fonts, build layout (header, mobile nav, footer), then the homepage, shop, product detail, services, projects, about, contact, cart, checkout, account and orders pages using a typed static seed dataset that will be replaced by Supabase queries in Phase 4.
