# PrimeCoat — Product Requirements Document

**Version:** 1.0
**Date:** 2 October 2026
**Status:** Approved for implementation
**Owner:** PrimeCoat engineering

---

## 1. Product overview

PrimeCoat is a premium Nigerian paint retailer and professional painting-service provider. The website is a full e-commerce platform where customers browse and buy paints, finishes and accessories, book painting services, and return later to see their order history.

**Positioning:** *Quality Paints. Professional Finishes.*

This is not a static storefront. Every order placed on the site is a real database record owned by an authenticated user, and every successful checkout triggers a real transactional confirmation email.

### What the site does

| Capability | Summary |
|---|---|
| Shop | Browse, search, filter and sort a catalogue of paints, finishes and accessories. |
| Product details | Full product page with size, colour, stock, quantity selector and related products. |
| Cart | Persistent cart with quantity controls, subtotal, delivery estimate and total. |
| Checkout | Authenticated checkout collecting delivery details and placing a Pay-on-Delivery order. |
| Orders | Authenticated order history and per-order detail pages, restricted to the owner. |
| Account | Profile information, order history and sign-out. |
| Services | Painting-service catalogue with a request form stored in the database. |
| Projects | Visual gallery of completed work to establish credibility. |
| Email | Branded HTML order confirmation sent through Mailgun. |

### What the site does not do (v1)

- No online card payments. Checkout is **Pay on Delivery**. The data model and checkout flow leave room for Paystack / Flutterwave / Stripe.
- No admin dashboard. Products are managed through SQL seeds / Supabase Studio.
- No shipment tracking. Order status is a simple state machine.
- No inventory decrement on order placement (stock is displayed and validated, but not reserved). See section 17.

---

## 2. Target users

| Persona | Needs |
|---|---|
| **Homeowner / renovator** | Pick the right interior or exterior paint, understand sizes and coverage, order for delivery, possibly book painters. |
| **Professional painter / contractor** | Quickly find specific products (primer, gloss, 20 L drums), reorder, see past orders. |
| **Small business / facility manager** | Commercial painting enquiry, bulk product orders, invoice-friendly order records. |
| **HNG reviewer** | Verify that authentication, persistence and email are real by running the acceptance test in section 15. |

---

## 3. Business goals

1. Present PrimeCoat as a credible premium paint brand, not a demo.
2. Convert visitors into product orders with minimal friction.
3. Capture painting-service leads.
4. Retain customers by giving them a persistent account and order history.
5. Build on a foundation that can later accept online payments and admin tooling.

---

## 4. User stories

### Browsing
- As a visitor, I can see featured products and categories on the homepage.
- As a visitor, I can search products by name and filter by category, price range and availability.
- As a visitor, I can sort products by price, name and newest.
- As a visitor, I can open a product page and see its size, colour, price, description and stock status.
- As a visitor, I can see related products on a product page.

### Cart
- As a visitor, I can add a product to my cart without signing in.
- As a visitor, I can change quantities and remove items.
- As a visitor, my cart survives a page refresh.
- As a visitor, I can see subtotal, estimated delivery fee and total.

### Authentication
- As a visitor, I can sign in with my Google account.
- As a user, I stay signed in after closing and reopening the browser.
- As a user, I can sign out.
- As a user, after signing in I am returned to the page I was trying to reach.

### Checkout
- As a user, I must be signed in to check out; if not, I am sent to sign in and then returned to checkout.
- As a user, my name and email are pre-filled from my Google profile.
- As a user, I enter phone, address, city, state and optional delivery instructions.
- As a user, I see validation errors inline before submission.
- As a user, I place the order and land on a confirmation page showing my order number.
- As a user, I receive a confirmation email with the full order.

### Orders
- As a user, I can see a list of all my past orders.
- As a user, I can open any of my orders and see every line item, delivery details and status.
- As a user, I cannot see or open another user's order.

### Services
- As a visitor or user, I can submit a painting-service request with my details and preferred date.
- As a user, my service requests are linked to my account.

---

## 5. Functional requirements

### FR-1 Homepage
Header, hero, categories, featured products, "Why PrimeCoat", services teaser, projects gallery, footer.

### FR-2 Shop
- Product grid, responsive from 320 px upward.
- Search (name / description, case-insensitive).
- Filters: category, price range, in-stock only.
- Sort: featured, price ascending, price descending, name, newest.
- URL-driven state (`?q=&category=&min=&max=&sort=&inStock=`) so pages are shareable.
- Empty-state when no products match.

### FR-3 Product detail
- Route `/products/[slug]`.
- Large image, name, category, description, size/volume, colour swatch, stock status, price, quantity selector, Add to Cart, product information, related products.
- 404 state for unknown slugs.

### FR-4 Cart
- Route `/cart`.
- Stored in Supabase (`cart_items`, one row per user and product, RLS owner-only). Nothing is kept in browser storage.
- Adding to cart requires sign-in; signed-out visitors are sent to Google sign-in and returned to the product.
- The cart follows the account across devices and browsers.
- Line-item quantity controls with min 1 and a max bounded by stock.
- Remove item, clear cart.
- Subtotal, estimated delivery fee, total.
- Empty state: *"Your cart is waiting for its first coat of colour."* with a **Browse Paints** CTA.

### FR-5 Checkout
- Route `/checkout`. Protected.
- Form fields: full name, email, phone, delivery address, city, state (Nigerian states select), delivery instructions.
- Zod schema shared between client and server.
- Order summary panel with product images, quantities, unit prices, subtotal, delivery fee, total.
- Payment method displayed as **Pay on Delivery**.
- Submission calls the server (`POST /api/orders`), which creates the order atomically.
- Cart is cleared only after the server returns success.
- On success, redirect to `/checkout/confirmation/[orderNumber]`.
- On failure, show a clear error and keep the cart intact.

### FR-6 Order creation (server)
- Authenticated via Supabase session cookie.
- Server validates payload with Zod.
- Server **never trusts client prices**. It loads each product from the database, checks it is active and in stock, computes `unit_price`, `subtotal`, `delivery_fee` and `total`.
- Order and order items are inserted in **one database transaction** via a Postgres function `create_order`.
- A unique human-readable `order_number` is generated (`PC-YYYYMMDD-NNNN`).
- `order_items` snapshot `product_name`, `unit_price` and `subtotal` so history survives product edits.
- After commit, the server sends the Mailgun confirmation. Email failure **never** rolls back or duplicates the order; it is logged and recorded on the order (`confirmation_email_status`).

### FR-7 Order history
- Route `/orders`. Protected.
- List: order number, date, total, status, number of items, View Order.
- Empty state with a CTA to the shop.

### FR-8 Order detail
- Route `/orders/[id]`. Protected.
- Order information, products, quantities, prices, delivery information, totals, status.
- 404 if the order does not exist **or belongs to another user** (RLS guarantees the row is invisible).

### FR-9 Account
- Route `/account`. Protected.
- Avatar, name, email, member-since date, recent orders, link to all orders, sign-out button.

### FR-10 Authentication
- `/login` page with **Sign in with Google**.
- OAuth callback at `/auth/callback` exchanges the code for a session.
- Middleware refreshes the session on every request and protects `/checkout`, `/orders`, `/account`.
- `next` parameter preserved through the OAuth round-trip.
- Sign-out available from header and account page.

### FR-11 Painting services
- Route `/services` describing residential, commercial, interior, exterior, colour consultation, surface preparation and repainting.
- Request form stored in `painting_service_requests`. Works for anonymous visitors (user_id null) and signed-in users (user_id set).

### FR-12 Projects, About, Contact
- `/projects` image gallery with category labels.
- `/about` company story and values (no fabricated statistics).
- `/contact` contact details and a short form that reuses the service-request table with `service_type = 'general_enquiry'` or a simple mailto fallback.

### FR-13 Confirmation email
- Sent via Mailgun HTTP API from the server only.
- Branded HTML + plain-text alternative.
- Contents: PrimeCoat wordmark, customer name, order number, order date, line items with quantity and price, subtotal, delivery fee, total, delivery address, order status, payment method, thank-you message, link to the order page.

---

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Server-render shop and product pages. Lighthouse performance ≥ 85 on mobile for the homepage. Images via `next/image`. |
| Reliability | Order creation is transactional. Email is best-effort and idempotent per order. |
| Maintainability | TypeScript strict mode, typed Supabase client, shared Zod schemas, documented conventions in `AGENTS.md`. |
| Observability | Server errors logged with order number and no secrets. |
| Accessibility | WCAG 2.1 AA targets: semantic landmarks, keyboard navigation, visible focus, labelled inputs, alt text, ≥ 4.5:1 text contrast. |
| SEO | Per-page metadata, Open Graph tags, semantic headings. |
| Browser support | Latest two versions of Chrome, Safari, Firefox, Edge; iOS Safari and Android Chrome. |

---

## 7. Authentication requirements

- Provider: **Supabase Auth** with **Google** as the OAuth provider.
- Google credentials created in **Google Cloud Console** and stored only in the Supabase dashboard (never in the repo).
- Session handling via `@supabase/ssr` with cookies, so server components, route handlers and middleware all see the same session.
- Sessions persist across browser restarts (Supabase refresh tokens in cookies).
- Profile row is created automatically by a database trigger on `auth.users` insert, copying `full_name`, `email` and `avatar_url` from Google metadata.
- Redirect URLs must work for `http://localhost:3000` and the production Vercel domain.

---

## 8. Database requirements

Supabase Postgres. Full schema lives in `supabase/migrations/`. Summary:

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | One row per auth user | `id` (FK `auth.users`), `full_name`, `email`, `avatar_url`, `phone`, `created_at`, `updated_at` |
| `products` | Catalogue | `id`, `name`, `slug` (unique), `description`, `category` (enum), `price` numeric(12,2), `image_url`, `size`, `colour_name`, `colour_hex`, `stock_quantity`, `is_active`, `is_featured`, `created_at`, `updated_at` |
| `orders` | One per checkout | `id`, `user_id`, `order_number` (unique), `customer_name`, `email`, `phone`, `delivery_address`, `city`, `state`, `delivery_instructions`, `subtotal`, `delivery_fee`, `total`, `status` (enum), `payment_method`, `payment_status`, `confirmation_email_status`, `confirmation_email_sent_at`, `created_at`, `updated_at` |
| `order_items` | Line items | `id`, `order_id`, `product_id` (nullable FK, `ON DELETE SET NULL`), `product_name`, `product_image_url`, `unit_price`, `quantity`, `subtotal`, `created_at` |
| `painting_service_requests` | Service leads | `id`, `user_id` (nullable), `name`, `email`, `phone`, `service_type` (enum), `property_type`, `address`, `preferred_date`, `message`, `status`, `created_at` |

**Enums:** `product_category` (interior, exterior, ceiling, primer, gloss, textured, wood_finish, metal_finish, accessories, tools), `order_status` (pending, confirmed, processing, out_for_delivery, delivered, cancelled), `payment_status` (unpaid, paid, refunded), `service_type`, `service_request_status`.

**Indexes:** `products(slug)`, `products(category)`, `products(is_active, is_featured)`, `orders(user_id, created_at desc)`, `orders(order_number)`, `order_items(order_id)`, `painting_service_requests(user_id)`.

**Functions:**
- `handle_new_user()` trigger → inserts `profiles`.
- `calculate_delivery_fee(state text)` → numeric.
- `generate_order_number()` → `PC-YYYYMMDD-NNNN` using a daily sequence table.
- `create_order(p_customer jsonb, p_items jsonb)` → `SECURITY DEFINER`, validates `auth.uid()`, prices from `products`, inserts order + items atomically, returns the order.

**Row Level Security (all tables enabled):**
- `profiles`: select/update own row only.
- `products`: public select where `is_active = true`; no client writes.
- `orders`: select own rows; inserts only through `create_order`; no client update/delete.
- `order_items`: select where parent order is owned by the user.
- `painting_service_requests`: insert for anyone (anon or authenticated); select own rows when `user_id = auth.uid()`.

---

## 9. Checkout requirements

Flow: `Cart → Checkout → POST /api/orders → Confirmation`.

Server-side order algorithm:

1. Read session; reject with 401 if absent.
2. Parse body with `checkoutSchema` (customer) and `cartItemsSchema` (items: `productId`, `quantity`). Reject with 400 on failure.
3. Call `create_order` RPC with the authenticated client (RLS context = the user).
4. Inside Postgres: lock and load products, reject inactive / unknown / out-of-stock / over-stock items, compute totals, generate order number, insert order and items, return order.
5. Build email payload from the returned order and items; send via Mailgun.
6. Update `confirmation_email_status` to `sent` or `failed` (service client or SECURITY DEFINER function). Log failures.
7. Return `{ orderId, orderNumber }` to the client.
8. Client clears cart and navigates to confirmation.

Delivery fee rule (v1, mirrored in SQL and TypeScript, covered by a unit test):

| Condition | Fee |
|---|---|
| Subtotal ≥ ₦150,000 | ₦0 |
| Lagos | ₦2,500 |
| Ogun, Oyo, Osun, Ondo, Ekiti (South-West) | ₦4,000 |
| FCT Abuja | ₦5,000 |
| All other states | ₦7,500 |

The SQL function is the source of truth for stored orders; the TypeScript copy is for cart estimates only.

---

## 10. Email requirements

- Provider: **Mailgun** HTTP API (`POST /v3/{domain}/messages`).
- Credentials in server environment only: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`, optional `MAILGUN_API_BASE_URL` for EU region.
- Sent once per order; `confirmation_email_status` prevents duplicates on retry.
- Template rendered from a pure TypeScript function so it is testable without network access.
- Both `html` and `text` parts included.
- Subject: `Your PrimeCoat order PC-XXXXXXXX-XXXX is confirmed`.
- Reply-to: PrimeCoat support address (configurable).
- Mailgun sandbox domains only deliver to **authorised recipients**; production requires a verified domain.

---

## 11. Security requirements

- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_*`, Google client secret) never shipped to the browser. Only `NEXT_PUBLIC_*` variables are public.
- All user input validated with Zod on the server.
- Prices, totals and delivery fees computed server-side only.
- RLS enabled on every table; access to orders restricted to the owner.
- `create_order` runs as `SECURITY DEFINER` but reads `auth.uid()` and refuses when null.
- The service-role key is used only in scripts (seeding) and, if required, the email-status update. It is never used to read or write on behalf of a user request.
- No `dangerouslySetInnerHTML` with user content; email HTML escapes all user-supplied strings.
- `.env*` files git-ignored; `.env.example` contains variable names only.
- Security headers set in `next.config.ts` (X-Frame-Options, Referrer-Policy, X-Content-Type-Options).

---

## 12. Responsive requirements

Breakpoints: 320, 375, 414, 768, 1024, 1280, 1536 px.

| Surface | Mobile behaviour |
|---|---|
| Header | Logo + cart + account icon + hamburger; full-screen sheet navigation. |
| Hero | Stacked image and copy; full-width CTAs. |
| Product grid | 1 column at 320, 2 at 375+, 3 at 768, 4 at 1280. |
| Product page | Image first, then details; sticky Add-to-Cart bar on mobile. |
| Cart | Line items as stacked cards; summary pinned below. |
| Checkout | Single column; order summary collapsible above the form. |
| Orders | Cards on mobile, table on desktop. |
| Forms | Full-width inputs, 44 px minimum tap targets. |

---

## 13. Deployment requirements

- Platform: **Vercel**.
- Production env vars configured in Vercel project settings.
- Supabase Auth URL configuration: Site URL = production domain; Redirect URLs include `https://<prod>/auth/callback`, `https://*-<team>.vercel.app/auth/callback` (preview), `http://localhost:3000/auth/callback`.
- Google Cloud Console authorised redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback`.
- Mailgun domain verified with SPF/DKIM for production delivery.
- Migrations applied to the production Supabase project before deploy.

---

## 14. Acceptance criteria

| # | Criterion |
|---|---|
| AC-1 | A visitor can sign in with a real Google account and sees their name/avatar in the header. |
| AC-2 | A signed-in user who closes and reopens the browser is still signed in. |
| AC-3 | A visitor can search, filter and sort products and open product pages. |
| AC-4 | Adding to cart updates the header badge; the cart survives a refresh. |
| AC-5 | Quantity changes and removals update totals correctly. |
| AC-6 | Checkout is blocked for anonymous users and resumes after login. |
| AC-7 | Submitting checkout creates exactly one `orders` row and the correct `order_items` rows in Supabase. |
| AC-8 | Totals stored in the order equal the server-computed values regardless of what the client sent. |
| AC-9 | The confirmation page shows the order number; the cart is empty afterwards. |
| AC-10 | A real email arrives in the customer's inbox via Mailgun. |
| AC-11 | `/orders` lists the order; `/orders/[id]` shows the detail. |
| AC-12 | Another signed-in user visiting that `/orders/[id]` URL gets a 404. |
| AC-13 | After sign-out, browser close, reopen and sign-in, the order is still listed. |
| AC-14 | No secret appears in any client bundle (`grep` of `.next/static` for `MAILGUN`, `service_role`). |
| AC-15 | Unit tests for cart maths, delivery fee, validation and email rendering pass. |
| AC-16 | Production deployment passes the end-to-end acceptance test in section 15. |

---

## 15. HNG end-to-end acceptance test

1. Open the deployed site.
2. Click **Sign in with Google**; authenticate.
3. Browse the shop; add a product to cart.
4. Go to checkout; complete the form; place order.
5. Confirm the order row exists in Supabase (`orders` table).
6. Confirm the order appears under **Orders** in the account.
7. Confirm the Mailgun confirmation email arrives.
8. Sign out. Close the browser. Reopen the site.
9. Sign in with the same Google account.
10. Open **Orders**. The previous order is visible.

---

## 16. Development phases

| Phase | Scope | Exit criteria |
|---|---|---|
| 1 Planning | PRD, AGENTS, CONTEXT, README, architecture | Documents approved |
| 2 UI | Next.js scaffold, design system, all pages with seed data | `pnpm build` clean, responsive review |
| 3 Authentication | Supabase SSR client, Google OAuth, middleware, login/callback/sign-out | Real Google sign-in works locally |
| 4 Database | Migrations, enums, RLS, functions, seed | Migrations apply; RLS verified |
| 5 Cart & Checkout | Supabase cart, checkout form, `POST /api/orders`, `create_order` | Real order rows created |
| 6 Orders | `/orders`, `/orders/[id]`, `/account` wired to Supabase | Ownership verified with two accounts |
| 7 Mailgun | Email template, sender, status tracking | Real email received |
| 8 Testing | Vitest suite, manual E2E | Tests green; checklist complete |
| 9 Deployment | Vercel, env vars, OAuth URLs, Mailgun domain | Production URL live |
| 10 Production E2E | Full acceptance test on production | All 15 steps pass |

---

## 17. Open questions and deferred decisions

| Topic | Decision for v1 | Revisit when |
|---|---|---|
| Stock decrement | Not decremented on order; validated only. | Admin tooling or payments arrive. |
| Payments | Pay on Delivery. `payment_method` and `payment_status` columns exist. | Paystack integration. |
| Product variants | One row per size/colour variant. | Catalogue grows. |
| Admin UI | None; Supabase Studio. | Business needs self-service. |
| Images | Locally generated SVG product renders + curated photography placeholders with documented replacement path. | Real product photography exists. |
