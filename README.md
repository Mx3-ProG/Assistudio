# Studio ATS — Affiliate Commerce Platform (V0.2)

A premium platform to recruit, equip and pay an international network of partners who sell **one product, Studio ATS, in three offers — Studio One (€500 one-time), Studio Pro (€3,000 / year), Studio Premium (€6,000 / year) — with the same rules on each: 25% direct commission (on every paid renewal for the annual offers) + 5% direct-sponsor commission, uncapped**. Prices live in `public.offers` (`20260928000001_offers_v3.sql`); `src/lib/offers.ts` maps them to tiers. The partner home always headlines the maximum per sale (Studio Premium).

The critical pipeline — and the thing this V0 is built around:

```
AFFILIATE → LINK → PROSPECT/LEAD → SALE → PAYMENT → COMMISSION → RENEWAL → PAYOUT
```

**V0.2** connects Stripe (Checkout, Billing, webhooks, Connect preparation), a real commission ledger with recurring commissions, and Resend transactional emails. Read **[docs/V0.2-payments.md](docs/V0.2-payments.md)** for the pipeline, setup in Stripe test mode, email responsibilities, test coverage and the business decisions still to confirm.

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

Then, in Supabase Auth, keep the **Email** provider enabled. **No SMTP and no Supabase email template is needed**: sign-in emails are sent by the app (see *Sign-in* below). Add the redirect URL `https://<site>/auth/callback` only if you enable OAuth providers (listed in `NEXT_PUBLIC_OAUTH_PROVIDERS`).

## Sign-in (passwordless, email code)

There are no passwords. Login and sign-up are the same two steps:

1. The person enters their email (plus the partner application on `/register`, including the sponsor code from `?sponsor=`). The app generates a **6-digit code**, stores only its keyed hash (`AUTH_CODE_SECRET`) in `auth_login_codes`, and **emails it itself through Resend**.
2. They type the code. It is **valid 5 minutes, single use, 5 attempts**. On success the account is created on first sign-up (`auth.admin.createUser`, email confirmed; `provision_user()` creates the profile, the affiliate application and the sponsor link), then the session is opened in the current browser (`generateLink` → `verifyOtp`; no email from Supabase, no PKCE redirect, works on any device).

Rules (expiry, single use, attempts, rate limits: 1 code / 60 s and 5 / 15 min per address, 20 / 15 min per network) live in `…_email_login_codes.sql` (tested in `supabase/tests/auth_codes_test.sql`), mirrored by `src/lib/auth-code-rules.ts`. A login request for an unknown address shows the same screen and sends nothing (no account enumeration). Profiles do **not** depend on a trigger on `auth.users` (owned by Supabase; creating it can fail with "must be owner of table users"): the trigger is created only when allowed, and the app provisions the profile + affiliate application itself with `provision_user()` / `ensure_profile()` (`…_ensure_profile.sql`), also repairing accounts created without one. In demo mode the code is shown on screen, labelled.

**Not receiving codes?** Check `RESEND_API_KEY` (production refuses to run sign-in without it), and that the domain of `EMAIL_FROM` is **verified in Resend**: otherwise Resend only delivers to the account owner's own address.

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
| Stripe webhook, checkout, attribution, payouts (services) | `src/lib/services/*`, `src/app/api/webhooks/stripe` |
| Stripe mirror, commission engine & rules, email outbox (V0.2) | `supabase/migrations/20260925*` |
| Email service (templates, Resend, outbox) | `src/lib/email` |
| Passwordless sign-in (6-digit email codes) | `src/app/actions/auth.ts`, `src/lib/auth-code*.ts`, `…_email_login_codes.sql` |

**Money & commissions.** Amounts are integer cents. A commission is created only when Stripe confirms the payment: `pending` during the configurable validation period, then `available`, then `paid` via a payout; `disputed` when a human must decide. Refunds / chargebacks reverse it (a `clawback` if it was already paid out, recovered from the next payout). Renewal commissions are created by each renewal payment — never in advance. Every movement is an append-only `commission_ledger` entry. The UI never shows pending money as earned; projections are always labelled as projections.

**Attribution.** Affiliate links: `/s/{slug|code|linkCode}` or any page with `?ref=CODE`. The cookie stores the first **and** last touch; the winning model (`first_click` / `last_click`) and the window (days) are read from `public.settings` at conversion time — nothing is hardcoded. Private sales pages (`/p/{slug}`) attribute explicitly and are `noindex`, excluded from the sitemap.

**Fraud.** Signals (duplicate leads, self-referrals, click bursts, chargebacks) create `fraud_flags` and at most put a commission `on_hold`. Accounts are never blocked automatically: *Flag → Review → Decision*, all audited.

**Privacy.** Affiliates only see their own rows (RLS). They never see inbound leads' contact details (`my_leads` view) or customer identity beyond company name + public ref (`my_customers` view). IPs / user agents are stored as salted daily hashes. Users can export their data and request erasure from Settings.

## Routes

- Public (indexable, 8 locales): `/`, `/studio`, `/pricing`, `/partners`, `/faq`, `/about`, `/contact`, `/security`, legal pages
- Auth: `/login`, `/register` (email code, no password), `/auth/callback` (OAuth only); `/forgot` redirects to `/login`
- Affiliate: `/dashboard` + `welcome`, `link`, `campaigns`, `prospects`, `find`, `sales-kit`, `product`, `sales`, `commissions`, `recurring`, `payouts`, `analytics`, `leaderboard`, `notifications`, `settings`
- Admin: `/admin` + `affiliates`, `leads`, `sales`, `commissions`, `payouts`, `fraud`, `markets`, `content`, `settings`, `audit`

## Internationalisation

Locales: `en fr de es pt it nl ar` (Arabic is fully RTL). All UI copy lives in `src/i18n/dictionaries`; components never hardcode business text. `en` is the reference; `fr` is complete; `de es pt it nl ar` currently cover the public headline copy and fall back to English key by key — **they need professional translation before launch**. To add a language: add it to `src/i18n/config.ts` and create a dictionary file.

## Checks

```bash
npm test               # 42 unit tests: commission engine, money, Stripe normalisation + signatures, emails, attribution
npm run db:test:local  # 161 SQL assertions on a throwaway local Postgres (no Docker): V0.1 pipeline + the 10 V0.2 scenarios
npm run db:test        # same suites against $DATABASE_URL (rolls back; local/staging DB only)
npm run typecheck
npm run lint
npm run build     # needs Supabase env, or STUDIO_DEMO_MODE=true for a local build
```

## Not in V0 (deliberately) / next steps

- **Payouts**: created by staff after validation (audited). Stripe Connect onboarding is ready behind `payouts.connect_enabled`; automatic transfers are deliberately not implemented.
- **Legal pages**: placeholders only — real content must come from legal counsel.
- Email delivery worker for `notification_deliveries`; admin editing + uploads for the sales kit; CSV import of prospects; authorised prospect-data providers in *Find clients*; rate limiting / bot protection on the lead form; generated Supabase types (`npm run db:types`).
