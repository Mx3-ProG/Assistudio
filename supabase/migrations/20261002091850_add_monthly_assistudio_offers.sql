-- Monthly alternatives for the two subscription tiers. Annual offers remain
-- active and Studio One remains a one-time purchase.
insert into public.offers
  (product_id, name, price_cents, currency, price_type, billing_interval, interval_count,
   commission_rate, commission_recurring, stripe_lookup_key, is_active)
select annual.product_id, monthly.name, monthly.price_cents, annual.currency,
       'recurring', 'month'::public.billing_interval, 1,
       annual.commission_rate, true, monthly.lookup_key, true
  from (values
    ('assistudio_pro_yearly_eur', 'Studio Pro — Monthly', 25000::bigint, 'assistudio_pro_monthly_eur'),
    ('assistudio_premium_yearly_eur', 'Studio Premium — Monthly', 50000::bigint, 'assistudio_premium_monthly_eur')
  ) as monthly(annual_lookup_key, name, price_cents, lookup_key)
  join public.offers annual on annual.stripe_lookup_key = monthly.annual_lookup_key
on conflict (stripe_lookup_key) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  price_type = excluded.price_type,
  billing_interval = excluded.billing_interval,
  interval_count = excluded.interval_count,
  commission_rate = excluded.commission_rate,
  commission_recurring = excluded.commission_recurring,
  is_active = true;

-- A recurring Stripe coupon now discounts every invoice. Carry the checkout's
-- trusted promotion snapshot to both the first sale and every renewal.
create or replace function public.apply_sale_promotion() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ch public.checkout_sessions;
begin
  if new.checkout_session_id is not null then
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
revoke all on function public.apply_sale_promotion() from public;

-- The direct seller keeps funding the promotion on every discounted invoice;
-- the sponsor commission continues to use the undiscounted catalog base.
create or replace function public.evaluate_commission(p_sale_id uuid) returns public.commission_evaluation
language plpgsql stable security definer set search_path = public as $$
declare
  s public.sales;
  e public.commission_evaluation;
  v_discount bigint;
begin
  select * into s from public.sales where id = p_sale_id;
  if not found then return null; end if;
  v_discount := coalesce(s.discount_amount_cents, 0);
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
revoke all on function public.evaluate_commission(uuid) from public;

comment on table public.affiliate_promo_codes is
  'Affiliate-owned discounts (0-20%) funded from the direct affiliate commission on every discounted payment.';
