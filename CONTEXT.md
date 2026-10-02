# CONTEXT.md — PrimeCoat session log

This file is the hand-off between development sessions. Update it at the end of every major session. Newest entry first.

---

## Current state at a glance

| Area | Status |
|---|---|
| Planning docs (PRD, AGENTS, README, CONTEXT) | ✅ Complete |
| Next.js scaffold | ✅ Next 16.3 · TS strict · Tailwind v4 · pnpm |
| UI (homepage, shop, product, services, projects, cart, checkout, account, orders) | ✅ Complete against static catalogue; verified at 375 px and 1440 px |
| Supabase Auth + Google OAuth | ⬜ Not started (needs user config) |
| Database migrations + RLS + seed | ⬜ Not started |
| Cart + checkout + `create_order` | ⬜ Not started |
| Orders + account pages wired to DB | ⬜ Not started |
| Mailgun confirmation email | ⬜ Not started (needs user config) |
| Tests | ⬜ Not started |
| Vercel deployment | ⬜ Not started (needs user config) |
| Production E2E | ⬜ Not started |

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
