begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

create or replace function pg_temp.fails(sql text) returns boolean language plpgsql as $$
begin execute sql; return false; exception when others then return true; end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d001', 'promo-sponsor@test.invalid', '{"full_name":"Sponsor"}');
update public.affiliates set status = 'approved', code = 'PROMOSPONSOR'
 where profile_id = '00000000-0000-0000-0000-00000000d001';

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d002', 'promo-seller@test.invalid',
   '{"full_name":"Seller","sponsor_code":"PROMOSPONSOR"}');
update public.affiliates set status = 'approved'
 where profile_id = '00000000-0000-0000-0000-00000000d002';

insert into public.affiliate_promo_codes (affiliate_id, code, discount_rate)
select id, 'CLIENT10', 0.10 from public.affiliates
 where profile_id = '00000000-0000-0000-0000-00000000d002';

select pg_temp.assert(pg_temp.fails($$insert into public.affiliate_promo_codes (affiliate_id, code, discount_rate)
  select id, 'TOOMUCH', 0.21 from public.affiliates where profile_id = '00000000-0000-0000-0000-00000000d002'$$),
  'an affiliate promotion cannot exceed 20%');

insert into public.checkout_sessions (
  offer_id, product_id, affiliate_id, promo_code_id, catalog_amount_cents,
  discount_amount_cents, discount_rate, attribution_source
)
select o.id, o.product_id, a.id, pc.id, 600000, 60000, 0.10, 'affiliate_link'
  from public.offers o, public.affiliates a, public.affiliate_promo_codes pc
 where o.stripe_lookup_key = 'studio_yearly_eur'
   and a.profile_id = '00000000-0000-0000-0000-00000000d002'
   and pc.affiliate_id = a.id and pc.code = 'CLIENT10';

insert into public.customers (email) values ('promo-buyer@test.invalid');
insert into public.sales (
  customer_id, offer_id, affiliate_id, kind, status, gross_amount_cents,
  net_amount_cents, currency, paid_at, provider_payment_id, checkout_session_id
)
select c.id, o.id, a.id, 'new', 'paid', 540000, 540000, 'EUR', now(), 'pi_promo_test', ch.id
  from public.customers c, public.offers o, public.affiliates a, public.checkout_sessions ch
 where c.email = 'promo-buyer@test.invalid'
   and o.stripe_lookup_key = 'studio_yearly_eur'
   and a.profile_id = '00000000-0000-0000-0000-00000000d002'
   and ch.affiliate_id = a.id and ch.promo_code_id is not null;

select pg_temp.assert((select catalog_amount_cents = 600000 and discount_amount_cents = 60000 and discount_rate = 0.10
  from public.sales where provider_payment_id = 'pi_promo_test'),
  'the sale preserves catalog price and first-payment discount');
select pg_temp.assert((select amount_cents from public.commissions where commission_role = 'direct'
  and sale_id = (select id from public.sales where provider_payment_id = 'pi_promo_test')) = 90000,
  '10% customer discount reduces the 25% direct commission to 15%');
select pg_temp.assert((select amount_cents from public.commissions where commission_role = 'sponsor'
  and sale_id = (select id from public.sales where provider_payment_id = 'pi_promo_test')) = 30000,
  'the sponsor keeps 5% of the undiscounted catalog base');
select pg_temp.assert((select count(*) from public.sales where promo_code_id =
  (select id from public.affiliate_promo_codes where code = 'CLIENT10')) = 1,
  'promo usage is auditable from paid sales');

rollback;
