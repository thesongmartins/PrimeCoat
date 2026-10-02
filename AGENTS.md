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
| Framework | Next.js (App Router) | Server components by default; `"use client"` only where interactivity is needed. |
| Language | TypeScript, `strict: true` | No `any` without a comment explaining why. |
| Styling | Tailwind CSS v4 | Design tokens in `app/globals.css` under `@theme`. |
| Database / Auth | Supabase (Postgres + Auth) | `@supabase/ssr` for cookie-based sessions. |
| Validation | Zod | Schemas in `lib/validations/`, shared by client forms and server handlers. |
| Client state | Zustand with `persist` | Cart only. |
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
  └─ middleware.ts            ──► refresh session, protect /checkout /orders /account
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
| `middleware.ts` | `middleware.ts` only | anon + cookies |
| `admin.ts` | Scripts and `lib/orders/mark-email-status.ts` only | service role — **never import in anything that can be bundled for the browser** |

### Authentication flow

1. `/login` renders a **Sign in with Google** button (client component) that calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback?next=…` } })`.
2. Google → Supabase (`https://<ref>.supabase.co/auth/v1/callback`) → our `/auth/callback?code=…`.
3. `app/auth/callback/route.ts` calls `exchangeCodeForSession(code)` and redirects to `next` (sanitised to a same-origin path).
4. `middleware.ts` refreshes the session on every matched request and redirects anonymous users away from protected routes to `/login?next=<path>`.
5. A Postgres trigger on `auth.users` inserts the `profiles` row.
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
  (marketing)/          homepage, about, contact, projects, services  — shared marketing layout
  (shop)/               shop, products/[slug]                          — shop layout
  cart/                 cart page
  checkout/             checkout page + confirmation/[orderNumber]
  orders/               list + [id]
  account/
  login/
  auth/callback/        OAuth code exchange (route handler)
  auth/actions.ts       sign-out server action
  api/orders/           POST create order
  api/service-requests/ POST painting service request
components/
  ui/                   primitives: Button, Input, Select, Badge, Skeleton, Sheet, Dialog …
  layout/               Header, Footer, MobileNav, Container
  shop/                 ProductCard, ProductGrid, Filters, SortSelect, ProductGallery …
  cart/                 CartLine, CartSummary, CartBadge
  checkout/             CheckoutForm, OrderSummary
  orders/               OrderList, OrderCard, OrderDetail, StatusBadge
  services/             ServiceCard, ServiceRequestForm
  marketing/            Hero, Categories, WhyPrimeCoat, ProjectsGallery
lib/
  supabase/             clients (see above) + database.types.ts (generated)
  mailgun/              send.ts, templates/order-confirmation.ts
  orders/               server helpers (fetch orders, mark email status)
  products/             server helpers (queries)
  cart/                 store.ts (Zustand), calculations.ts (pure functions)
  validations/          checkout.ts, cart.ts, service-request.ts
  utils/                format-currency.ts, cn.ts, dates.ts, nigeria-states.ts
types/                  hand-written domain types (Product, Order, CartItem …)
supabase/
  migrations/           timestamped SQL, applied in order
  seed.sql              product catalogue
tests/                  Vitest (mirrors lib/ structure)
public/
  images/products/      SVG/PNG product renders
  images/projects/      gallery imagery
```

Rules:
- Route segments are kebab-case. Components are PascalCase files? **No** — component files are kebab-case (`product-card.tsx`) exporting PascalCase components.
- One component per file. Co-locate small sub-components only if unexported.
- Server-only modules import `server-only` at the top.
- Never put business logic in components; put it in `lib/`.

---

## 5. Coding conventions

- Prefer React Server Components. Add `"use client"` only to leaf components that need state, effects or browser APIs.
- Data fetching happens in server components or route handlers, never in `useEffect`, except for cart hydration.
- Use `async` server components and `Suspense` with skeletons for loading states; provide `loading.tsx`, `error.tsx` and `not-found.tsx` per route group.
- All forms: react-hook-form + `zodResolver` with the schema from `lib/validations/`. Show inline errors tied to inputs via `aria-describedby`.
- Currency: store as `numeric(12,2)` NGN; format with `formatNaira()` from `lib/utils/format-currency.ts`. Never do float arithmetic on totals in the client beyond display estimates.
- Dates: store `timestamptz`; format with `Intl.DateTimeFormat('en-NG')`.
- Accessibility: every interactive element is a `<button>` or `<a>`; icon-only buttons have `aria-label`; images have meaningful `alt` or `alt=""` when decorative.
- No inline styles except CSS custom-property colour swatches.
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
- Keep `lib/supabase/database.types.ts` in sync with migrations.

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
| `MAILGUN_API_KEY` | server only | Mailgun private API key |
| `MAILGUN_DOMAIN` | server only | Sending domain (sandbox or verified) |
| `MAILGUN_FROM_EMAIL` | server only | e.g. `PrimeCoat <orders@mg.primecoat.ng>` |
| `MAILGUN_API_BASE_URL` | server only, optional | `https://api.mailgun.net` (default) or `https://api.eu.mailgun.net` |
| `MAILGUN_REPLY_TO` | server only, optional | Support address |

`lib/env.ts` validates these at startup with Zod and throws a readable error if a required server variable is missing.

---

## 11. Testing requirements

- `pnpm test` must pass before any commit that touches `lib/`, `app/api/` or `supabase/`.
- Required unit coverage: `lib/cart/calculations.ts`, `lib/cart/store.ts`, `lib/validations/*`, `lib/mailgun/templates/*`, `lib/utils/*`.
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
| Zustand + localStorage for cart | Cart is not account data; persists across refresh; cleared only after a successful order. |
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
10. Clearing the cart before the server confirms the order.

---

## 14. Workflow for every session

1. Read `CONTEXT.md`.
2. Run `pnpm install && pnpm typecheck && pnpm test` to confirm a green baseline.
3. Work in small, verifiable steps; run `pnpm lint && pnpm typecheck && pnpm test` before each commit.
4. Update `CONTEXT.md` (and `README.md` if setup changed) at the end of the session.
5. Tell the user exactly which external configuration they must do by hand, following the "human-only configuration" format: what account, where to go, what to click, what to create, what to copy, where to put it, what redirect URL, how to verify.
