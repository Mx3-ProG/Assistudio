-- =============================================================================
-- STUDIO — core schema (V0)
-- Pipeline: AFFILIATE → LINK → PROSPECT → SALE → PAYMENT → COMMISSION → RENEWAL
--
-- Conventions
--   * Money is stored in minor units (cents) as bigint + ISO currency code.
--   * Every table has created_at / updated_at; mutable business tables have
--     deleted_at (soft delete) where GDPR erasure or history matters.
--   * Financial state changes are only performed by SECURITY DEFINER functions
--     (see 20260924000002_commission_engine.sql) and are always audit-logged.
--   * Personal data is minimised: IPs / user agents are stored as salted hashes.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum (
  'super_admin', 'admin',
  -- reserved for later phases, already valid values so no enum migration needed
  'affiliate_manager', 'agency', 'sales_closer',
  'affiliate'
);

create type public.affiliate_status as enum ('pending', 'approved', 'rejected', 'suspended');

create type public.prospect_stage as enum (
  'new', 'contacted', 'interested', 'appointment', 'proposal', 'won', 'lost'
);

create type public.lead_status as enum (
  'new', 'qualified', 'appointment_requested', 'converted', 'disqualified', 'duplicate'
);

create type public.billing_interval as enum ('month', 'year', 'one_time');

create type public.subscription_status as enum ('active', 'past_due', 'cancelled', 'expired');

create type public.sale_kind as enum ('new', 'renewal', 'upgrade', 'downgrade');

create type public.sale_status as enum (
  'pending',     -- order created, payment not collected
  'paid',        -- payment collected
  'failed',      -- payment failed / unpaid
  'refunded',
  'chargeback',
  'cancelled'
);

-- A commission is never "earned" before its payment is collected.
create type public.commission_status as enum (
  'pending',        -- sale exists, payment not yet collected
  'in_validation',  -- payment collected, inside the validation (refund) window
  'on_hold',        -- frozen by a dispute / fraud review
  'available',      -- validated, can be paid out
  'paid',           -- included in a completed payout
  'reversed'        -- cancelled: refund, chargeback, unpaid, fraud
);

create type public.ledger_entry_type as enum (
  'accrual',      -- commission created (pending bucket)
  'validation',   -- payment collected → in_validation bucket
  'release',      -- validation period over → available bucket
  'hold',         -- moved to on_hold
  'unhold',
  'payout',       -- available → paid
  'reversal',     -- cancelled before payout
  'clawback',     -- cancelled after payout (negative balance carried forward)
  'adjustment'    -- manual staff correction (always with reason + audit)
);

create type public.ledger_bucket as enum ('pending', 'in_validation', 'on_hold', 'available', 'paid', 'reversed');

create type public.payout_status as enum ('scheduled', 'processing', 'paid', 'failed', 'cancelled');

create type public.renewal_status as enum ('upcoming', 'renewed', 'failed', 'cancelled');

create type public.fraud_flag_type as enum (
  'duplicate_lead', 'self_referral', 'suspicious_traffic', 'bot_traffic',
  'abnormal_clicks', 'duplicate_account', 'commission_dispute', 'manual_review'
);

create type public.fraud_status as enum ('open', 'reviewing', 'dismissed', 'confirmed');

create type public.notification_type as enum (
  'lead', 'appointment', 'sale', 'payment', 'commission', 'payout',
  'renewal', 'lost_customer', 'admin_message'
);

create type public.notification_channel as enum ('in_app', 'email', 'push', 'sms', 'whatsapp');

create type public.asset_type as enum (
  'email', 'whatsapp', 'linkedin', 'instagram', 'cold_call', 'objection',
  'visual', 'video', 'presentation'
);

create type public.page_visibility as enum ('public', 'unlisted', 'private');

create type public.attribution_model as enum ('first_click', 'last_click');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Short, unambiguous public codes (no 0/O/1/I).
create or replace function public.gen_code(len int default 6) returns text
language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
begin
  for i in 1..len loop
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return out;
end $$;

-- -----------------------------------------------------------------------------
-- Settings (admin-configurable business rules — nothing hardcoded in the app)
-- -----------------------------------------------------------------------------
create table public.settings (
  key         text primary key,
  value       jsonb not null,
  is_public   boolean not null default false,  -- readable by anonymous visitors
  description text,
  updated_by  uuid,
  updated_at  timestamptz not null default now()
);

insert into public.settings (key, value, is_public, description) values
  ('attribution.window_days',     '90'::jsonb,            true,  'Days a referral click remains eligible for attribution'),
  ('attribution.model',           '"last_click"'::jsonb,  true,  'first_click | last_click'),
  ('commission.validation_days',  '30'::jsonb,            false, 'Days after payment before a commission becomes available'),
  ('payout.minimum_cents',        '5000'::jsonb,          false, 'Minimum available balance to trigger a payout'),
  ('payout.schedule',             '"monthly"'::jsonb,     false, 'Payout cadence'),
  ('affiliates.auto_approve',     'false'::jsonb,         false, 'Approve new affiliates without manual review'),
  ('leaderboard.enabled',         'false'::jsonb,         true,  'Show the affiliate leaderboard'),
  ('fraud.click_burst_threshold', '50'::jsonb,            false, 'Clicks per visitor per hour that raises a flag');

-- -----------------------------------------------------------------------------
-- Identity
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                public.user_role not null default 'affiliate',
  full_name           text,
  display_name        text,                -- pseudonym for leaderboard / public surfaces
  email               citext,
  locale              text not null default 'en',
  leaderboard_opt_in  boolean not null default false,
  marketing_consent_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index profiles_role_idx on public.profiles (role) where deleted_at is null;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.affiliates (
  id                      uuid primary key default gen_random_uuid(),
  profile_id              uuid not null unique references public.profiles (id) on delete cascade,
  code                    text not null unique default public.gen_code(6),   -- ?ref=ABC123
  slug                    citext unique,                                      -- /s/mathieu
  status                  public.affiliate_status not null default 'pending',
  commission_rate_override numeric(5,4) check (commission_rate_override between 0 and 1),
  country                 text,
  application             jsonb not null default '{}'::jsonb,                 -- motivation, channels…
  payout_provider         text,              -- e.g. 'stripe_connect' / 'wise' — no raw bank data here
  payout_account_ref      text,              -- tokenised provider account id
  monthly_goal_sales      int check (monthly_goal_sales between 0 and 1000),
  onboarding_step         int not null default 0,
  onboarding_completed_at timestamptz,
  approved_at             timestamptz,
  approved_by             uuid references public.profiles (id),
  suspended_reason        text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz,
  constraint affiliates_slug_format check (slug is null or slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$')
);
create index affiliates_status_idx on public.affiliates (status) where deleted_at is null;
create trigger affiliates_updated_at before update on public.affiliates
  for each row execute function public.set_updated_at();

-- Current user helpers (SECURITY DEFINER so they can be used inside RLS policies
-- without recursive policy evaluation).
create or replace function public.current_role_name() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and deleted_at is null
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('super_admin', 'admin'), false)
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'super_admin', false)
$$;

create or replace function public.current_affiliate_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.affiliates where profile_id = auth.uid() and deleted_at is null
$$;

-- New auth user → profile + affiliate application.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  auto_approve boolean;
begin
  select coalesce((value)::boolean, false) into auto_approve
    from public.settings where key = 'affiliates.auto_approve';

  insert into public.profiles (id, email, full_name, locale)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  );

  insert into public.affiliates (profile_id, status, approved_at, country, application)
  values (
    new.id,
    case when auto_approve then 'approved'::public.affiliate_status else 'pending' end,
    case when auto_approve then now() end,
    new.raw_user_meta_data ->> 'country',
    coalesce(new.raw_user_meta_data -> 'application', '{}'::jsonb)
  );
  return new;
end $$;

-- auth.users belongs to Supabase (supabase_auth_admin). Depending on the
-- project and the role running the migration, creating a trigger on it can be
-- refused ("must be owner of table users"). The trigger is therefore optional:
-- the app provisions profiles itself through public.ensure_profile() /
-- public.provision_user() (20261002000001_ensure_profile.sql).
do $$ begin
  create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();
exception when insufficient_privilege then
  raise notice 'on_auth_user_created not created (auth.users not owned): profiles are provisioned by public.ensure_profile()';
end $$;

-- Users can never change their own role / status.
create or replace function public.guard_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_super_admin()
     and auth.uid() is not null then
    raise exception 'Only a super admin can change roles';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

create or replace function public.guard_affiliate_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if new.status is distinct from old.status
       or new.code is distinct from old.code
       or new.commission_rate_override is distinct from old.commission_rate_override
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
       or new.profile_id is distinct from old.profile_id then
      raise exception 'Field is managed by STUDIO staff';
    end if;
  end if;
  return new;
end $$;
create trigger affiliates_guard_fields before update on public.affiliates
  for each row execute function public.guard_affiliate_fields();

-- -----------------------------------------------------------------------------
-- Catalog (one product in V0, multi-product ready)
-- -----------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  content     jsonb not null default '{}'::jsonb,   -- localised marketing content keyed by locale
  is_active   boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.offers (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id),
  name                text not null,
  price_cents         bigint not null check (price_cents >= 0),
  currency            char(3) not null default 'EUR',
  billing_interval    public.billing_interval not null default 'year',
  commission_rate     numeric(5,4) not null check (commission_rate between 0 and 1),
  commission_recurring boolean not null default true,
  is_active           boolean not null default true,
  valid_from          timestamptz not null default now(),
  valid_to            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index offers_product_idx on public.offers (product_id) where is_active;
create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

insert into public.products (slug, name) values ('studio', 'STUDIO');
insert into public.offers (product_id, name, price_cents, currency, billing_interval, commission_rate, commission_recurring)
select id, 'STUDIO — Annual', 300000, 'EUR', 'year', 0.5000, true from public.products where slug = 'studio';

-- -----------------------------------------------------------------------------
-- Markets (admin-managed, localised)
-- -----------------------------------------------------------------------------
create table public.markets (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  icon        text,
  -- { "en": { "name", "who", "why", "problem", "angle", "message" }, "fr": {...} }
  content     jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger markets_updated_at before update on public.markets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Tracking: campaigns, links, visitors, clicks
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  name         text not null check (length(name) between 1 and 120),
  source       text,          -- instagram, linkedin, email…
  medium       text,
  market_id    uuid references public.markets (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  archived_at  timestamptz
);
create index campaigns_affiliate_idx on public.campaigns (affiliate_id);
create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.affiliate_links (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  campaign_id  uuid references public.campaigns (id) on delete set null,
  code         text not null unique default public.gen_code(8),
  name         text not null check (length(name) between 1 and 120),
  destination  text not null default 'studio' check (destination in ('studio', 'home', 'private_page')),
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  archived_at  timestamptz
);
create index affiliate_links_affiliate_idx on public.affiliate_links (affiliate_id);
create unique index affiliate_links_one_default on public.affiliate_links (affiliate_id) where is_default;
create trigger affiliate_links_updated_at before update on public.affiliate_links
  for each row execute function public.set_updated_at();

-- Anonymous visitor identity (first-party cookie id). No raw IP stored.
create table public.visitors (
  id            uuid primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  country       char(2),
  device_type   text check (device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  is_bot        boolean not null default false
);

create table public.clicks (
  id              bigint generated always as identity primary key,
  affiliate_id    uuid not null references public.affiliates (id) on delete cascade,
  link_id         uuid references public.affiliate_links (id) on delete set null,
  campaign_id     uuid references public.campaigns (id) on delete set null,
  private_page_id uuid,
  visitor_id      uuid references public.visitors (id) on delete set null,
  occurred_at     timestamptz not null default now(),
  landing_path    text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  referrer_host   text,
  country         char(2),
  device_type     text,
  ip_hash         text,          -- sha256(ip + daily salt) — fraud detection only
  ua_hash         text,
  is_bot          boolean not null default false,
  is_suspicious   boolean not null default false
);
create index clicks_affiliate_time_idx on public.clicks (affiliate_id, occurred_at desc);
create index clicks_link_idx on public.clicks (link_id, occurred_at desc);
create index clicks_visitor_idx on public.clicks (visitor_id, occurred_at desc);

-- -----------------------------------------------------------------------------
-- Leads (inbound requests from STUDIO pages) & Prospects (affiliate CRM)
-- -----------------------------------------------------------------------------
create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  affiliate_id      uuid references public.affiliates (id) on delete set null,
  link_id           uuid references public.affiliate_links (id) on delete set null,
  campaign_id       uuid references public.campaigns (id) on delete set null,
  private_page_id   uuid,
  visitor_id        uuid references public.visitors (id) on delete set null,
  attribution_model public.attribution_model,
  first_click_at    timestamptz,
  last_click_at     timestamptz,
  utm               jsonb not null default '{}'::jsonb,
  full_name         text not null,
  company           text,
  profession        text,
  email             citext not null,
  phone             text,
  website           text,
  message           text,
  locale            text,
  status            public.lead_status not null default 'new',
  appointment_at    timestamptz,
  consent_at        timestamptz not null,     -- privacy notice acknowledgement
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index leads_affiliate_idx on public.leads (affiliate_id, created_at desc) where deleted_at is null;
create index leads_email_idx on public.leads (email);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create table public.prospects (
  id                    uuid primary key default gen_random_uuid(),
  affiliate_id          uuid not null references public.affiliates (id) on delete cascade,
  lead_id               uuid references public.leads (id) on delete set null,
  campaign_id           uuid references public.campaigns (id) on delete set null,
  market_id             uuid references public.markets (id) on delete set null,
  name                  text not null check (length(name) between 1 and 200),
  company               text,
  profession            text,
  email                 citext,
  phone                 text,
  website               text,
  notes                 text,
  source                text,
  stage                 public.prospect_stage not null default 'new',
  next_action           text,
  next_action_at        timestamptz,
  potential_value_cents bigint check (potential_value_cents >= 0),
  stage_changed_at      timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index prospects_affiliate_stage_idx on public.prospects (affiliate_id, stage) where deleted_at is null;
create index prospects_next_action_idx on public.prospects (affiliate_id, next_action_at) where deleted_at is null;
create trigger prospects_updated_at before update on public.prospects
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Customers, subscriptions, sales, renewals
-- -----------------------------------------------------------------------------
create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  public_ref    text not null unique default ('CUS-' || public.gen_code(6)),  -- safe id shown to affiliates
  company_name  text,
  contact_name  text,
  email         citext,
  country       char(2),
  provider_customer_id text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.customers (id),
  offer_id              uuid not null references public.offers (id),
  affiliate_id          uuid references public.affiliates (id) on delete set null,
  status                public.subscription_status not null default 'active',
  started_at            timestamptz not null default now(),
  current_period_start  timestamptz not null default now(),
  current_period_end    timestamptz not null,
  cancel_at             timestamptz,
  cancelled_at          timestamptz,
  provider              text,
  provider_subscription_id text unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index subscriptions_affiliate_idx on public.subscriptions (affiliate_id, status);
create index subscriptions_period_end_idx on public.subscriptions (current_period_end) where status = 'active';
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table public.sales (
  id                  uuid primary key default gen_random_uuid(),
  public_ref          text not null unique default ('SAL-' || public.gen_code(6)),
  subscription_id     uuid references public.subscriptions (id),
  customer_id         uuid not null references public.customers (id),
  offer_id            uuid not null references public.offers (id),
  affiliate_id        uuid references public.affiliates (id) on delete set null,
  lead_id             uuid references public.leads (id) on delete set null,
  link_id             uuid references public.affiliate_links (id) on delete set null,
  campaign_id         uuid references public.campaigns (id) on delete set null,
  kind                public.sale_kind not null default 'new',
  status              public.sale_status not null default 'pending',
  gross_amount_cents  bigint not null check (gross_amount_cents >= 0),
  currency            char(3) not null default 'EUR',
  period_start        timestamptz,
  period_end          timestamptz,
  paid_at             timestamptz,
  refunded_at         timestamptz,
  provider_payment_id text unique,       -- idempotency for payment webhooks
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index sales_affiliate_idx on public.sales (affiliate_id, created_at desc);
create index sales_status_idx on public.sales (status);
create trigger sales_updated_at before update on public.sales
  for each row execute function public.set_updated_at();

create table public.renewals (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  period_start    timestamptz not null,
  period_end      timestamptz not null,
  due_at          timestamptz not null,
  status          public.renewal_status not null default 'upcoming',
  sale_id         uuid references public.sales (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (subscription_id, period_start)
);
create index renewals_due_idx on public.renewals (due_at) where status = 'upcoming';
create trigger renewals_updated_at before update on public.renewals
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Commissions & ledger
-- -----------------------------------------------------------------------------
create table public.payouts (
  id             uuid primary key default gen_random_uuid(),
  public_ref     text not null unique default ('PAY-' || public.gen_code(6)),
  affiliate_id   uuid not null references public.affiliates (id),
  amount_cents   bigint not null check (amount_cents > 0),
  currency       char(3) not null default 'EUR',
  status         public.payout_status not null default 'scheduled',
  provider       text,
  provider_ref   text unique,
  scheduled_for  date not null,
  paid_at        timestamptz,
  failure_reason text,
  document_path  text,            -- storage path to invoice / self-billing statement
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index payouts_affiliate_idx on public.payouts (affiliate_id, created_at desc);
create trigger payouts_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

create table public.commissions (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliates (id),
  sale_id         uuid not null references public.sales (id),
  payout_id       uuid references public.payouts (id),
  rate            numeric(5,4) not null check (rate between 0 and 1),
  base_amount_cents bigint not null check (base_amount_cents >= 0),
  amount_cents    bigint not null check (amount_cents >= 0),
  currency        char(3) not null default 'EUR',
  status          public.commission_status not null default 'pending',
  hold_until      timestamptz,          -- end of validation window
  validated_at    timestamptz,          -- payment collected
  available_at    timestamptz,
  paid_at         timestamptz,
  reversed_at     timestamptz,
  reversal_reason text,
  expected_payment_date date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (sale_id, affiliate_id)
);
create index commissions_affiliate_status_idx on public.commissions (affiliate_id, status);
create index commissions_hold_idx on public.commissions (hold_until) where status = 'in_validation';
create trigger commissions_updated_at before update on public.commissions
  for each row execute function public.set_updated_at();

-- Append-only double-entry style movements between buckets.
create table public.commission_ledger (
  id            bigint generated always as identity primary key,
  commission_id uuid references public.commissions (id),
  affiliate_id  uuid not null references public.affiliates (id),
  payout_id     uuid references public.payouts (id),
  entry_type    public.ledger_entry_type not null,
  from_bucket   public.ledger_bucket,
  to_bucket     public.ledger_bucket,
  amount_cents  bigint not null,
  currency      char(3) not null default 'EUR',
  actor_id      uuid references public.profiles (id),   -- null = system
  note          text,
  occurred_at   timestamptz not null default now()
);
create index commission_ledger_affiliate_idx on public.commission_ledger (affiliate_id, occurred_at desc);
create index commission_ledger_commission_idx on public.commission_ledger (commission_id);

create or replace function public.forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;
create trigger commission_ledger_immutable before update or delete on public.commission_ledger
  for each row execute function public.forbid_mutation();

-- -----------------------------------------------------------------------------
-- Engagement: goals, notifications, activity feed
-- -----------------------------------------------------------------------------
create table public.goals (
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  month        date not null check (extract(day from month) = 1),
  target_sales int not null check (target_sales between 1 and 1000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (affiliate_id, month)
);
create trigger goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  type        public.notification_type not null,
  -- i18n: clients render title/body from keys + params, never stored prose.
  title_key   text not null,
  params      jsonb not null default '{}'::jsonb,
  href        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);

create table public.notification_deliveries (
  id              bigint generated always as identity primary key,
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel         public.notification_channel not null,
  status          text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_ref    text,
  attempted_at    timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create table public.notification_preferences (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null,
  channel    public.notification_channel not null,
  enabled    boolean not null default true,
  primary key (profile_id, type, channel)
);

-- Live activity feed. Payload must never contain unnecessary personal data.
create table public.activity_events (
  id           bigint generated always as identity primary key,
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  type         text not null check (type in (
    'click', 'visitor', 'lead', 'appointment', 'sale_pending', 'payment_confirmed',
    'commission_validated', 'commission_paid', 'renewal', 'customer_lost'
  )),
  payload      jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);
create index activity_events_affiliate_idx on public.activity_events (affiliate_id, occurred_at desc);

-- -----------------------------------------------------------------------------
-- Content: sales kit, private sales pages, translations
-- -----------------------------------------------------------------------------
create table public.sales_assets (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products (id),
  market_id   uuid references public.markets (id),
  type        public.asset_type not null,
  locale      text not null default 'en',
  title       text not null,
  body        text,                   -- copyable text assets
  file_path   text,                   -- storage path for downloadable assets
  sort        int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint sales_assets_has_content check (body is not null or file_path is not null)
);
create index sales_assets_type_locale_idx on public.sales_assets (type, locale) where is_active;
create trigger sales_assets_updated_at before update on public.sales_assets
  for each row execute function public.set_updated_at();

create table public.private_sales_pages (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliates (id) on delete cascade,
  slug            text not null unique default public.gen_code(6),   -- /p/8FD7K2
  market_id       uuid references public.markets (id),
  campaign_id     uuid references public.campaigns (id) on delete set null,
  link_id         uuid references public.affiliate_links (id) on delete set null,
  locale          text not null default 'en',
  pitch_variant   text not null default 'default',
  cta_variant     text not null default 'request',
  display_name    text,           -- commercial identity (validated by staff guidelines)
  visibility      public.page_visibility not null default 'private',
  is_active       boolean not null default true,
  view_count      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index private_sales_pages_affiliate_idx on public.private_sales_pages (affiliate_id);
create trigger private_sales_pages_updated_at before update on public.private_sales_pages
  for each row execute function public.set_updated_at();

alter table public.clicks add constraint clicks_private_page_fk
  foreign key (private_page_id) references public.private_sales_pages (id) on delete set null;
alter table public.leads add constraint leads_private_page_fk
  foreign key (private_page_id) references public.private_sales_pages (id) on delete set null;

-- Admin-editable overrides of UI strings. Code dictionaries are the fallback.
create table public.translations (
  id         bigint generated always as identity primary key,
  namespace  text not null,
  key        text not null,
  locale     text not null,
  value      text not null,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (namespace, key, locale)
);
create trigger translations_updated_at before update on public.translations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Governance: audit trail, fraud review, privacy requests
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id),
  action      text not null,          -- e.g. 'commission.reverse', 'attribution.correct'
  entity      text not null,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  reason      text,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create trigger audit_logs_immutable before update or delete on public.audit_logs
  for each row execute function public.forbid_mutation();

create table public.fraud_flags (
  id            uuid primary key default gen_random_uuid(),
  type          public.fraud_flag_type not null,
  severity      smallint not null default 1 check (severity between 1 and 3),
  affiliate_id  uuid references public.affiliates (id) on delete set null,
  entity        text,
  entity_id     text,
  signals       jsonb not null default '{}'::jsonb,
  status        public.fraud_status not null default 'open',
  reviewed_by   uuid references public.profiles (id),
  reviewed_at   timestamptz,
  decision_note text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index fraud_flags_status_idx on public.fraud_flags (status, created_at desc);
create trigger fraud_flags_updated_at before update on public.fraud_flags
  for each row execute function public.set_updated_at();

create table public.privacy_requests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references public.profiles (id) on delete set null,
  kind        text not null check (kind in ('export', 'erasure')),
  status      text not null default 'received' check (status in ('received', 'processing', 'completed', 'rejected')),
  completed_at timestamptz,
  created_at  timestamptz not null default now()
);
