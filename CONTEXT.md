# CONTEXT.md — PrimeCoat session log

This file is the hand-off between development sessions. Update it at the end of every major session. Newest entry first.

---

## Current state at a glance

| Area | Status |
|---|---|
| Planning docs (PRD, AGENTS, README, CONTEXT) | ✅ Complete |
| Next.js scaffold | ⬜ Not started |
| UI (homepage, shop, product, services, projects, cart, checkout, account, orders) | ⬜ Not started |
| Supabase Auth + Google OAuth | ⬜ Not started (needs user config) |
| Database migrations + RLS + seed | ⬜ Not started |
| Cart + checkout + `create_order` | ⬜ Not started |
| Orders + account pages wired to DB | ⬜ Not started |
| Mailgun confirmation email | ⬜ Not started (needs user config) |
| Tests | ⬜ Not started |
| Vercel deployment | ⬜ Not started (needs user config) |
| Production E2E | ⬜ Not started |

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
