# STUDIO — Affiliate Commerce Platform (V0)

A premium platform to recruit, equip and pay an international network of partners who sell **one product: STUDIO (€3,000 / year, 50% recurring commission)**.

The critical pipeline — and the thing this V0 is built around:

```
AFFILIATE → LINK → PROSPECT/LEAD → SALE → PAYMENT → COMMISSION → RENEWAL → PAYOUT
```

## Quick start (demo mode, no setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Log in** → *Continue as demo affiliate* (or *demo admin*).

Without Supabase credentials the app runs in **demo mode**: an in-memory store with clearly-labelled fake data (a yellow banner is shown on every page). Demo mode is **impossible on a production deployment** (`src/lib/env.ts`). The production database seed (`supabase/seed.sql`) contains content only (markets, sales kit) — never fake customers, sales or commissions.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, RLS) · Three.js (hero only, lazy, with CSS fallback) · Zod · Vercel.

## Connecting Supabase

```bash
cp .env.example .env.local           # fill in the Supabase URL + keys
supabase link --project-ref <ref>
npm run db:push                      # applies supabase/migrations/*
psql "$DATABASE_URL" -f supabase/seed.sql   # markets + sales kit content
```

Create the first super admin after signing up through `/register`:

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';
```

Then configure in Supabase Auth: email confirmations, magic links, redirect URL `https://<site>/auth/callback`, and any OAuth providers (listed in `NEXT_PUBLIC_OAUTH_PROVIDERS`).

## Architecture

| Concern | Where |
| --- | --- |
| Schema, enums, indexes, constraints | `supabase/migrations/…_core_schema.sql` |
| Commission lifecycle, ledger, renewals, staff operations (audited) | `…_commission_engine.sql`, `…_manual_sales.sql` |
| Row Level Security (every table) | `…_rls.sql` |
| Pure domain logic (tested) | `src/lib/commission.ts`, `src/lib/attribution.ts` |
| Data access contract | `src/lib/data/repo.ts` → `supabase.ts` (prod) / `demo.ts` (dev) |
| Locale routing, `?ref=` capture, session refresh, noindex headers | `src/proxy.ts` |
| Click tracking + attribution cookies | `src/app/s/[code]/route.ts`, `src/lib/tracking` |
| Lead capture + attribution resolution | `src/app/actions/lead.ts` |
| Daily cron (release commissions, schedule renewals) | `src/app/api/cron/daily`, `vercel.json` |
| Payment webhook contract (provider not wired yet) | `src/lib/payments`, `src/app/api/webhooks/payments` |
| Email abstraction (Resend, console fallback) | `src/lib/email` |

**Money & commissions.** Amounts are integer cents. A commission is created `pending` with the sale, becomes `in_validation` only when the payment is collected, `available` after the configurable validation period, then `paid` via a payout. Refunds / chargebacks / unpaid invoices reverse it (a `clawback` if it was already paid out). Every movement is an append-only `commission_ledger` entry. The UI never shows pending money as earned; projections are always labelled as projections.

**Attribution.** Affiliate links: `/s/{slug|code|linkCode}` or any page with `?ref=CODE`. The cookie stores the first **and** last touch; the winning model (`first_click` / `last_click`) and the window (days) are read from `public.settings` at conversion time — nothing is hardcoded. Private sales pages (`/p/{slug}`) attribute explicitly and are `noindex`, excluded from the sitemap.

**Fraud.** Signals (duplicate leads, self-referrals, click bursts, chargebacks) create `fraud_flags` and at most put a commission `on_hold`. Accounts are never blocked automatically: *Flag → Review → Decision*, all audited.

**Privacy.** Affiliates only see their own rows (RLS). They never see inbound leads' contact details (`my_leads` view) or customer identity beyond company name + public ref (`my_customers` view). IPs / user agents are stored as salted daily hashes. Users can export their data and request erasure from Settings.

## Routes

- Public (indexable, 8 locales): `/`, `/studio`, `/partners`, `/faq`, `/about`, `/contact`, `/security`, legal pages
- Auth: `/login`, `/register`, `/forgot`, `/auth/callback`
- Affiliate: `/dashboard` + `welcome`, `link`, `campaigns`, `prospects`, `find`, `sales-kit`, `product`, `sales`, `commissions`, `recurring`, `payouts`, `analytics`, `leaderboard`, `notifications`, `settings`
- Admin: `/admin` + `affiliates`, `leads`, `sales`, `commissions`, `payouts`, `fraud`, `markets`, `content`, `settings`, `audit`

## Internationalisation

Locales: `en fr de es pt it nl ar` (Arabic is fully RTL). All UI copy lives in `src/i18n/dictionaries`; components never hardcode business text. `en` is the reference; `fr` is complete; `de es pt it nl ar` currently cover the public headline copy and fall back to English key by key — **they need professional translation before launch**. To add a language: add it to `src/i18n/config.ts` and create a dictionary file.

## Checks

```bash
npm test          # commission + attribution domain tests
npm run db:test   # 37 SQL assertions: pipeline, clawbacks, ledger, fraud, RLS isolation (rolls back; local/staging DB only)
npm run typecheck
npm run lint
npm run build     # needs Supabase env, or STUDIO_DEMO_MODE=true for a local build
```

## Not in V0 (deliberately) / next steps

- **Payment provider**: implement `PaymentProvider` (customer billing) and a payout rail; until then staff record sales from leads and confirm payments manually (audited).
- **Legal pages**: placeholders only — real content must come from legal counsel.
- Email delivery worker for `notification_deliveries`; admin editing + uploads for the sales kit; CSV import of prospects; authorised prospect-data providers in *Find clients*; rate limiting / bot protection on the lead form; generated Supabase types (`npm run db:types`).
