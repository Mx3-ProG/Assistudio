-- =============================================================================
-- STUDIO V0.2 — schema: Stripe mirror, commission rules, attribution sessions,
-- email outbox, Connect preparation. Additive only: no table or column dropped.
--
-- Sources of truth
--   * Stripe (via signed webhooks) for every financial fact: invoices, payments,
--     refunds, disputes, subscription status.
--   * Supabase for identity, attribution, commissions, ledger, business status.
--
-- Naming: V0.1 `offers` ARE prices (amount, currency, interval). They gain the
-- Stripe columns here and are exposed as the `prices` view for clarity.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Settings (business rules still to be decided keep a conservative default)
-- -----------------------------------------------------------------------------
insert into public.settings (key, value, is_public, description) values
  ('refund.partial_policy',          '"manual_review"'::jsonb, false,
   'Partial refund effect on the commission: manual_review | proportional | full_reversal'),
  ('emails.customer_billing_owner',  '"stripe"'::jsonb,        false,
   'Who sends billing emails (receipts, failed payments, renewal reminders): stripe | studio'),
  ('payouts.connect_enabled',        'false'::jsonb,           false,
   'Allow affiliates to connect a Stripe Connect payout account'),
  ('checkout.enabled',               'true'::jsonb,            true,
   'Allow online purchase of STUDIO through Stripe Checkout')
on conflict (key) do nothing;

update public.settings set description = 'first_click | last_click | manual'
 where key = 'attribution.model';

-- -----------------------------------------------------------------------------
-- Catalog: products / prices (offers) linked to Stripe
-- -----------------------------------------------------------------------------
alter table public.products
  add column if not exists stripe_product_id text unique;

alter table public.offers
  add column if not exists price_type text not null default 'recurring'
    check (price_type in ('recurring', 'one_time')),
  add column if not exists interval_count int not null default 1 check (interval_count between 1 and 36),
  add column if not exists stripe_price_id text unique,
  -- Stable key shared by Stripe test and live mode; the price id differs per mode.
  add column if not exists stripe_lookup_key text unique;

alter table public.offers add constraint offers_interval_matches_type check (
  (price_type = 'one_time') = (billing_interval = 'one_time'));

update public.offers set stripe_lookup_key = 'studio_yearly_eur'
 where stripe_lookup_key is null
   and product_id = (select id from public.products where slug = 'studio')
   and billing_interval = 'year' and currency = 'EUR';

create view public.prices with (security_invoker = true) as
select o.id, o.product_id, o.name, o.price_cents as unit_amount_cents, o.currency, o.price_type,
       o.billing_interval, o.interval_count, o.stripe_price_id, o.stripe_lookup_key, o.is_active,
       o.valid_from, o.valid_to
  from public.offers o;

-- -----------------------------------------------------------------------------
-- Commission rules — the commission engine's configuration. Nothing about
-- rates, recurrence, duration or validation is hardcoded in application code.
-- Resolution (most specific wins): affiliate > offer > product > priority > newest.
-- -----------------------------------------------------------------------------
create table public.commission_rules (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (length(name) between 1 and 120),
  product_id          uuid references public.products (id),
  offer_id            uuid references public.offers (id),
  affiliate_id        uuid references public.affiliates (id) on delete cascade,
  commission_type     public.commission_type not null default 'percentage',
  rate                numeric(5,4) check (rate between 0 and 1),
  fixed_amount_cents  bigint check (fixed_amount_cents >= 0),
  currency            char(3),
  applies_to_new      boolean not null default true,
  applies_to_renewals boolean not null default true,
  -- null = lifetime. Counted from the subscription start.
  duration_months     int check (duration_months > 0),
  -- null = unlimited number of commissionable payments per subscription.
  max_payments        int check (max_payments > 0),
  -- null = settings.commission.validation_days
  validation_days     int check (validation_days between 0 and 365),
  -- What the percentage applies to. Tax is never commissioned by default.
  base                text not null default 'net_excluding_tax'
                      check (base in ('net_excluding_tax', 'amount_paid')),
  priority            int not null default 0,
  is_active           boolean not null default true,
  valid_from          timestamptz not null default now(),
  valid_to            timestamptz,
  created_by          uuid references public.profiles (id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint commission_rules_amount check (
    (commission_type = 'percentage' and rate is not null)
    or (commission_type = 'fixed' and fixed_amount_cents is not null and currency is not null)),
  constraint commission_rules_window check (valid_to is null or valid_to > valid_from)
);
create index commission_rules_lookup_idx on public.commission_rules (product_id, offer_id, affiliate_id) where is_active;
create trigger commission_rules_updated_at before update on public.commission_rules
  for each row execute function public.set_updated_at();

-- STUDIO default: 50% of each eligible payment, first sale and every renewal,
-- no duration limit. Validation period: the global setting.
insert into public.commission_rules (name, product_id, commission_type, rate, applies_to_new, applies_to_renewals, valid_from)
select 'STUDIO — default affiliate commission', p.id, 'percentage', 0.5000, true, true, '2020-01-01'
  from public.products p where p.slug = 'studio';

-- -----------------------------------------------------------------------------
-- Referral attribution sessions (server-side record of every touch).
-- One row per (visitor, affiliate). The visitor cookie only carries the
-- session key; which touch wins is decided server-side at conversion time.
-- -----------------------------------------------------------------------------
create table public.referral_sessions (
  id                uuid primary key default gen_random_uuid(),
  session_key       uuid not null references public.visitors (id) on delete cascade,
  affiliate_id      uuid not null references public.affiliates (id) on delete cascade,
  referral_code     text not null,
  link_id           uuid references public.affiliate_links (id) on delete set null,
  campaign_id       uuid references public.campaigns (id) on delete set null,
  private_page_id   uuid references public.private_sales_pages (id) on delete set null,
  first_touch_at    timestamptz not null default now(),
  last_touch_at     timestamptz not null default now(),
  touch_count       int not null default 1 check (touch_count >= 1),
  landing_page      text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_content       text,
  utm_term          text,
  last_landing_page text,
  last_utm          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (session_key, affiliate_id)
);
create index referral_sessions_session_idx on public.referral_sessions (session_key, last_touch_at desc);
create index referral_sessions_affiliate_idx on public.referral_sessions (affiliate_id, last_touch_at desc);
create trigger referral_sessions_updated_at before update on public.referral_sessions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Customers / subscriptions ↔ Stripe
-- -----------------------------------------------------------------------------
alter table public.customers
  add column if not exists stripe_customer_id text unique,
  add column if not exists locale text,
  add column if not exists livemode boolean;

-- Created server-side BEFORE redirecting to Stripe. The attribution it carries
-- was resolved server-side; Stripe metadata only points back to this row.
create table public.checkout_sessions (
  id                         uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique,
  status                     text not null default 'created'
                             check (status in ('created', 'open', 'complete', 'expired', 'failed')),
  origin                     text not null default 'public'
                             check (origin in ('public', 'affiliate_link', 'private_page', 'dashboard_cta')),
  offer_id                   uuid not null references public.offers (id),
  product_id                 uuid not null references public.products (id),
  affiliate_id               uuid references public.affiliates (id) on delete set null,
  referral_session_id        uuid references public.referral_sessions (id) on delete set null,
  attribution_source         text not null default 'none'
                             check (attribution_source in ('first_click', 'last_click', 'manual', 'private_page', 'affiliate_link', 'none')),
  link_id                    uuid references public.affiliate_links (id) on delete set null,
  campaign_id                uuid references public.campaigns (id) on delete set null,
  private_page_id            uuid references public.private_sales_pages (id) on delete set null,
  lead_id                    uuid references public.leads (id) on delete set null,
  session_key                uuid,
  locale                     text,
  customer_id                uuid references public.customers (id),
  stripe_customer_id         text,
  stripe_subscription_id     text,
  livemode                   boolean,
  expires_at                 timestamptz,
  completed_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index checkout_sessions_subscription_idx on public.checkout_sessions (stripe_subscription_id);
create index checkout_sessions_affiliate_idx on public.checkout_sessions (affiliate_id, created_at desc);
create trigger checkout_sessions_updated_at before update on public.checkout_sessions
  for each row execute function public.set_updated_at();

alter table public.subscriptions
  add column if not exists stripe_subscription_id text unique,
  add column if not exists checkout_session_id    uuid references public.checkout_sessions (id),
  add column if not exists referral_session_id    uuid references public.referral_sessions (id) on delete set null,
  add column if not exists attribution_source     text
    check (attribution_source in ('first_click', 'last_click', 'manual', 'private_page', 'affiliate_link', 'none', 'staff')),
  add column if not exists attributed_at          timestamptz,
  add column if not exists lead_id                uuid references public.leads (id) on delete set null,
  add column if not exists link_id                uuid references public.affiliate_links (id) on delete set null,
  add column if not exists campaign_id            uuid references public.campaigns (id) on delete set null,
  add column if not exists cancel_at_period_end   boolean not null default false,
  add column if not exists ended_at               timestamptz,
  add column if not exists livemode               boolean;

-- -----------------------------------------------------------------------------
-- Invoices, payments, refunds, disputes (mirror of Stripe financial objects)
-- -----------------------------------------------------------------------------
create table public.invoices (
  id                        uuid primary key default gen_random_uuid(),
  stripe_invoice_id         text not null unique,
  customer_id               uuid not null references public.customers (id),
  subscription_id           uuid references public.subscriptions (id),
  offer_id                  uuid references public.offers (id),
  billing_reason            text,
  status                    public.invoice_status not null,
  currency                  char(3) not null,
  amount_due_cents          bigint not null default 0 check (amount_due_cents >= 0),
  amount_paid_cents         bigint not null default 0 check (amount_paid_cents >= 0),
  total_excluding_tax_cents bigint,
  tax_cents                 bigint,
  period_start              timestamptz,
  period_end                timestamptz,
  attempt_count             int not null default 0,
  next_payment_attempt_at   timestamptz,
  paid_at                   timestamptz,
  livemode                  boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index invoices_subscription_idx on public.invoices (subscription_id, created_at desc);
create index invoices_status_idx on public.invoices (status, created_at desc);
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.payments (
  id                       uuid primary key default gen_random_uuid(),
  stripe_payment_intent_id text unique,
  stripe_charge_id         text unique,
  invoice_id               uuid references public.invoices (id),
  customer_id              uuid not null references public.customers (id),
  amount_cents             bigint not null check (amount_cents >= 0),
  amount_refunded_cents    bigint not null default 0 check (amount_refunded_cents >= 0),
  currency                 char(3) not null,
  status                   public.payment_status not null,
  failure_code             text,
  paid_at                  timestamptz,
  livemode                 boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint payments_has_stripe_ref check (stripe_payment_intent_id is not null or stripe_charge_id is not null),
  constraint payments_refund_bounded check (amount_refunded_cents <= amount_cents)
);
create index payments_invoice_idx on public.payments (invoice_id);
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.refunds (
  id               uuid primary key default gen_random_uuid(),
  stripe_refund_id text not null unique,
  payment_id       uuid not null references public.payments (id),
  amount_cents     bigint not null check (amount_cents > 0),
  currency         char(3) not null,
  status           text not null,            -- Stripe: pending | requires_action | succeeded | failed | canceled
  reason           text,
  applied_at       timestamptz,              -- financial effect applied (exactly once)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index refunds_payment_idx on public.refunds (payment_id);
create trigger refunds_updated_at before update on public.refunds
  for each row execute function public.set_updated_at();

create table public.disputes (
  id                uuid primary key default gen_random_uuid(),
  stripe_dispute_id text not null unique,
  payment_id        uuid not null references public.payments (id),
  amount_cents      bigint not null check (amount_cents >= 0),
  currency          char(3) not null,
  status            text not null,           -- Stripe dispute status
  reason            text,
  outcome           text check (outcome in ('won', 'lost')),
  opened_at         timestamptz not null default now(),
  closed_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index disputes_payment_idx on public.disputes (payment_id);
create trigger disputes_updated_at before update on public.disputes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sales ← invoices (one sale per paid invoice: the idempotency anchor)
-- -----------------------------------------------------------------------------
alter table public.sales
  add column if not exists invoice_id          uuid unique references public.invoices (id),
  add column if not exists payment_id          uuid references public.payments (id),
  add column if not exists checkout_session_id uuid references public.checkout_sessions (id),
  -- Commission base when the rule says net_excluding_tax (null → gross).
  add column if not exists net_amount_cents    bigint check (net_amount_cents >= 0),
  add column if not exists livemode            boolean;
create index if not exists sales_subscription_idx on public.sales (subscription_id, paid_at);

-- -----------------------------------------------------------------------------
-- Commissions & ledger (V0.2 traceability columns)
-- -----------------------------------------------------------------------------
alter table public.commissions
  add column if not exists rule_id         uuid references public.commission_rules (id),
  add column if not exists kind            public.sale_kind,
  -- Paid commission later reversed: money must be recovered from future payouts.
  add column if not exists recovery_status text check (recovery_status in ('required', 'recovered', 'written_off')),
  add column if not exists dispute_reason  text;

alter table public.commission_ledger
  add column if not exists sale_id            uuid references public.sales (id),
  add column if not exists invoice_id         uuid references public.invoices (id),
  add column if not exists subscription_id    uuid references public.subscriptions (id),
  add column if not exists product_id         uuid references public.products (id),
  add column if not exists rule_id            uuid references public.commission_rules (id),
  add column if not exists gross_amount_cents bigint,
  add column if not exists commission_rate    numeric(5,4);
create index if not exists commission_ledger_sale_idx on public.commission_ledger (sale_id);

-- The ledger is append-only, so "this clawback / adjustment was settled by
-- that payout" lives in its own table instead of an UPDATE on the ledger row.
create table public.ledger_settlements (
  ledger_id  bigint primary key references public.commission_ledger (id),
  payout_id  uuid not null references public.payouts (id),
  created_at timestamptz not null default now()
);
create index ledger_settlements_payout_idx on public.ledger_settlements (payout_id);

-- -----------------------------------------------------------------------------
-- Stripe webhook events (idempotency + observability)
-- -----------------------------------------------------------------------------
create table public.stripe_events (
  id                bigint generated always as identity primary key,
  stripe_event_id   text not null unique,
  type              text not null,
  livemode          boolean not null,
  api_version       text,
  stripe_created_at timestamptz,
  -- Minimal reference to the object (ids, amounts, status). Never the full
  -- payload: it would duplicate customer personal data for no benefit.
  reference         jsonb not null default '{}'::jsonb,
  processing_status public.stripe_event_status not null default 'received',
  attempts          int not null default 0,
  locked_at         timestamptz,
  received_at       timestamptz not null default now(),
  processed_at      timestamptz,
  error             text
);
create index stripe_events_status_idx on public.stripe_events (processing_status, received_at desc);
create index stripe_events_type_idx on public.stripe_events (type, received_at desc);

-- -----------------------------------------------------------------------------
-- Payout rails: Stripe Connect preparation
-- -----------------------------------------------------------------------------
alter table public.affiliates
  add column if not exists stripe_connected_account_id text unique,
  add column if not exists connect_onboarding_status   public.connect_onboarding_status not null default 'not_started',
  add column if not exists payouts_enabled             boolean not null default false,
  -- none | currently_due | past_due | pending_verification | disabled
  add column if not exists connect_requirements_status text,
  add column if not exists connect_updated_at          timestamptz;

alter table public.payouts
  add column if not exists method             text not null default 'manual'
    check (method in ('manual', 'stripe_connect')),
  add column if not exists stripe_transfer_id text unique;

-- -----------------------------------------------------------------------------
-- Transactional email outbox + log (Resend). Recipients are references, the
-- address is resolved at send time; params hold no sensitive data.
-- -----------------------------------------------------------------------------
create table public.email_events (
  id                    uuid primary key default gen_random_uuid(),
  idempotency_key       text not null unique,
  template              text not null,
  recipient_type        text not null check (recipient_type in ('affiliate', 'customer', 'lead', 'staff')),
  recipient_profile_id  uuid references public.profiles (id) on delete set null,
  recipient_customer_id uuid references public.customers (id) on delete set null,
  recipient_lead_id     uuid references public.leads (id) on delete set null,
  related_entity        text,
  related_id            text,
  params                jsonb not null default '{}'::jsonb,
  status                public.email_status not null default 'queued',
  provider              text,
  provider_message_id   text,
  attempts              int not null default 0,
  last_attempt_at       timestamptz,
  requested_at          timestamptz not null default now(),
  sent_at               timestamptz,
  error                 text,
  updated_at            timestamptz not null default now(),
  constraint email_events_has_recipient check (
    recipient_profile_id is not null or recipient_customer_id is not null or recipient_lead_id is not null)
);
create index email_events_outbox_idx on public.email_events (requested_at) where status in ('queued', 'failed');
create index email_events_related_idx on public.email_events (related_entity, related_id);
create trigger email_events_updated_at before update on public.email_events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Notification center: unread / read / archived
-- -----------------------------------------------------------------------------
alter table public.notifications
  add column if not exists archived_at timestamptz,
  add column if not exists status text generated always as (
    case when archived_at is not null then 'archived' when read_at is not null then 'read' else 'unread' end) stored;
create index if not exists notifications_profile_status_idx on public.notifications (profile_id, status, created_at desc);

-- -----------------------------------------------------------------------------
-- Live activity: real pipeline events only
-- -----------------------------------------------------------------------------
alter table public.activity_events drop constraint if exists activity_events_type_check;
alter table public.activity_events add constraint activity_events_type_check check (type in (
  'click', 'visitor', 'lead', 'appointment', 'checkout_started', 'sale_pending', 'payment_confirmed',
  'commission_pending', 'commission_validated', 'commission_available', 'commission_reversed',
  'commission_disputed', 'commission_paid', 'payout_completed', 'renewal', 'renewal_confirmed',
  'payment_failed', 'customer_lost'
));
