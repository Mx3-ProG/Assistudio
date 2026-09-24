-- =============================================================================
-- V0.2 — Stripe → Supabase financial pipeline. Rolls back.
--   npm run db:test:local     (throwaway local cluster, see tests/harness)
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/stripe_pipeline_test.sql  (staging only)
--
-- Payloads are the normalised shapes produced by src/lib/stripe/normalize.ts
-- after signature verification; the SQL functions are exactly what the
-- webhook route calls. Scenario numbers follow the V0.2 brief (§36).
-- =============================================================================
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

create or replace function pg_temp.cust(id text, email text) returns jsonb language sql as $$
  select jsonb_build_object('stripe_customer_id', id, 'email', email, 'name', 'Test ' || id, 'country', 'FR', 'livemode', false)
$$;

-- invoice payload (subscription invoice)
create or replace function pg_temp.inv(
  p_inv text, p_cus text, p_email text, p_sub text, p_reason text, p_amount bigint, p_pi text,
  p_start timestamptz, p_checkout uuid default null, p_net bigint default null
) returns jsonb language sql as $$
  select jsonb_build_object(
    'stripe_invoice_id', p_inv, 'customer', pg_temp.cust(p_cus, p_email), 'stripe_subscription_id', p_sub,
    'billing_reason', p_reason, 'currency', 'eur', 'amount_paid', p_amount, 'amount_due', p_amount,
    'total_excluding_tax', coalesce(p_net, p_amount), 'tax', 0,
    'period_start', p_start, 'period_end', p_start + interval '1 year', 'paid_at', p_start,
    'stripe_price_id', 'price_test_studio', 'lookup_key', 'studio_yearly_eur',
    'stripe_payment_intent_id', p_pi, 'stripe_charge_id', 'ch_' || p_pi, 'studio_checkout_id', p_checkout,
    'attempt_count', 1, 'livemode', false)
$$;

create or replace function pg_temp.sub(
  p_sub text, p_cus text, p_status text, p_start timestamptz, p_checkout uuid default null,
  p_cancel_at_period_end boolean default false
) returns jsonb language sql as $$
  select jsonb_build_object(
    'stripe_subscription_id', p_sub, 'stripe_customer_id', p_cus, 'status', p_status,
    'start_date', p_start, 'current_period_start', p_start, 'current_period_end', p_start + interval '1 year',
    'cancel_at_period_end', p_cancel_at_period_end, 'stripe_price_id', 'price_test_studio',
    'lookup_key', 'studio_yearly_eur', 'studio_checkout_id', p_checkout, 'livemode', false)
$$;

create or replace function pg_temp.aff(p_email text) returns uuid language sql as $$
  select a.id from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email = p_email
$$;

-- Full checkout as the app runs it: server-side checkout row → session completed
-- → subscription created → first invoice paid. Returns the sale id.
create or replace function pg_temp.buy(
  p_n int, p_affiliate uuid, p_at timestamptz default now(), p_source text default 'last_click'
) returns uuid language plpgsql as $$
declare
  v_checkout uuid := gen_random_uuid();
  v_res jsonb;
begin
  insert into public.checkout_sessions (id, stripe_checkout_session_id, status, origin, offer_id, product_id,
                                        affiliate_id, attribution_source)
  select v_checkout, 'cs_' || p_n, 'open', 'public', o.id, o.product_id, p_affiliate,
         case when p_affiliate is null then 'none' else p_source end
    from public.offers o where o.stripe_lookup_key = 'studio_yearly_eur';
  perform public.stripe_checkout_completed(jsonb_build_object(
    'stripe_checkout_session_id', 'cs_' || p_n, 'studio_checkout_id', v_checkout,
    'stripe_subscription_id', 'sub_' || p_n, 'customer', pg_temp.cust('cus_' || p_n, 'client' || p_n || '@client.invalid')));
  perform public.stripe_subscription_sync(pg_temp.sub('sub_' || p_n, 'cus_' || p_n, 'active', p_at, v_checkout));
  v_res := public.stripe_invoice_paid(pg_temp.inv('in_' || p_n, 'cus_' || p_n, 'client' || p_n || '@client.invalid',
                                                  'sub_' || p_n, 'subscription_create', 300000, 'pi_' || p_n, p_at, v_checkout));
  return (v_res->>'sale_id')::uuid;
end $$;

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.invalid', '{"full_name":"Alice Affiliate"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.invalid',   '{"full_name":"Bob Affiliate"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@test.invalid', '{"full_name":"Ada Admin"}');
update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000ad';
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.welcome') = 3,
  'welcome email queued for every new account');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_set_affiliate_status(a.id, 'approved', 'KYC ok') from public.affiliates a;
select pg_temp.act_as(null);

-- ============================================================ Scenario 1
-- Affiliate → visitor → checkout → successful payment → commission pending
insert into public.visitors (id) values ('11111111-1111-1111-1111-111111111111');
select public.record_referral_touch(jsonb_build_object(
  'session_key', '11111111-1111-1111-1111-111111111111', 'affiliate_id', pg_temp.aff('alice@test.invalid'),
  'referral_code', 'ALICE1', 'landing_page', '/fr/studio', 'utm', '{"source":"instagram","campaign":"launch"}'::jsonb));
select pg_temp.assert((select utm_source from public.referral_sessions) = 'instagram', 'S1 referral session stores first-touch UTMs');
select pg_temp.assert((public.resolve_attribution('11111111-1111-1111-1111-111111111111')).affiliate_id = pg_temp.aff('alice@test.invalid'),
  'S1 attribution resolved server-side (last click, 90-day window)');

select pg_temp.assert(public.stripe_event_claim('evt_s1_invoice', 'invoice.paid', false, '2026-08-26.dahlia', now(), '{}') = 'process',
  'S1 event claimed for processing');
select pg_temp.buy(1, pg_temp.aff('alice@test.invalid'));
select public.stripe_event_finish('evt_s1_invoice', 'processed');

select pg_temp.assert((select count(*) from public.sales where invoice_id is not null) = 1, 'S1 one sale for the paid invoice');
select pg_temp.assert((select s.kind from public.sales s join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_1') = 'new',
  'S1 first invoice = new sale');
select pg_temp.assert((select status from public.commissions) = 'pending', 'S1 commission pending (validation period)');
select pg_temp.assert((select amount_cents from public.commissions) = 150000, 'S1 50% of €3,000 = €1,500 (from commission rule)');
select pg_temp.assert((select rule_id is not null from public.commissions), 'S1 commission records the rule that priced it');
select pg_temp.assert((select entry_type::text from public.commission_ledger where commission_id is not null order by id limit 1) = 'commission',
  'S1 ledger entry type = commission');
select pg_temp.assert((select sale_id is not null and invoice_id is not null and gross_amount_cents = 300000
                         from public.commission_ledger where entry_type = 'commission'), 'S1 ledger row is traceable to sale + invoice');
select pg_temp.assert((select pending_cents from public.affiliate_balances where affiliate_id = pg_temp.aff('alice@test.invalid')) = 150000,
  'S1 balance: €1,500 pending');
select pg_temp.assert((select lifetime_earned_cents from public.affiliate_balances where affiliate_id = pg_temp.aff('alice@test.invalid')) = 0,
  'S1 pending is never counted as earned');
select pg_temp.assert((select count(*) from public.activity_events where type in ('payment_confirmed', 'commission_pending')) = 2,
  'S1 live activity: payment confirmed + commission pending');
select pg_temp.assert((select count(*) from public.notifications where title_key = 'notifications.salePending') = 1, 'S1 in-app notification');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.sale_detected') = 1, 'S1 affiliate email queued');
select pg_temp.assert((select params->>'status' from public.email_events where template = 'affiliate.sale_detected') = 'pending',
  'S1 email says pending, not earned');
select pg_temp.assert((select count(*) from public.email_events where template = 'customer.welcome') = 1, 'S1 customer welcome queued');
select pg_temp.assert((select count(*) from public.email_events where template = 'customer.order_confirmation') = 0,
  'S1 no STUDIO receipt: Stripe owns billing emails by default');
select pg_temp.assert((select attribution_source from public.subscriptions where stripe_subscription_id = 'sub_1') = 'last_click',
  'S1 subscription keeps its attribution');

-- ============================================================ Scenario 2
-- Same webhook twice → one payment, one sale, one commission
select pg_temp.assert(public.stripe_event_claim('evt_s1_invoice', 'invoice.paid', false, null, now(), '{}') = 'duplicate',
  'S2 replayed event id is a duplicate');
-- A different event about the same invoice (e.g. invoice.payment_succeeded) must not double count either.
select pg_temp.assert((public.stripe_invoice_paid(pg_temp.inv('in_1', 'cus_1', 'client1@client.invalid', 'sub_1',
  'subscription_create', 300000, 'pi_1', now())))->>'created' = 'false', 'S2 same invoice processed again → not created');
select pg_temp.assert((select count(*) from public.payments where stripe_payment_intent_id = 'pi_1') = 1, 'S2 exactly 1 payment');
select pg_temp.assert((select count(*) from public.sales s join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_1') = 1,
  'S2 exactly 1 sale');
select pg_temp.assert((select count(*) from public.commissions) = 1, 'S2 exactly 1 commission');
select pg_temp.assert((select count(*) from public.commission_ledger where entry_type = 'commission') = 1, 'S2 exactly 1 ledger accrual');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.sale_detected') = 1, 'S2 exactly 1 email');

-- In-flight protection: a second worker cannot process an event being processed.
select public.stripe_event_claim('evt_busy', 'invoice.paid', false, null, now(), '{}');
select pg_temp.assert(public.stripe_event_claim('evt_busy', 'invoice.paid', false, null, now(), '{}') = 'in_progress',
  'S2 concurrent delivery sees in_progress (Stripe will retry)');
select public.stripe_event_finish('evt_busy', 'failed', 'boom');
select pg_temp.assert(public.stripe_event_claim('evt_busy', 'invoice.paid', false, null, now(), '{}') = 'process',
  'S2 a failed event can be retried');
select public.stripe_event_finish('evt_busy', 'processed');

-- ============================================================ Scenario 3
-- Refunded before validation → commission reversed
select pg_temp.buy(3, pg_temp.aff('alice@test.invalid'));
select pg_temp.assert(public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_3', 'stripe_payment_intent_id', 'pi_3',
  'amount', 300000, 'currency', 'eur', 'status', 'pending')) = 'recorded', 'S3 pending refund recorded, no effect yet');
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_3') = 'pending', 'S3 commission untouched while refund pending');
select pg_temp.assert(public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_3', 'stripe_payment_intent_id', 'pi_3',
  'amount', 300000, 'currency', 'eur', 'status', 'succeeded')) = 'applied', 'S3 refund succeeded → applied');
select pg_temp.assert(public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_3', 'stripe_payment_intent_id', 'pi_3',
  'amount', 300000, 'currency', 'eur', 'status', 'succeeded')) = 'recorded', 'S3 refund replay applies nothing twice');
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_3') = 'reversed', 'S3 commission reversed');
select pg_temp.assert((select count(*) from public.commission_ledger l join public.sales s on s.id = l.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_3' and l.entry_type = 'reversal' and l.from_bucket = 'pending') = 1, 'S3 one reversal entry from pending');
select pg_temp.assert((select status from public.payments where stripe_payment_intent_id = 'pi_3') = 'refunded', 'S3 payment refunded');
select pg_temp.assert((select s.status from public.sales s join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_3') = 'refunded',
  'S3 sale refunded (history kept, not deleted)');

-- ============================================================ Scenario 4
-- Commission available, then refunded → compensating entry
select pg_temp.buy(4, pg_temp.aff('alice@test.invalid'));
update public.commissions c set hold_until = now() - interval '1 minute'
  from public.sales s join public.invoices i on i.id = s.invoice_id where s.id = c.sale_id and i.stripe_invoice_id in ('in_1', 'in_4');
select pg_temp.assert(public.release_due_commissions() = 2, 'S4 validation period over → released');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.commission_available') = 2,
  'S4 "commission available" emails queued');
select public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_4', 'stripe_payment_intent_id', 'pi_4',
  'amount', 300000, 'currency', 'eur', 'status', 'succeeded'));
select pg_temp.assert((select count(*) from public.commission_ledger l join public.sales s on s.id = l.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_4' and l.entry_type = 'reversal' and l.from_bucket = 'available') = 1,
  'S4 compensating reversal from available');
select pg_temp.assert((select available_cents from public.affiliate_balances where affiliate_id = pg_temp.aff('alice@test.invalid')) = 150000,
  'S4 available balance only keeps the unrefunded commission');

-- 4b. Paid out, then refunded → clawback, recovery required, netted by the next payout
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_create_payout(pg_temp.aff('alice@test.invalid'));
select public.staff_mark_payout_paid((select id from public.payouts), 'TRF-1');
select pg_temp.act_as(null);
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.payout_sent') = 1, 'S4b payout email queued');
select public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_1', 'stripe_payment_intent_id', 'pi_1',
  'amount', 300000, 'currency', 'eur', 'status', 'succeeded'));
select pg_temp.assert((select c.recovery_status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_1') = 'required', 'S4b paid commission reversed → recovery required');
select pg_temp.assert((select amount_cents from public.commission_ledger where entry_type = 'clawback') = -150000, 'S4b clawback entry, history kept');
select pg_temp.assert((select available_cents from public.affiliate_balances where affiliate_id = pg_temp.aff('alice@test.invalid')) = -150000,
  'S4b negative balance carried forward');
select pg_temp.buy(41, pg_temp.aff('alice@test.invalid'));
select pg_temp.buy(42, pg_temp.aff('alice@test.invalid'));
update public.commissions c set hold_until = now() - interval '1 minute'
  from public.sales s join public.invoices i on i.id = s.invoice_id where s.id = c.sale_id and i.stripe_invoice_id in ('in_41', 'in_42');
select public.release_due_commissions();
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_create_payout(pg_temp.aff('alice@test.invalid'));
select pg_temp.assert((select amount_cents from public.payouts where status = 'scheduled') = 150000, 'S4b next payout nets the clawback (3,000 − 1,500)');
select public.staff_mark_payout_paid((select id from public.payouts where status = 'scheduled'), 'TRF-2');
select pg_temp.assert((select c.recovery_status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_1') = 'recovered', 'S4b recovery completed by the payout');
select pg_temp.assert((select available_cents from public.affiliate_balances where affiliate_id = pg_temp.aff('alice@test.invalid')) = 0,
  'S4b clawback settled once, never counted again');
select pg_temp.act_as(null);

-- ============================================================ Scenario 5
-- Successful renewal → new sale + new commission (only when paid)
select pg_temp.buy(5, pg_temp.aff('alice@test.invalid'), now() - interval '1 year');
select pg_temp.assert((select count(*) from public.commissions c join public.sales s on s.id = c.sale_id
  where s.subscription_id = (select id from public.subscriptions where stripe_subscription_id = 'sub_5')) = 1,
  'S5 before renewal: one commission, no future commission generated in advance');
select public.stripe_subscription_sync(pg_temp.sub('sub_5', 'cus_5', 'active', now()));
select pg_temp.assert((public.stripe_invoice_paid(pg_temp.inv('in_5b', 'cus_5', 'client5@client.invalid', 'sub_5',
  'subscription_cycle', 300000, 'pi_5b', now())))->>'created' = 'true', 'S5 renewal invoice recorded');
select pg_temp.assert((select s.kind from public.sales s join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_5b') = 'renewal',
  'S5 renewal sale');
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_5b') = 'pending', 'S5 renewal commission pending');
select pg_temp.assert((select count(*) from public.commission_ledger l join public.sales s on s.id = l.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_5b' and l.entry_type = 'renewal_commission') = 1, 'S5 ledger type renewal_commission');
select pg_temp.assert((select count(*) from public.renewals r join public.subscriptions s on s.id = r.subscription_id
  where s.stripe_subscription_id = 'sub_5' and r.status = 'renewed') = 1, 'S5 renewal marked renewed');
select pg_temp.assert((select count(*) from public.email_events e join public.sales s on s.id::text = e.related_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_5b' and e.template = 'affiliate.renewal') = 1, 'S5 renewal email queued');
select pg_temp.assert((select count(*) from public.email_events where template = 'customer.welcome' and recipient_customer_id =
  (select id from public.customers where stripe_customer_id = 'cus_5')) = 1, 'S5 no second welcome email on renewal');

-- ============================================================ Scenario 6
-- Failed renewal → no commission; Stripe later collects → normal pipeline
select public.stripe_invoice_payment_failed(jsonb_build_object('stripe_invoice_id', 'in_5c', 'customer', pg_temp.cust('cus_5', null),
  'stripe_subscription_id', 'sub_5', 'billing_reason', 'subscription_cycle', 'currency', 'eur', 'amount_due', 300000,
  'period_start', now() + interval '1 year', 'period_end', now() + interval '2 years', 'attempt_count', 1,
  'next_payment_attempt', now() + interval '3 days', 'stripe_price_id', 'price_test_studio'));
select public.stripe_subscription_sync(pg_temp.sub('sub_5', 'cus_5', 'past_due', now()));
select pg_temp.assert((select count(*) from public.sales s join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_5c') = 0,
  'S6 failed renewal: no sale');
select pg_temp.assert((select count(*) from public.commissions c join public.sales s on s.id = c.sale_id
  where s.subscription_id = (select id from public.subscriptions where stripe_subscription_id = 'sub_5')) = 2, 'S6 failed renewal: no commission');
select pg_temp.assert((select status from public.subscriptions where stripe_subscription_id = 'sub_5') = 'past_due', 'S6 subscription past_due');
select pg_temp.assert((select status from public.invoices where stripe_invoice_id = 'in_5c') = 'open', 'S6 invoice open, retry scheduled');
select pg_temp.assert((select count(*) from public.activity_events where type = 'payment_failed') = 1, 'S6 affiliate sees the failed payment');
select public.stripe_invoice_paid(pg_temp.inv('in_5c', 'cus_5', null, 'sub_5', 'subscription_cycle', 300000, 'pi_5c', now() + interval '1 year'));
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_5c') = 'pending', 'S6 later successful retry → commission');
select pg_temp.assert((select status from public.subscriptions where stripe_subscription_id = 'sub_5') = 'active', 'S6 subscription active again');
select pg_temp.assert((select r.status from public.renewals r join public.subscriptions s on s.id = r.subscription_id
  where s.stripe_subscription_id = 'sub_5' order by r.period_start desc limit 1) = 'renewed', 'S6 failed renewal row → renewed');

-- ============================================================ Scenario 7
-- Customer without affiliation → normal sale, no commission
select pg_temp.buy(7, null);
select pg_temp.assert((select s.affiliate_id is null and s.status = 'paid' from public.sales s join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_7'), 'S7 unattributed sale recorded');
select pg_temp.assert((select count(*) from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_7') = 0, 'S7 no commission');
select pg_temp.assert((select count(*) from public.email_events where template = 'customer.welcome'
  and recipient_customer_id = (select id from public.customers where stripe_customer_id = 'cus_7')) = 1, 'S7 customer still welcomed');

-- ============================================================ Scenario 9
-- Expired attribution → configured rule applies (no credit)
insert into public.visitors (id) values ('99999999-9999-9999-9999-999999999999');
insert into public.referral_sessions (session_key, affiliate_id, referral_code, first_touch_at, last_touch_at)
values ('99999999-9999-9999-9999-999999999999', pg_temp.aff('bob@test.invalid'), 'BOB', now() - interval '100 days', now() - interval '100 days');
select pg_temp.assert((public.resolve_attribution('99999999-9999-9999-9999-999999999999')).id is null,
  'S9 touch older than the 90-day window → no attribution');
update public.settings set value = '120' where key = 'attribution.window_days';
select pg_temp.assert((public.resolve_attribution('99999999-9999-9999-9999-999999999999')).affiliate_id = pg_temp.aff('bob@test.invalid'),
  'S9 window is configuration, not code (120 days → attributed)');
update public.settings set value = '90' where key = 'attribution.window_days';
insert into public.referral_sessions (session_key, affiliate_id, referral_code, first_touch_at, last_touch_at)
values ('99999999-9999-9999-9999-999999999999', pg_temp.aff('alice@test.invalid'), 'ALICE', now() - interval '2 days', now() - interval '2 days');
select pg_temp.assert((public.resolve_attribution('99999999-9999-9999-9999-999999999999')).affiliate_id = pg_temp.aff('alice@test.invalid'),
  'S9 last_click → most recent touch wins');
update public.settings set value = '"first_click"' where key = 'attribution.model';
select pg_temp.assert((public.resolve_attribution('99999999-9999-9999-9999-999999999999')).id is null,
  'S9 first_click → Bob''s first touch wins but is expired → nobody is credited');
update public.settings set value = '"manual"' where key = 'attribution.model';
select pg_temp.assert((public.resolve_attribution('11111111-1111-1111-1111-111111111111')).id is null,
  'S9 manual model → no automatic attribution');
update public.settings set value = '"last_click"' where key = 'attribution.model';

-- ============================================================ Scenario 10
-- Subscription cancelled → no projected revenue presented as acquired
-- (the read model is called with the affiliate's own session, as in the app)
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.assert((select next_commission_eligible and projected_12m_cents = 150000
  from public.affiliate_recurring_book(pg_temp.aff('alice@test.invalid')) b
  join public.subscriptions s on s.id = b.subscription_id where s.stripe_subscription_id = 'sub_42'),
  'S10 active contract: next renewal commission is a projection (€1,500)');
select pg_temp.act_as(null);
select public.stripe_subscription_sync(pg_temp.sub('sub_42', 'cus_42', 'active', now(), null, true));
select public.stripe_subscription_sync(pg_temp.sub('sub_42', 'cus_42', 'active', now(), null, true));   -- replay
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.assert((select not next_commission_eligible and projected_12m_cents = 0 and cancelling
  from public.affiliate_recurring_book(pg_temp.aff('alice@test.invalid')) b
  join public.subscriptions s on s.id = b.subscription_id where s.stripe_subscription_id = 'sub_42'),
  'S10 cancellation scheduled → nothing projected');
select pg_temp.act_as(null);
select pg_temp.assert((select count(*) from public.email_events where template = 'customer.cancellation') = 1, 'S10 one cancellation email to the customer');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.customer_cancelled') = 1, 'S10 one email to the affiliate');
select public.stripe_subscription_sync(pg_temp.sub('sub_42', 'cus_42', 'canceled', now(), null, true));
select pg_temp.assert((select status from public.subscriptions where stripe_subscription_id = 'sub_42') = 'cancelled', 'S10 subscription cancelled');
select pg_temp.assert((select count(*) from public.email_events where template = 'customer.cancellation') = 1, 'S10 still one email after deletion');
select pg_temp.assert((select count(*) from public.activity_events where type = 'customer_lost') = 1, 'S10 customer lost in the live feed');
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_42') = 'paid', 'S10 commission of the paid year is kept (cancellation is not a refund)');

-- ============================================================ Disputes
select pg_temp.buy(11, pg_temp.aff('alice@test.invalid'));
select public.stripe_dispute_sync(jsonb_build_object('stripe_dispute_id', 'dp_11', 'stripe_payment_intent_id', 'pi_11',
  'amount', 300000, 'currency', 'eur', 'status', 'needs_response', 'reason', 'fraudulent'));
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_11') = 'disputed', 'dispute opened → commission disputed');
select pg_temp.assert((select count(*) from public.fraud_flags where entity = 'dispute') = 1, 'dispute flagged for admin review');
select public.stripe_dispute_sync(jsonb_build_object('stripe_dispute_id', 'dp_11', 'stripe_payment_intent_id', 'pi_11',
  'amount', 300000, 'currency', 'eur', 'status', 'won'));
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_11') = 'pending', 'dispute won → commission restored to pending');

select pg_temp.buy(12, pg_temp.aff('alice@test.invalid'));
select public.stripe_dispute_sync(jsonb_build_object('stripe_dispute_id', 'dp_12', 'stripe_payment_intent_id', 'pi_12',
  'amount', 300000, 'currency', 'eur', 'status', 'needs_response'));
select public.stripe_dispute_sync(jsonb_build_object('stripe_dispute_id', 'dp_12', 'stripe_payment_intent_id', 'pi_12',
  'amount', 300000, 'currency', 'eur', 'status', 'lost'));
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_12') = 'reversed', 'chargeback lost → commission reversed');
select pg_temp.assert((select s.status from public.sales s join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_12') = 'chargeback',
  'chargeback recorded on the sale');

-- ============================================================ Partial refund (policy = manual_review by default)
select pg_temp.buy(13, pg_temp.aff('alice@test.invalid'));
select public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_13', 'stripe_payment_intent_id', 'pi_13',
  'amount', 100000, 'currency', 'eur', 'status', 'succeeded'));
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_13') = 'disputed', 'partial refund → commission sent to manual review');
update public.settings set value = '"proportional"' where key = 'refund.partial_policy';
select pg_temp.buy(14, pg_temp.aff('alice@test.invalid'));
select public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_14', 'stripe_payment_intent_id', 'pi_14',
  'amount', 100000, 'currency', 'eur', 'status', 'succeeded'));
select pg_temp.assert((select c.amount_cents from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_14') = 100000, 'proportional policy: €1,000 refunded → commission €1,500 → €1,000');
update public.settings set value = '"manual_review"' where key = 'refund.partial_policy';

-- ============================================================ Commission rules
-- Affiliate-specific rate, net-of-tax base, renewals limited to 12 months.
insert into public.commission_rules (name, affiliate_id, commission_type, rate, duration_months, valid_from)
values ('Bob — 40%, first 12 months', pg_temp.aff('bob@test.invalid'), 'percentage', 0.4, 12, now() - interval '5 years');
select pg_temp.act_as(null);
insert into public.checkout_sessions (id, stripe_checkout_session_id, status, offer_id, product_id, affiliate_id, attribution_source)
select 'bbbbbbbb-0000-0000-0000-000000000001', 'cs_b1', 'open', o.id, o.product_id, pg_temp.aff('bob@test.invalid'), 'last_click'
  from public.offers o where o.stripe_lookup_key = 'studio_yearly_eur';
select public.stripe_subscription_sync(pg_temp.sub('sub_b1', 'cus_b1', 'active', now() - interval '1 year', 'bbbbbbbb-0000-0000-0000-000000000001'));
select public.stripe_invoice_paid(pg_temp.inv('in_b1', 'cus_b1', 'b1@client.invalid', 'sub_b1', 'subscription_create', 360000, 'pi_b1',
  now() - interval '1 year', 'bbbbbbbb-0000-0000-0000-000000000001', 300000));
select pg_temp.assert((select c.amount_cents from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_b1') = 120000, 'rule: 40% of the amount excluding tax (€3,000 of €3,600 incl. VAT)');
select public.stripe_invoice_paid(pg_temp.inv('in_b2', 'cus_b1', null, 'sub_b1', 'subscription_cycle', 360000, 'pi_b2', now(), null, 300000));
select pg_temp.assert((select count(*) from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_b2') = 0, 'rule: renewal after the 12-month commission duration → no commission');
select pg_temp.assert((select after->>'reason' from public.audit_logs where action = 'commission.not_eligible' order by id desc limit 1)
  = 'rule_duration_elapsed', 'rule: the ineligibility decision is traced');

-- ============================================================ Event ordering
-- invoice.paid before checkout.session.completed, subscription without metadata.
insert into public.checkout_sessions (id, stripe_checkout_session_id, status, offer_id, product_id, affiliate_id, attribution_source)
select 'cccccccc-0000-0000-0000-000000000001', 'cs_late', 'open', o.id, o.product_id, pg_temp.aff('alice@test.invalid'), 'first_click'
  from public.offers o where o.stripe_lookup_key = 'studio_yearly_eur';
select public.stripe_subscription_sync(pg_temp.sub('sub_late', 'cus_late', 'active', now()));
select public.stripe_invoice_paid(pg_temp.inv('in_late', 'cus_late', 'late@client.invalid', 'sub_late', 'subscription_create', 300000, 'pi_late', now()));
select pg_temp.assert((select count(*) from public.commissions c join public.sales s on s.id = c.sale_id where s.invoice_id =
  (select id from public.invoices where stripe_invoice_id = 'in_late')) = 0, 'ordering: no attribution known yet');
select public.stripe_checkout_completed(jsonb_build_object('stripe_checkout_session_id', 'cs_late',
  'studio_checkout_id', 'cccccccc-0000-0000-0000-000000000001', 'stripe_subscription_id', 'sub_late',
  'customer', pg_temp.cust('cus_late', 'late@client.invalid')));
select pg_temp.assert((select c.amount_cents from public.commissions c join public.sales s on s.id = c.sale_id where s.invoice_id =
  (select id from public.invoices where stripe_invoice_id = 'in_late')) = 150000, 'ordering: late attribution credits the first sale once');
do $$ begin
  perform public.stripe_checkout_completed(jsonb_build_object('stripe_checkout_session_id', 'cs_forged',
    'studio_checkout_id', 'cccccccc-0000-0000-0000-000000000001', 'stripe_subscription_id', 'sub_late',
    'customer', pg_temp.cust('cus_late', null)));
  raise exception 'forged checkout reference should have failed';
exception when others then
  if sqlerrm like '%checkout_session_mismatch%' then raise notice 'ok  metadata pointing to another checkout is rejected'; else raise; end if;
end $$;

do $$ begin
  perform public.stripe_invoice_paid(jsonb_build_object('stripe_invoice_id', 'in_x', 'customer', pg_temp.cust('cus_x', null),
    'currency', 'eur', 'amount_paid', 100, 'stripe_price_id', 'price_unknown'));
  raise exception 'unknown price should have failed';
exception when others then
  if sqlerrm like '%unknown_price%' then raise notice 'ok  unknown Stripe price fails loudly (event marked failed, retried)'; else raise; end if;
end $$;

-- ============================================================ Email outbox
select pg_temp.assert((select count(*) from public.email_claim_batch(500)) > 0, 'outbox: queued emails can be claimed');
select pg_temp.assert((select count(*) from public.email_claim_batch(500)) = 0, 'outbox: a claimed email is never handed out twice');
select pg_temp.assert(not exists (select 1 from public.email_events where params::text ~* '@|iban|card'),
  'outbox: no address or banking data stored in email params');

-- ============================================================ Admin operations (audited)
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_ledger_adjustment(pg_temp.aff('bob@test.invalid'), 5000, 'EUR', 'Launch bonus');
select pg_temp.assert((select count(*) from public.audit_logs where action = 'ledger.adjustment' and reason = 'Launch bonus'
  and actor_id = '00000000-0000-0000-0000-0000000000ad') = 1, 'adjustment audited with actor + reason');
select pg_temp.assert((select available_cents from public.affiliate_balances where affiliate_id = pg_temp.aff('bob@test.invalid')) = 5000,
  'adjustment is part of the available balance');
select public.staff_validate_commission((select c.id from public.commissions c join public.sales s on s.id = c.sale_id
  join public.invoices i on i.id = s.invoice_id where i.stripe_invoice_id = 'in_b1'), 'Signed no-refund addendum');
select pg_temp.assert((select before->>'status' = 'pending' and after->>'status' = 'available' from public.audit_logs
  where action = 'commission.validate'), 'early validation audited with previous and new state');
do $$ begin
  perform public.staff_ledger_adjustment((select id from public.affiliates limit 1), 100, 'EUR', ' ');
  raise exception 'adjustment without reason should have failed';
exception when others then
  if sqlerrm like '%reason required%' then raise notice 'ok  no silent financial change: reason required'; else raise; end if;
end $$;
select pg_temp.assert((public.admin_finance_summary()->>'gross_revenue_cents')::bigint > 0, 'admin finance summary available to staff');
select pg_temp.assert((public.admin_finance_summary()->>'chargebacks_count')::int = 1, 'finance summary counts the lost chargeback');
select pg_temp.act_as(null);

-- ============================================================ Scenario 8 — isolation
insert into public.notifications (profile_id, type, title_key) values ('00000000-0000-0000-0000-00000000000a', 'admin_message', 'notifications.test');
set local role authenticated;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');   -- Bob
select pg_temp.assert((select count(*) from public.commissions where affiliate_id = pg_temp.aff('alice@test.invalid')) = 0,
  'S8 Bob cannot read Alice''s commissions');
select pg_temp.assert(not exists (select 1 from public.commissions c join public.affiliates a on a.id = c.affiliate_id
  join public.profiles p on p.id = a.profile_id where p.email = 'alice@test.invalid'), 'S8 …even by joining');
select pg_temp.assert((select count(*) from public.commission_ledger) = (select count(*) from public.commission_ledger
  where affiliate_id = public.current_affiliate_id()), 'S8 Bob only sees his own ledger rows');
select pg_temp.assert((select count(*) from public.sales where affiliate_id <> public.current_affiliate_id()) = 0, 'S8 no foreign sales');
select pg_temp.assert((select count(*) from public.payouts) = 0, 'S8 no foreign payouts');
select pg_temp.assert((select count(*) from public.subscriptions where affiliate_id <> public.current_affiliate_id()) = 0, 'S8 no foreign subscriptions');
select pg_temp.assert((select count(*) from public.notifications where profile_id <> auth.uid()) = 0, 'S8 no foreign notifications');
select pg_temp.assert((select count(*) from public.affiliate_balances) = 1, 'S8 only his own balance row');
select pg_temp.assert((select count(*) from public.referral_sessions where affiliate_id <> public.current_affiliate_id()) = 0,
  'S8 no foreign attribution sessions');
select pg_temp.assert((select count(*) from public.invoices) + (select count(*) from public.payments) + (select count(*) from public.refunds)
  + (select count(*) from public.stripe_events) + (select count(*) from public.email_events) + (select count(*) from public.checkout_sessions) = 0,
  'S8 Stripe mirror, events and email log are staff-only');
select pg_temp.assert((select count(*) from public.commission_rules where affiliate_id is not null) = 1, 'S8 Bob sees his own rule only');
do $$ begin
  perform * from public.affiliate_recurring_book((select a.id from public.affiliates a limit 0));
  perform * from public.affiliate_recurring_book('00000000-0000-0000-0000-000000000000');
  raise exception 'foreign recurring book should have failed';
exception when others then
  if sqlerrm like '%forbidden%' then raise notice 'ok  S8 recurring book of another affiliate → forbidden'; else raise; end if;
end $$;
do $$ begin
  perform public.admin_finance_summary();
  raise exception 'finance summary should have failed';
exception when others then
  if sqlerrm like '%forbidden%' then raise notice 'ok  S8 admin finance forbidden to affiliates'; else raise; end if;
end $$;
do $$ begin
  perform public.stripe_invoice_paid('{}'::jsonb);
  raise exception 'service function should have failed';
exception when others then
  if sqlerrm like '%permission denied%' then raise notice 'ok  S8 webhook functions not callable by users'; else raise; end if;
end $$;
do $$ begin
  perform public.staff_ledger_adjustment(public.current_affiliate_id(), 999999, 'EUR', 'gift to myself');
  raise exception 'self adjustment should have failed';
exception when others then
  if sqlerrm like '%forbidden%' then raise notice 'ok  S8 affiliate cannot credit himself'; else raise; end if;
end $$;
do $$ begin
  update public.notifications set title_key = 'x';
  raise exception 'notification rewrite should have failed';
exception when others then
  if sqlerrm like '%permission denied%' then raise notice 'ok  S8 notifications: content is read-only'; else raise; end if;
end $$;
do $$ begin
  update public.affiliates set payouts_enabled = true, stripe_connected_account_id = 'acct_hijack';
  raise exception 'connect fields should be protected';
exception when others then
  if sqlerrm like '%managed by STUDIO staff%' then raise notice 'ok  S8 Connect payout fields protected'; else raise; end if;
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');   -- Alice
select pg_temp.assert((select count(*) from public.affiliate_recurring_book(public.current_affiliate_id())) >= 5, 'S8 Alice reads her own recurring book');
select pg_temp.assert((select count(*) from public.notifications where status = 'unread') >= 1, 'notifications: unread status');
update public.notifications set archived_at = now() where title_key = 'notifications.test';
select pg_temp.assert((select status from public.notifications where title_key = 'notifications.test') = 'archived', 'notifications: owner can archive');

reset role;
set local role anon;
select pg_temp.act_as(null);
select pg_temp.assert((select count(*) from public.commissions) + (select count(*) from public.sales) = 0, 'S8 anonymous sees nothing');
reset role;

rollback;
