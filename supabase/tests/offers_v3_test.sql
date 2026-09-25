-- Studio One / Pro / Premium: the existing commission rules (25% direct, 5%
-- direct sponsor) applied to each offer's price; the one-time offer never renews.
begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

select pg_temp.assert((select count(*) from public.offers o join public.products p on p.id = o.product_id
  where p.slug = 'studio' and o.is_active) = 3, 'STUDIO has exactly three active offers');
select pg_temp.assert((select price_cents = 50000 and billing_interval = 'one_time' and price_type = 'one_time' and not commission_recurring
  from public.offers where stripe_lookup_key = 'studio_one_eur'), 'Studio One: €500 one-time');
select pg_temp.assert((select price_cents = 300000 and billing_interval = 'year' from public.offers
  where stripe_lookup_key = 'studio_pro_yearly_eur'), 'Studio Pro: €3,000 / year');
select pg_temp.assert((select price_cents = 600000 and billing_interval = 'year' from public.offers
  where stripe_lookup_key = 'studio_yearly_eur'), 'Studio Premium: €6,000 / year (unchanged)');
select pg_temp.assert((select count(distinct commission_rate) = 1 and min(commission_rate) = 0.25 from public.offers
  where stripe_lookup_key in ('studio_one_eur', 'studio_pro_yearly_eur', 'studio_yearly_eur')), 'no new commission rate');
select pg_temp.assert((select count(*) from public.commission_rules where is_active) = 1, 'still one active commission rule');

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e001', 'offers-sponsor@test.invalid', '{"full_name":"Sponsor"}');
update public.affiliates set status = 'approved', code = 'OFFSPONSOR'
 where profile_id = '00000000-0000-0000-0000-00000000e001';
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e002', 'offers-seller@test.invalid', '{"full_name":"Seller","sponsor_code":"OFFSPONSOR"}');
update public.affiliates set status = 'approved' where profile_id = '00000000-0000-0000-0000-00000000e002';

insert into public.customers (email) values ('offers-one@test.invalid'), ('offers-pro@test.invalid');
insert into public.sales (customer_id, offer_id, affiliate_id, kind, status, gross_amount_cents,
                          net_amount_cents, currency, paid_at, provider_payment_id)
select c.id, o.id, a.id, 'new', 'paid', o.price_cents, o.price_cents, 'EUR', now(), v.pi
  from (values ('offers-one@test.invalid', 'studio_one_eur', 'pi_offer_one'),
               ('offers-pro@test.invalid', 'studio_pro_yearly_eur', 'pi_offer_pro')) v(email, lookup, pi)
  join public.customers c on c.email = v.email
  join public.offers o on o.stripe_lookup_key = v.lookup
  join public.affiliates a on a.profile_id = '00000000-0000-0000-0000-00000000e002';

create or replace function pg_temp.amount(pi text, role text) returns bigint language sql as $$
  select c.amount_cents from public.commissions c join public.sales s on s.id = c.sale_id
   where s.provider_payment_id = pi and c.commission_role = role $$;

select pg_temp.assert(pg_temp.amount('pi_offer_one', 'direct') = 12500, 'Studio One: seller earns €125 (25%)');
select pg_temp.assert(pg_temp.amount('pi_offer_one', 'sponsor') = 2500, 'Studio One: sponsor earns €25 (5%)');
select pg_temp.assert(pg_temp.amount('pi_offer_pro', 'direct') = 75000, 'Studio Pro: seller earns €750 (25%)');
select pg_temp.assert(pg_temp.amount('pi_offer_pro', 'sponsor') = 15000, 'Studio Pro: sponsor earns €150 (5%)');

select pg_temp.assert(not exists (select 1 from public.subscriptions s join public.offers o on o.id = s.offer_id
  where o.stripe_lookup_key = 'studio_one_eur'), 'Studio One creates no subscription, hence no renewal commission');
select pg_temp.assert(exists (select 1 from public.subscriptions s join public.offers o on o.id = s.offer_id
  where o.stripe_lookup_key = 'studio_pro_yearly_eur' and s.status = 'active'), 'Studio Pro renews yearly');

rollback;
