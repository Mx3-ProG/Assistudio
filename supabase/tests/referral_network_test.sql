begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.sub', coalesce(uid::text, ''), true);
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f001', 'sponsor@test.invalid', '{"full_name":"Sponsor"}');
update public.affiliates set status = 'approved', code = 'SPONSOR'
 where profile_id = '00000000-0000-0000-0000-00000000f001';

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f002', 'seller@test.invalid',
   '{"full_name":"Seller","sponsor_code":"SPONSOR"}');
update public.affiliates set status = 'approved'
 where profile_id = '00000000-0000-0000-0000-00000000f002';

select pg_temp.assert((select a.sponsor_id = s.id from public.affiliates a
  join public.affiliates s on s.profile_id = '00000000-0000-0000-0000-00000000f001'
  where a.profile_id = '00000000-0000-0000-0000-00000000f002'),
  'registration code fixes the sponsor relationship');

insert into public.customers (email) values ('buyer-referral@test.invalid');
insert into public.sales (customer_id, offer_id, affiliate_id, kind, status, gross_amount_cents,
                          net_amount_cents, currency, paid_at, provider_payment_id)
select c.id, o.id, a.id, 'new', 'paid', 600000, 600000, 'EUR', now(), 'pi_referral_test'
  from public.customers c, public.offers o, public.affiliates a
 where c.email = 'buyer-referral@test.invalid'
   and o.stripe_lookup_key = 'assistudio_premium_yearly_eur'
   and a.profile_id = '00000000-0000-0000-0000-00000000f002';

select pg_temp.assert((select amount_cents from public.commissions where commission_role = 'direct'
  and sale_id = (select id from public.sales where provider_payment_id = 'pi_referral_test')) = 150000,
  'seller receives 25% of the sale');
select pg_temp.assert((select amount_cents from public.commissions where commission_role = 'sponsor'
  and sale_id = (select id from public.sales where provider_payment_id = 'pi_referral_test')) = 30000,
  'direct sponsor receives 5% of the sale');
select pg_temp.assert((select count(*) from public.commissions
  where sale_id = (select id from public.sales where provider_payment_id = 'pi_referral_test')) = 2,
  'one sale creates exactly two commission rows');

update public.sales set status = 'refunded' where provider_payment_id = 'pi_referral_test';
select pg_temp.assert((select count(*) from public.commissions where status = 'reversed'
  and sale_id = (select id from public.sales where provider_payment_id = 'pi_referral_test')) = 2,
  'a refund reverses seller and sponsor commissions');

select pg_temp.act_as('00000000-0000-0000-0000-00000000f001');
set local role authenticated;
select pg_temp.assert(jsonb_array_length(public.affiliate_referral_dashboard()->'recruits') = 1,
  'sponsor dashboard lists only its direct recruit');

rollback;
