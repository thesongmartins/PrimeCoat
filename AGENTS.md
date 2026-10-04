# AGENTS.md — Instructions for AI coding agents working on PrimeCoat

Read this file completely before changing anything. Then read `CONTEXT.md` for the current state of the project and `PRD.md` for requirements.

---

## 1. Project overview

PrimeCoat is a production e-commerce site for a premium Nigerian paint company. It sells paints and accessories and takes painting-service requests. It was built as an HNG individual task, and the non-negotiable success criterion is:

> The complete authenticated shopping journey works with **real Supabase persistence** and a **real Mailgun confirmation email**.

Nothing in the final product may be mocked, faked or stored only in the browser. Orders live in Supabase. Auth is Supabase Auth + Google. Emails go through Mailgun's API.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Server components by default; `"use client"` only where interactivity is needed. `proxy.ts` not `middleware.ts`; async `params`/`searchParams`; `error.tsx` receives `retry`. Docs are bundled at `node_modules/next/dist/docs/`. |
| Language | TypeScript, `strict: true` | No `any` without a comment explaining why. |
| Styling | Tailwind CSS v4 | Design tokens in `app/globals.css` under `@theme`. |
| Database / Auth | Supabase (Postgres + Auth) | `@supabase/ssr` for cookie-based sessions. |
| Validation | Zod | Schemas in `lib/validations/`, shared by client forms and server handlers. |
| Persistence | Supabase only | **Nothing is stored in localStorage, sessionStorage or IndexedDB.** The cart is the `cart_items` table; the only browser-side state is the Supabase session cookie. |
| Email | Mailgun HTTP API via `fetch` | No SDK; see `lib/mailgun/`. |
| Testing | Vitest + Testing Library | `pnpm test`. |
| Package manager | pnpm | Do not commit `package-lock.json` or `yarn.lock`. |
| Hosting | Vercel | |

---

## 3. Architecture

```
Browser
  │  server components / route handlers (same Next.js app)
  ▼
Next.js (Vercel)
  ├─ app/ (routes)            ──► Supabase JS (anon key + user cookie)  ──► Postgres (RLS enforced)
  ├─ app/api/orders/route.ts ──► rpc('create_order')  (atomic, server-priced)
  │                           ──► lib/mailgun/send.ts ──► Mailgun API ──► customer inbox
  └─ proxy.ts                 ──► refresh session, protect /checkout /orders /account
```

Key principles:

1. **The database enforces ownership.** Every table has RLS. Server code uses the *user's* session (anon key + cookies) for anything done on behalf of a user, so RLS applies. The service-role key is only for seeding and the post-commit email-status update.
2. **Prices are server truth.** The client sends `{ productId, quantity }` only. `create_order` in Postgres loads prices and computes totals.
3. **Order creation is atomic.** One RPC call inserts the order and all items in a single transaction.
4. **Email is best-effort, after commit, never duplicated.** Email failure is recorded on the order and logged; it never rolls back or re-creates the order.
5. **Secrets stay server-side.** Only `NEXT_PUBLIC_*` variables reach the browser.

### Supabase clients (`lib/supabase/`)

| File | Use from | Key |
|---|---|---|
| `client.ts` | Client components | anon |
| `server.ts` | Server components, route handlers, server actions | anon + cookies |
| `proxy.ts` | `proxy.ts` only | anon + cookies |
| `admin.ts` | Scripts and `lib/orders/mark-email-status.ts` only | service role — **never import in anything that can be bundled for the browser** |

### Authentication flow

1. `/login` renders a **Sign in with Google** button (client component) that calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback?next=…` } })`.
2. Google → Supabase (`https://<ref>.supabase.co/auth/v1/callback`) → our `/auth/callback?code=…`.
3. `app/auth/callback/route.ts` calls `exchangeCodeForSession(code)` and redirects to `next` (sanitised to a same-origin path).
4. `proxy.ts` (Next 16's replacement for `middleware.ts`) refreshes the session on every matched request and redirects anonymous users away from protected routes to `/login?next=<path>`.
5. A Postgres trigger on `auth.users` inserts the `profiles` row.
7. Email/password: `/signup`, `/login` (email form below Google), `/forgot-password`, `/reset-password`. Server actions in `app/auth/actions.ts` (`signInWithPassword`, `signUpWithPassword`, `resendConfirmation`, `requestPasswordReset`, `updatePassword`) validated by `lib/validations/auth.ts`. Email links verify at `app/auth/confirm/route.ts` (`verifyOtp` with `token_hash`). Forgot-password always returns the same response so accounts can't be enumerated.
6. Sign-out is a server action (`app/auth/actions.ts`) calling `supabase.auth.signOut()` and redirecting home.

### Checkout flow

See `PRD.md` §9. Implementation lives in:
- `components/checkout/checkout-form.tsx` (client, react-hook-form + Zod)
- `app/api/orders/route.ts` (server)
- `supabase/migrations/*_create_order.sql` (Postgres function)
- `lib/mailgun/` (email)

---

## 4. Folder conventions

```
app/
  layout.tsx            root layout: fonts, Header, Footer
  page.tsx              homepage
  shop/                 product grid with URL-driven filters (+ loading.tsx)
  products/[slug]/      product detail (+ not-found.tsx)
  services/             painting services + request form
  projects/             gallery with category filter
  about/  contact/
  cart/                 client-rendered cart
  checkout/             checkout form; confirmation/[orderNumber]/
  orders/               list; [id]/ detail (+ not-found.tsx)
  account/
  login/
  auth/callback/        OAuth code exchange (route handler)            [Phase 3]
  auth/actions.ts       sign-out server action                         [Phase 3]
  api/orders/           POST create order                              [Phase 5]
  api/service-requests/ POST painting service request                  [Phase 5]
  not-found.tsx  error.tsx
proxy.ts                Next 16 replacement for middleware.ts          [Phase 3]
components/
  ui/                   primitives: Button/ButtonLink, Input/Textarea/Select/Label/FieldError,
                        Badge, Skeleton, Container, SectionHeading, EmptyState, Price,
                        QuantityStepper, StockBadge, ColourSwatch
  layout/               Header, Footer, Logo, MobileNav (portal), NavLink, SearchForm, AccountMenu
  shop/                 ProductCard, ProductGrid, Filters, SortSelect, CategoryTiles,
                        ProductPurchasePanel, Breadcrumbs
  cart/                 CartView, CartLine, CartSummary, CartBadge (server count), AddToCartButton (server action)
  checkout/             CheckoutForm, OrderSummary
  orders/               OrderList, OrderDetail, OrderStatusBadge
  account/              AccountShell, AccountNav
  auth/                 GoogleSignInButton
  services/             ServiceCard, ServiceRequestForm
  marketing/            Hero, WhyPrimeCoat, ServicesTeaser, ProjectsGallery, ConsultationCta
lib/
  supabase/             clients + database.types.ts (generated)       [Phase 3/4]
  mailgun/              send.ts, templates/order-confirmation.ts      [Phase 7]
  orders/               queries.ts (server-only; stubbed until Phase 6)
  products/             seed-data.ts (static catalogue), queries.ts (filter/sort API)
  cart/                 queries.ts (server-only, Supabase), calculations.ts (pure, tested); actions in app/cart/actions.ts
  validations/          checkout.ts, service-request.ts (Zod, shared client/server)
  content/              images.ts, services.ts, projects.ts, service-type.ts
  utils/                cn, format-currency, dates, nigeria-states, slugify, logger, redirects
types/                  product, cart, order, service-request (camelCase app types)
supabase/migrations/    timestamped SQL                                [Phase 4]
scripts/                generate-product-images.ts, seed.ts, mailgun-test.ts, verify-rls.ts
tests/                  Vitest, mirrors lib/
public/images/products/ generated SVG renders (one per slug) + placeholder.svg
```

Rules:
- Route segments are kebab-case. Component files are kebab-case (`product-card.tsx`) exporting PascalCase components.
- One component per file. Co-locate small sub-components only if unexported.
- Server-only modules import `server-only` at the top.
- Never put business logic in components; put it in `lib/`.
- App types are camelCase; database rows are snake_case. Map at the query layer (`lib/*/queries.ts`), never in components.
- Pages typed with the generated `PageProps<'/route'>` helper; `params`/`searchParams` are Promises (Next 16).

## 5. Coding conventions

- Prefer React Server Components. Add `"use client"` only to leaf components that need state, effects or browser APIs.
- Data fetching happens in server components or route handlers, never in `useEffect`, except for cart hydration.
- Use `async` server components and `Suspense` with skeletons for loading states; provide `error.tsx` and `not-found.tsx` per route group. Do **not** add `loading.tsx` above a segment that calls `notFound()` — the streamed shell turns the 404 into a 200 (this is why `app/orders/` has no loading file).
- All forms: react-hook-form + `zodResolver` with the schema from `lib/validations/`. Show inline errors tied to inputs via `aria-describedby`.
- Currency: store as `numeric(12,2)` NGN; format with `formatNaira()` from `lib/utils/format-currency.ts`. Never do float arithmetic on totals in the client beyond display estimates.
- Dates: store `timestamptz`; format with `Intl.DateTimeFormat('en-NG')`.
- Accessibility: every interactive element is a `<button>` or `<a>`; icon-only buttons have `aria-label`; images have meaningful `alt` or `alt=""` when decorative.
- No inline styles except CSS custom-property colour swatches (`className="swatch" style={{ "--swatch": hex }}`).
- Fixed-position overlays rendered from inside the sticky header must use `createPortal(…, document.body)`; the header's `backdrop-filter` otherwise becomes their containing block.
- Product images are generated SVGs: `node --import tsx scripts/generate-product-images.ts` after changing `lib/products/seed-data.ts`.
- No `console.log` in committed code; use `lib/utils/logger.ts` (`logger.error('orders.email_failed', { orderNumber, message })`). Never log secrets, tokens or full request bodies.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

### Design conventions

- Palette tokens: `charcoal` (#1B1B1F), `warm-white` (#FAF8F5), `stone` (#E8E3DC), `terracotta` accent (#C65D3B), `sage` (#7D8F7A), `ochre` (#D9A441). Defined once in `globals.css`.
- Typography: display serif for headings (Fraunces via `next/font`), humanist sans for body (Inter). Strong hierarchy, generous whitespace.
- Avoid: gradients, glassmorphism, oversized hero text, excessive border radius (max `rounded-lg` except pills), purple/blue SaaS palette, decorative animations, fake statistics.
- Imagery should look like a real paint brand: product tins, swatches, interiors.

---

## 6. Database conventions

- Every schema change is a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`. Never edit an applied migration; add a new one.
- `supabase/seed.sql` is idempotent (`insert … on conflict (slug) do update`).
- Table names: snake_case plural. Column names: snake_case. Enums: snake_case singular.
- Every table has `id uuid primary key default gen_random_uuid()` and `created_at timestamptz default now()`. Mutable tables also have `updated_at` maintained by the `set_updated_at()` trigger.
- Foreign keys from `order_items.product_id` use `on delete set null` so historical orders survive product deletion.
- Money columns: `numeric(12,2) not null check (>= 0)`.
- After any schema change regenerate types: `pnpm supabase:types` → `lib/supabase/database.types.ts`. Commit the generated file.
- The delivery-fee rule exists in both `calculate_delivery_fee()` (SQL, source of truth) and `lib/cart/calculations.ts` (TS, estimate). Change both together and update `tests/cart/calculations.test.ts`.

---

## 7. Supabase rules

- RLS is enabled on every table. Adding a table without RLS is a bug.
- Client-facing code never uses the service-role key.
- Orders are inserted **only** via `create_order()`. Do not add a client-side `insert` policy on `orders` or `order_items`.
- `create_order()` is `SECURITY DEFINER` with `set search_path = public` and must `raise exception` if `auth.uid()` is null.
- Reads of a user's own orders go through the user's session so RLS filters them; never filter by `user_id` manually with the admin client as a substitute for RLS.
- Keep `lib/supabase/database.types.ts` in sync with migrations (`pnpm db:types`).
- Supabase's API roles run with **safeupdate**: `DELETE`/`UPDATE` without `WHERE` fails inside SECURITY DEFINER functions too. Avoid temp tables in PL/pgSQL (plan-cache + pooling issues); accumulate in `jsonb` and use `jsonb_to_recordset` (see migration `20261002130000`).
- PostgREST inserts that ask for the row back (`.select()` / `Prefer: return=representation`) need a SELECT policy. Anonymous service-request inserts therefore use `return=minimal` (plain `.insert()` without `.select()`).
- Query layers (`lib/*/queries.ts`, `mappers.ts`) validate rows with Zod before mapping snake_case → camelCase.

---

## 8. Mailgun rules

- Only `lib/mailgun/send.ts` talks to Mailgun, using `fetch` with HTTP Basic auth (`api:${MAILGUN_API_KEY}`).
- Templates are pure functions in `lib/mailgun/templates/` returning `{ subject, html, text }`. They must escape every user-supplied value (`escapeHtml`).
- Called only from server code after the order transaction has committed.
- Failures are caught, logged via `logger.error`, and persisted as `confirmation_email_status = 'failed'`. The HTTP response to the client is still a success because the order exists.
- Never send from the browser. Never put the API key in a `NEXT_PUBLIC_` variable.
- Sandbox domains only deliver to authorised recipients; this is a Mailgun constraint, not a bug.

---

## 9. Security rules

- Validate every request body with Zod before touching the database.
- Never trust client-supplied prices, totals, user IDs or emails for ownership. Ownership comes from `auth.uid()`.
- Sanitise the `next` redirect parameter: must start with `/` and not `//`.
- Escape all user content in email HTML.
- Keep `next.config.ts` security headers.
- `.env`, `.env.local`, `.env.*.local` are git-ignored. Only `.env.example` is committed and contains no values.
- Before every commit run `pnpm check:secrets` (greps the tree for key-shaped strings) — or at minimum confirm `git status` shows no env files.

---

## 10. Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon / publishable key (RLS applies) |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin, used for OAuth `redirectTo` and email links |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Seeding + email-status update |
| `SUPABASE_DB_URL` | scripts only | Postgres URI for `pnpm db:push` / `pnpm db:types`. Never read by the app. |
| `MAILGUN_API_KEY` | server only | Mailgun private API key |
| `MAILGUN_DOMAIN` | server only | Sending domain (sandbox or verified) |
| `MAILGUN_FROM_EMAIL` | server only | e.g. `PrimeCoat <orders@mg.primecoat.ng>` |
| `MAILGUN_API_BASE_URL` | server only, optional | `https://api.mailgun.net` (default) or `https://api.eu.mailgun.net` |
| `MAILGUN_REPLY_TO` | server only, optional | Support address |

`lib/env.ts` validates these at startup with Zod and throws a readable error if a required server variable is missing.

---

## 11. Testing requirements

- `pnpm test` must pass before any commit that touches `lib/`, `app/api/` or `supabase/`.
- Required unit coverage: `lib/cart/calculations.ts`, `lib/validations/*`, `lib/mailgun/templates/*`, `lib/utils/*`.
- Route handler tests mock the Supabase client and assert: 401 without session, 400 on invalid body, RPC called with server-derived values only, email failure still returns 201.
- RLS is verified by `scripts/verify-rls.ts` (requires two test users) and documented manually in `README.md`.
- Never claim an integration works without running it. Record what was actually tested in `CONTEXT.md`.

---

## 12. Important implementation decisions

| Decision | Rationale |
|---|---|
| Postgres function for order creation instead of multiple JS inserts | Atomicity, server-side pricing, and RLS-safe without the service role. |
| Snapshot `product_name`, `unit_price`, `product_image_url` in `order_items` | Historical accuracy after product edits. |
| Daily sequence for order numbers (`PC-20261002-0001`) | Human-readable and unique; implemented with an `order_number_counters(day date, last int)` table and `insert … on conflict do update returning`. |
| Cart in Supabase (`cart_items`) | User requirement: everything persisted lives in Supabase. Cart follows the account across devices. Adding requires sign-in. `create_order()` empties the cart in the same transaction, so it clears if and only if the order commits. `POST /api/orders` reads items from the DB cart, never the request body. |
| `fetch` instead of Mailgun SDK | Fewer dependencies, edge-compatible, trivial to test. |
| Delivery fee mirrored in SQL and TS | SQL is truth for stored totals; TS gives instant estimates in the cart. |
| Profile trigger on `auth.users` | Guarantees a profile row without client involvement. |
| Service requests allow anonymous inserts | Leads should not require an account. |

---

## 13. Things you must NOT change without checking first

1. Replacing Supabase with any other store, or persisting orders anywhere but Supabase.
2. Removing or weakening any RLS policy, or adding a client insert policy on `orders`/`order_items`.
3. Moving order creation out of `create_order()` or allowing client-supplied prices.
4. Sending email from anywhere other than `lib/mailgun/send.ts`, or from the browser.
5. Introducing `NEXT_PUBLIC_` variables that contain secrets.
6. Editing an already-applied migration file.
7. Changing the order-number format (customers may have it in emails).
8. Changing the delivery-fee rule in only one of the two places.
9. Downgrading auth to anything other than Supabase Auth + Google OAuth.
10. Clearing the cart outside `create_order()` (it must stay in the same transaction as the order).
11. Storing anything in localStorage, sessionStorage or IndexedDB. All persistence goes to Supabase.

---

## 14. Workflow for every session

1. Read `CONTEXT.md`.
2. Run `pnpm install && pnpm typecheck && pnpm test` to confirm a green baseline.
3. Work in small, verifiable steps; run `pnpm lint && pnpm typecheck && pnpm test` before each commit.
4. Update `CONTEXT.md` (and `README.md` if setup changed) at the end of the session.
5. Tell the user exactly which external configuration they must do by hand, following the "human-only configuration" format: what account, where to go, what to click, what to create, what to copy, where to put it, what redirect URL, how to verify.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
