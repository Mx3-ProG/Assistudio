-- Affiliate-funded promo codes. The customer discount applies to the first
-- payment only and is subtracted euro-for-euro from the direct affiliate's
-- normal commission. Catalog prices and sponsor commissions stay unchanged.

create table public.affiliate_promo_codes (
  id             uuid primary key default gen_random_uuid(),
  affiliate_id   uuid not null references public.affiliates (id) on delete cascade,
  code           text not null unique,
  discount_rate  numeric(5,4) not null check (discount_rate between 0 and 0.2000),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint affiliate_promo_code_format check (code::text ~ '^[A-Z0-9][A-Z0-9-]{2,23}$')
);
create index affiliate_promo_codes_affiliate_idx
  on public.affiliate_promo_codes (affiliate_id, created_at desc);
create index affiliate_promo_codes_active_idx
  on public.affiliate_promo_codes (affiliate_id, code) where is_active;
create trigger affiliate_promo_codes_updated_at before update on public.affiliate_promo_codes
  for each row execute function public.set_updated_at();

alter table public.affiliate_promo_codes enable row level security;
revoke all on public.affiliate_promo_codes from anon, authenticated;
grant select, insert, update on public.affiliate_promo_codes to authenticated;

create policy affiliate_promo_codes_own_read on public.affiliate_promo_codes
  for select to authenticated
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy affiliate_promo_codes_own_insert on public.affiliate_promo_codes
  for insert to authenticated
  with check (
    affiliate_id = public.current_affiliate_id()
    and exists (select 1 from public.affiliates a where a.id = affiliate_id and a.status = 'approved' and a.deleted_at is null)
  );
create policy affiliate_promo_codes_own_update on public.affiliate_promo_codes
  for update to authenticated
  using (affiliate_id = public.current_affiliate_id() or public.is_super_admin())
  with check (affiliate_id = public.current_affiliate_id() or public.is_super_admin());

alter table public.checkout_sessions
  add column promo_code_id uuid references public.affiliate_promo_codes (id) on delete set null,
  add column catalog_amount_cents bigint check (catalog_amount_cents >= 0),
  add column discount_amount_cents bigint not null default 0 check (discount_amount_cents >= 0),
  add column discount_rate numeric(5,4) not null default 0 check (discount_rate between 0 and 0.2000),
  add column stripe_coupon_id text;
create index checkout_sessions_promo_idx on public.checkout_sessions (promo_code_id)
  where promo_code_id is not null;

alter table public.sales
  add column promo_code_id uuid references public.affiliate_promo_codes (id) on delete set null,
  add column catalog_amount_cents bigint check (catalog_amount_cents >= 0),
  add column discount_amount_cents bigint not null default 0 check (discount_amount_cents >= 0),
  add column discount_rate numeric(5,4) not null default 0 check (discount_rate between 0 and 0.2000);
create index sales_promo_idx on public.sales (promo_code_id, paid_at desc)
  where promo_code_id is not null;

-- The checkout row is the trusted source. Renewals never inherit the first
-- invoice's promotion even though they retain affiliate attribution.
create or replace function public.apply_sale_promotion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ch public.checkout_sessions;
begin
  if new.kind = 'new' and new.checkout_session_id is not null then
    select * into ch from public.checkout_sessions where id = new.checkout_session_id;
  end if;
  if ch.id is not null and ch.promo_code_id is not null then
    new.promo_code_id := ch.promo_code_id;
    new.catalog_amount_cents := greatest(coalesce(ch.catalog_amount_cents, new.gross_amount_cents), new.gross_amount_cents);
    new.discount_amount_cents := least(coalesce(ch.discount_amount_cents, 0), new.catalog_amount_cents);
    new.discount_rate := ch.discount_rate;
  else
    new.promo_code_id := null;
    new.catalog_amount_cents := new.gross_amount_cents;
    new.discount_amount_cents := 0;
    new.discount_rate := 0;
  end if;
  return new;
end $$;
drop trigger if exists sales_apply_promotion on public.sales;
create trigger sales_apply_promotion before insert on public.sales
  for each row execute function public.apply_sale_promotion();
revoke all on function public.apply_sale_promotion() from public;

-- Evaluate the normal commission against the undiscounted catalog base, then
-- fund the customer's discount from the direct seller's commission. Keeping
-- base_cents undiscounted also keeps the separate sponsor commission intact.
create or replace function public.evaluate_commission(p_sale_id uuid) returns public.commission_evaluation
language plpgsql stable security definer set search_path = public as $$
declare
  s public.sales;
  e public.commission_evaluation;
  v_discount bigint;
begin
  select * into s from public.sales where id = p_sale_id;
  if not found then return null; end if;
  v_discount := case when s.kind = 'new' then coalesce(s.discount_amount_cents, 0) else 0 end;
  e := public.evaluate_commission_for(
    s.affiliate_id, s.offer_id, s.customer_id, s.subscription_id, s.kind, s.currency,
    coalesce(s.catalog_amount_cents, s.gross_amount_cents),
    case when s.net_amount_cents is null then null else s.net_amount_cents + v_discount end,
    coalesce(s.paid_at, now()), s.id
  );
  if e.eligible and v_discount > 0 then
    e.amount_cents := greatest(0, e.amount_cents - v_discount);
    e.rate := case when e.base_cents > 0
      then round(e.amount_cents::numeric / e.base_cents, 4) else 0 end;
    if e.amount_cents = 0 then
      e.eligible := false;
      e.reason := 'promotion_consumed_commission';
    end if;
  end if;
  return e;
end $$;

comment on table public.affiliate_promo_codes is
  'Affiliate-owned discounts (0-20%) funded from the direct affiliate commission on the first payment.';
