# PrimeCoat

**Quality Paints. Professional Finishes.**

PrimeCoat is a production-grade e-commerce platform for a premium Nigerian paint company. Customers browse and buy paints, finishes and accessories, book professional painting services, and return later to see their order history. Authentication is Google via Supabase Auth, orders are persisted in Supabase Postgres with Row Level Security, and every successful checkout sends a real confirmation email through Mailgun.

Built as an HNG individual task. Nothing is mocked.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Local setup](#local-setup)
5. [Environment variables](#environment-variables)
6. [Supabase setup](#supabase-setup)
7. [Google OAuth setup](#google-oauth-setup)
8. [Mailgun setup](#mailgun-setup)
9. [Database setup](#database-setup)
10. [Development commands](#development-commands)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Production configuration](#production-configuration)
14. [HNG acceptance test](#hng-acceptance-test)
15. [Known limitations](#known-limitations)
16. [Project documents](#project-documents)

---

## Features

**Shop**
- Product catalogue with categories: interior, exterior, ceiling, primer, gloss, textured, wood finish, metal finish, accessories, tools
- Search, category / price / availability filters, sorting, URL-shareable state
- Product detail pages with size, colour swatch, stock status, quantity selector and related products

**Cart**
- Persistent cart (survives refresh), quantity controls, remove, subtotal, delivery estimate, total
- Branded empty state

**Checkout & orders**
- Authenticated checkout with validated customer and delivery details
- Server-side pricing: the server recomputes every price and total from the database
- Atomic order creation (order + items in one transaction) with human-readable order numbers (`PC-20261002-0001`)
- Order confirmation page
- Order history and order detail pages restricted to the owner by RLS
- Pay-on-Delivery payment method, structured for Paystack / Flutterwave / Stripe later

**Account**
- Google sign-in, persistent session across browser restarts, sign-out
- Profile created automatically on first sign-in

**Services & brand**
- Painting-services page with a request form stored in the database
- Projects gallery, About and Contact pages

**Email**
- Branded HTML + plain-text order confirmation via Mailgun, sent server-side only

**Quality**
- TypeScript strict, Zod validation, RLS on every table, loading / error / empty / not-found states, accessible components, responsive from 320 px

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (Postgres, Auth, RLS) with `@supabase/ssr` |
| OAuth provider | Google (Google Cloud Console) |
| Validation | Zod, react-hook-form |
| Cart | Supabase `cart_items` table via server actions (no browser storage) |
| Email | Mailgun HTTP API |
| Tests | Vitest, Testing Library |
| Hosting | Vercel |
| Package manager | pnpm |

---

## Architecture

```
Cart (Supabase) ──► Checkout form ─► POST /api/orders (reads cart from DB)
                                            │  1. verify session (cookie)
                                            │  2. validate body (Zod)
                                            │  3. rpc create_order()  ── Postgres: price lookup,
                                            │                                     totals, order number,
                                            │                                     order + items (1 txn)
                                            │  4. send Mailgun email (after commit)
                                            │  5. record email status
                                            ▼
                               /checkout/confirmation/PC-…   and   /orders
```

- **Server components** render pages and read data with the user's Supabase session so RLS applies.
- **Middleware** refreshes the session on every request and guards `/checkout`, `/orders`, `/account`.
- **Secrets** (`SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_*`) are read only in server code.

A full description of the architecture, conventions and rules for contributors is in [`AGENTS.md`](./AGENTS.md).

---

## Local setup

Prerequisites: Node.js 20+, pnpm 9+, a Supabase project, a Google Cloud OAuth client, a Mailgun account.

```bash
git clone <this-repo> primecoat
cd primecoat
pnpm install
cp .env.example .env.local        # then fill in the values (see below)
pnpm dev                           # http://localhost:3000
```

---

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

| Variable | Where it is used | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | yes | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | yes | Supabase → Project Settings → API → `anon` `public` key |
| `NEXT_PUBLIC_SITE_URL` | browser + server | yes | `http://localhost:3000` locally; production URL on Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | yes | Supabase → Project Settings → API → `service_role` key. Used by seed/verification scripts and to record the email status on an order. **Secret.** |
| `SUPABASE_DB_URL` | scripts only | for migrations | Supabase → **Connect** → *Session pooler* URI (port 5432) with your database password filled in. Used by `pnpm db:push` and `pnpm db:types`. **Secret.** |
| `MAILGUN_API_KEY` | server only | yes | Mailgun → Account → API Security → Private API key. **Secret.** |
| `MAILGUN_DOMAIN` | server only | yes | e.g. `sandboxXXXX.mailgun.org` or `mg.yourdomain.com` |
| `MAILGUN_FROM_EMAIL` | server only | yes | e.g. `PrimeCoat <orders@sandboxXXXX.mailgun.org>` |
| `MAILGUN_API_BASE_URL` | server only | no | Default `https://api.mailgun.net`; `https://api.eu.mailgun.net` for EU |
| `MAILGUN_REPLY_TO` | server only | no | Support address |

The Google client ID and secret are **not** environment variables of this app. They are entered in the Supabase dashboard (see below).

---

## Supabase setup

1. **Account:** [supabase.com](https://supabase.com) → sign in → **New project**.
2. **Create:** choose an organisation, name it `primecoat`, set a strong database password (save it), pick a region close to your users (e.g. `eu-west` or `af-south` if available).
3. **Copy values:** **Project Settings → API**.
   - *Project URL* → `NEXT_PUBLIC_SUPABASE_URL`
   - *anon public* key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *service_role* key → `SUPABASE_SERVICE_ROLE_KEY` (server/scripts only)
4. **Auth URLs:** **Authentication → URL Configuration**.
   - *Site URL:* `http://localhost:3000` for now (change to production URL at deploy time).
   - *Redirect URLs:* add
     - `http://localhost:3000/auth/callback`
     - `https://<your-vercel-domain>/auth/callback` (add when deploying)
     - `https://*-<your-vercel-team-or-user>.vercel.app/auth/callback` (optional, for preview deployments)
5. **Verify:** the project dashboard loads and the API keys are visible.

Database schema is applied in [Database setup](#database-setup).

---

## Google OAuth setup

You need the Supabase callback URL first: `https://<project-ref>.supabase.co/auth/v1/callback`. Find `<project-ref>` in your Supabase project URL. It is also shown in Supabase under **Authentication → Providers → Google** as *Callback URL (for OAuth)*.

1. **Account:** [console.cloud.google.com](https://console.cloud.google.com) → sign in → create or select a project (e.g. `PrimeCoat`).
2. **Consent screen:** **APIs & Services → OAuth consent screen** (or **Google Auth Platform → Branding**).
   - User type: **External**.
   - App name: `PrimeCoat`. User support email: yours. Developer contact: yours.
   - Scopes: leave default (`email`, `profile`, `openid`).
   - **Audience / Test users:** while the app is in *Testing*, add every Google account that will sign in (yours, the HNG reviewer's if known). Or click **Publish app** to allow any Google account.
3. **Credentials:** **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**. Name: `PrimeCoat Web`.
   - **Authorised JavaScript origins:**
     - `http://localhost:3000`
     - `https://<your-vercel-domain>` (add at deploy time)
   - **Authorised redirect URIs:**
     - `https://<project-ref>.supabase.co/auth/v1/callback` ← the only one that is strictly required
   - Click **Create**. Copy the **Client ID** and **Client secret**.
4. **Put them in Supabase:** Supabase → **Authentication → Providers → Google** → enable → paste *Client ID* and *Client Secret* → **Save**.
5. **Verify:** run `pnpm dev`, open `http://localhost:3000/login`, click **Sign in with Google**, complete the Google prompt, and confirm you land back on the site signed in with your avatar in the header. In Supabase → **Authentication → Users** your account appears, and in **Table Editor → profiles** a row exists for it.

If you see `redirect_uri_mismatch`, the Supabase callback URL in step 3 is wrong or missing. If you see *"Access blocked: app not verified"*, add your account under Test users or publish the app.

---

## Mailgun setup

1. **Account:** [mailgun.com](https://www.mailgun.com) → sign up (free tier is enough for testing).
2. **Domain:**
   - For testing: **Sending → Domains** shows a sandbox domain like `sandboxXXXX.mailgun.org`. Open it → **Authorized Recipients** → add the email address(es) you will use to place test orders → confirm the verification email Mailgun sends. Sandbox domains deliver **only** to authorised recipients.
   - For production: **Sending → Domains → Add New Domain** → e.g. `mg.yourdomain.com` → add the DNS records (SPF TXT, DKIM TXT, MX, CNAME) at your DNS provider → wait for **Verified**.
3. **API key:** profile menu → **API Security** (or **Account → API keys**) → **Create API key** or copy the *Private API key*.
4. **Region:** if your domain was created in the EU region, set `MAILGUN_API_BASE_URL=https://api.eu.mailgun.net`.
5. **Fill env:**
   ```env
   MAILGUN_API_KEY=<private key>
   MAILGUN_DOMAIN=sandboxXXXX.mailgun.org
   MAILGUN_FROM_EMAIL=PrimeCoat <orders@sandboxXXXX.mailgun.org>
   ```
6. **Verify:** `pnpm mailgun:test your@email.com` sends a test message. Then place a real order and check the inbox. Mailgun → **Sending → Logs** shows *Accepted* / *Delivered* events.

If you see `403 … add the address to your authorized recipients`, the credentials are correct but the recipient is not on the sandbox domain's **Authorized Recipients** list. Add the exact address (the Google account email you sign in with) and confirm Mailgun's verification email. Orders placed before that still save correctly; they are marked `confirmation_email_status = 'failed'` with the reason in `confirmation_email_error`.

---

## Database setup

Migrations live in `supabase/migrations/` and the product seed in `supabase/seed.sql`.

**Option A — scripts (recommended, no CLI login needed)**

Set `SUPABASE_DB_URL` in `.env.local` (see the environment table), then:

```bash
pnpm db:push            # applies supabase/migrations/* via the Supabase CLI in --db-url mode
pnpm db:seed            # upserts the 32-product catalogue with the service role
pnpm db:types           # regenerates lib/supabase/database.types.ts from the live schema
```

If the first `db:push` reports *Connection timed out*, run it again — the first invocation downloads the CLI and can exceed the connection window.

**Option B — SQL editor**

Supabase → **SQL Editor** → paste each file in `supabase/migrations/` in filename order → **Run**. Then paste `supabase/seed.sql` → **Run**.

**Verify:** Supabase → **Table Editor** shows `profiles`, `products` (with rows), `orders`, `order_items`, `painting_service_requests`, `order_number_counters`. **Authentication → Policies** shows RLS enabled on each.

---

## Development commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server on http://localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unit + handler tests) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm db:push` | Apply migrations (`SUPABASE_DB_URL`) |
| `pnpm db:seed` | Upsert the product catalogue (service role) |
| `pnpm db:types` | Generate `lib/supabase/database.types.ts` |
| `pnpm seed:sql` | Regenerate `supabase/seed.sql` from `lib/products/seed-data.ts` |
| `pnpm images:generate` | Regenerate product SVG renders |
| `pnpm mailgun:test <email>` | Send a test email through Mailgun |
| `pnpm verify:rls` | Script that confirms one user cannot read another's orders |
| `pnpm check:secrets` | Grep the tree for accidentally committed keys |

---

## Testing

**Automated**

```bash
pnpm test
```

Covers: cart calculations (subtotal, delivery fee, total, quantity changes, removal), checkout and service-request Zod schemas, order-number formatting, email template rendering and escaping, `POST /api/orders` behaviour (401 without session, 400 invalid body, server-derived values passed to the RPC, email failure still returns success), and redirect-path sanitisation.

**Row Level Security**

```bash
pnpm verify:rls
```

Signs in as two test users (service role creates them), creates an order for user A, confirms user B's session returns zero rows for that order and a 404 for its detail page.

**Manual end-to-end**

Follow the [HNG acceptance test](#hng-acceptance-test) locally and again on production.

---

## Deployment

1. **Account:** [vercel.com](https://vercel.com) → **Add New → Project** → import this Git repository.
2. **Framework preset:** Next.js (auto-detected). Build command `pnpm build`, install command `pnpm install`.
3. **Environment variables:** add every variable from `.env.example` with production values. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL (e.g. `https://primecoat.vercel.app`). Mark the server-only ones as *Sensitive*.
4. **Deploy.** Copy the production URL.
5. Complete [Production configuration](#production-configuration).

---

## Production configuration

After the first deployment:

| Where | What to set |
|---|---|
| Supabase → Authentication → URL Configuration | *Site URL* = `https://<prod-domain>`; add `https://<prod-domain>/auth/callback` to *Redirect URLs* |
| Google Cloud → Credentials → your OAuth client | Add `https://<prod-domain>` to *Authorised JavaScript origins* (redirect URI stays the Supabase one) |
| Google Cloud → OAuth consent screen | Publish the app, or add reviewer accounts as test users |
| Mailgun | Use a verified custom domain, or add reviewer addresses as authorised recipients on the sandbox domain |
| Vercel → Environment Variables | `NEXT_PUBLIC_SITE_URL` = production URL; redeploy after changes |
| Supabase | Migrations and seed applied to the production project |

Verify with the acceptance test below.

---

## HNG acceptance test

Perform on the deployed site. Record results in `CONTEXT.md`.

| # | Step | How to verify |
|---|---|---|
| 1 | **Google sign-in** — open the site, click **Account → Sign in with Google**, complete the Google prompt. | You are redirected back signed in; your name/avatar shows in the header. Supabase → Authentication → Users lists you. |
| 2 | **Product browsing** — open **Shop**, search, filter by category, sort, open a product. | Grid updates; product page shows price, size, colour, stock. |
| 3 | **Add to cart** — click **Add to Cart**, open cart, change quantity, refresh the page. | Badge count updates; totals recalculate; cart survives refresh. |
| 4 | **Checkout** — click **Proceed to Checkout**, fill phone, address, city, state, place order. | Validation prevents empty fields; on submit you land on the confirmation page with an order number `PC-…`. Cart is now empty. |
| 5 | **Order creation** — Supabase → Table Editor → `orders`. | A row with that order number, your `user_id`, and server-computed totals. `order_items` has one row per product. |
| 6 | **Order persistence** — open **Orders** in the site. | The order is listed with number, date, total, status and item count. **View Order** shows the detail. |
| 7 | **Logout** — click **Sign out**. | Header shows **Sign in**; `/orders` redirects to `/login`. |
| 8 | **Browser close/reopen** — close the browser entirely, reopen, visit the site. | Still signed out (expected after explicit sign-out). *Separately:* sign in, close the browser without signing out, reopen — you are still signed in. |
| 9 | **Sign in again** — **Sign in with Google** with the same account. | Signed in. |
| 10 | **Previous order visibility** — open **Orders**. | The earlier order is still there with identical details. |
| 11 | **Mailgun confirmation email** — check the inbox of the email used at checkout. | A PrimeCoat-branded email with the order number, items, totals and address. Mailgun → Sending → Logs shows *Delivered*. `orders.confirmation_email_status = 'sent'`. |
| 12 | **Production OAuth** — steps 1 and 9 performed on the production URL, not localhost. | No `redirect_uri_mismatch`; callback lands on the production domain. |

Ownership check (recommended): sign in with a second Google account and open the first account's `/orders/<id>` URL. Expect a 404.

---

## Known limitations

- Payment is Pay on Delivery only. The schema includes `payment_method` and `payment_status` for a future gateway.
- Stock is validated at order time but not decremented.
- No admin UI; manage products via Supabase Studio or `supabase/seed.sql`.
- Mailgun sandbox domains deliver only to authorised recipients until a custom domain is verified.
- Google OAuth consent screens in *Testing* mode only admit listed test users.
- Product imagery uses placeholder renders; replace by updating `products.image_url`.

---

## Project documents

| File | Purpose |
|---|---|
| [`PRD.md`](./PRD.md) | Product requirements, acceptance criteria, phases |
| [`AGENTS.md`](./AGENTS.md) | Rules and architecture for AI coding agents and contributors |
| [`CONTEXT.md`](./CONTEXT.md) | Session log: what works, what is pending, next task |
| [`.env.example`](./.env.example) | Environment variable names |
