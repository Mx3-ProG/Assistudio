-- =============================================================================
-- Partner payout requests (20261012000002). Rolls back.
--   npm run db:test:local
-- Each scenario maps to the brief's test list (§16): 0 €, 49 €, exactly 50 €,
-- partial, total, double click, concurrent request, commission already used,
-- refund / cancellation during a request, rejected, paid, unauthenticated,
-- other partner's payout, partner calling admin functions.
-- =============================================================================
begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

-- Expects `sql` to fail with an error message containing `fragment`.
create or replace function pg_temp.fails(sql text, fragment text, msg text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'ASSERTION FAILED (no error): %', msg;
exception when others then
  if sqlerrm like 'ASSERTION FAILED%' then raise; end if;
  if position(fragment in sqlerrm) = 0 then raise exception 'ASSERTION FAILED: % (got: %)', msg, sqlerrm; end if;
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
    'stripe_price_id', 'price_test_studio', 'lookup_key', 'assistudio_premium_yearly_eur',
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
    'lookup_key', 'assistudio_premium_yearly_eur', 'studio_checkout_id', p_checkout, 'livemode', false)
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
    from public.offers o where o.stripe_lookup_key = 'assistudio_premium_yearly_eur';
  perform public.stripe_checkout_completed(jsonb_build_object(
    'stripe_checkout_session_id', 'cs_' || p_n, 'studio_checkout_id', v_checkout,
    'stripe_subscription_id', 'sub_' || p_n, 'customer', pg_temp.cust('cus_' || p_n, 'client' || p_n || '@client.invalid')));
  perform public.stripe_subscription_sync(pg_temp.sub('sub_' || p_n, 'cus_' || p_n, 'active', p_at, v_checkout));
  v_res := public.stripe_invoice_paid(pg_temp.inv('in_' || p_n, 'cus_' || p_n, 'client' || p_n || '@client.invalid',
                                                  'sub_' || p_n, 'subscription_create', 600000, 'pi_' || p_n, p_at, v_checkout));
  return (v_res->>'sale_id')::uuid;
end $$;


create or replace function pg_temp.release(p_aff uuid) returns void language sql as $$
  update public.commissions set hold_until = now() - interval '1 minute' where affiliate_id = p_aff and status = 'pending';
  select public.release_due_commissions();
$$;
create or replace function pg_temp.bal(p_aff uuid) returns public.affiliate_balances language sql as $$
  select * from public.affiliate_balances where affiliate_id = p_aff
$$;
create or replace function pg_temp.req(p_amount bigint, p_key text) returns uuid language sql as $$
  select id from public.affiliate_request_payout(p_amount, p_key)
$$;

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a001', 'alice.pay@test.invalid', '{"full_name":"Alice Payout"}'),
  ('00000000-0000-0000-0000-00000000b001', 'bob.pay@test.invalid',   '{"full_name":"Bob Payout"}'),
  ('00000000-0000-0000-0000-00000000c001', 'carol.pay@test.invalid', '{"full_name":"Carol Payout"}'),
  ('00000000-0000-0000-0000-00000000ad01', 'admin.pay@test.invalid', '{"full_name":"Ada Admin"}');
update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-00000000ad01';
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.staff_set_affiliate_status(a.id, 'approved', 'test') from public.affiliates a
 where a.profile_id in ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000c001');
select pg_temp.act_as(null);

-- Alice: two validated sales → 2 × 1 500 € available. Bob: 49 € available. Carol: nothing.
select pg_temp.buy(901, pg_temp.aff('alice.pay@test.invalid'), now() - interval '40 days');
select pg_temp.buy(902, pg_temp.aff('alice.pay@test.invalid'), now() - interval '39 days');
select pg_temp.release(pg_temp.aff('alice.pay@test.invalid'));
select pg_temp.buy(903, pg_temp.aff('bob.pay@test.invalid'), now() - interval '40 days');
select pg_temp.release(pg_temp.aff('bob.pay@test.invalid'));
select public.commission_reverse(c.id, 'partial refund (test)', c.amount_cents - 4900)
  from public.commissions c where c.affiliate_id = pg_temp.aff('bob.pay@test.invalid');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = 300000, 'P0 Alice has 3 000 € available');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('bob.pay@test.invalid'))).available_cents = 4900, 'P0 Bob has 49 € available');

-- ============================================================ unauthenticated / anon
select pg_temp.act_as(null);
select pg_temp.fails($$select pg_temp.req(5000, 'x')$$, 'payout.unauthenticated', 'P1 no session → refused');
set local role anon;
select pg_temp.fails($$select * from public.affiliate_request_payout(5000, 'x')$$, 'permission denied', 'P1 anon cannot even call the function');
reset role;

-- ============================================================ 0 € / 49 € / minimum / bounds
select pg_temp.act_as('00000000-0000-0000-0000-00000000c001');
select pg_temp.fails($$select pg_temp.req(5000, 'c1')$$, 'payout.insufficient_balance', 'P2 0 € available → refused');
select pg_temp.act_as('00000000-0000-0000-0000-00000000b001');
select pg_temp.fails($$select pg_temp.req(4900, 'b1')$$, 'payout.below_minimum', 'P3 49 € → below the 50 € minimum');
select pg_temp.fails($$select pg_temp.req(5000, 'b2')$$, 'payout.insufficient_balance', 'P3 cannot ask 50 € with 49 €');
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.fails($$select pg_temp.req(4999, 'a0')$$, 'payout.below_minimum', 'P4 49,99 € refused');
select pg_temp.fails($$select pg_temp.req(0, 'a0')$$, 'payout.invalid_amount', 'P4 0 refused');
select pg_temp.fails($$select pg_temp.req(-5000, 'a0')$$, 'payout.invalid_amount', 'P4 negative refused');
select pg_temp.fails($$select pg_temp.req(300001, 'a0')$$, 'payout.insufficient_balance', 'P4 more than the balance refused');
select pg_temp.assert((select count(*) from public.payouts where affiliate_id = pg_temp.aff('alice.pay@test.invalid')) = 0, 'P4 refused requests leave no trace');

-- ============================================================ partial request + idempotency + concurrency
select pg_temp.assert((select created from public.affiliate_request_payout(100000, 'k-1')), 'P5 partial request of 1 000 € created');
select pg_temp.assert(not (select created from public.affiliate_request_payout(100000, 'k-1')), 'P5 same key (double click) → same request, nothing new');
select pg_temp.assert((select count(*) from public.payouts where affiliate_id = pg_temp.aff('alice.pay@test.invalid')) = 1, 'P5 exactly one payout');
select pg_temp.fails($$select pg_temp.req(100000, 'k-2')$$, 'payout.already_open', 'P5 second concurrent request refused');
select pg_temp.assert((select status from public.payouts where idempotency_key = 'k-1') = 'requested', 'P5 status requested');
select pg_temp.assert((select balance_before_cents from public.payouts where idempotency_key = 'k-1') = 300000, 'P5 balance before kept');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = 200000, 'P5 requested money no longer available');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).requested_cents = 100000, 'P5 shown as requested');
select pg_temp.assert((select count(*) from public.payout_allocations a join public.payouts p on p.id = a.payout_id where p.idempotency_key = 'k-1') = 1
  and (select sum(a.amount_cents) from public.payout_allocations a join public.payouts p on p.id = a.payout_id where p.idempotency_key = 'k-1') = 100000,
  'P5 allocations cover exactly 1 000 € of the oldest commission');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.payout_requested') = 1, 'P5 confirmation email to the partner');
select pg_temp.assert((select count(*) from public.email_events where template = 'staff.payout_request') = 1, 'P5 email to every admin');
select pg_temp.assert((select params->>'admin_path' from public.email_events where template = 'staff.payout_request') like '/admin/payouts/%', 'P5 admin email links to the request');
select pg_temp.assert((select count(*) from public.notifications where title_key = 'notifications.payoutRequestStaff') = 1, 'P5 admin bell');
select pg_temp.assert((select count(*) from public.payout_events e join public.payouts p on p.id = e.payout_id where p.idempotency_key = 'k-1') = 1, 'P5 history: requested');
select pg_temp.assert((select count(*) from public.audit_logs where action = 'payout.requested') = 1, 'P5 audit trail');

-- A second open payout cannot exist even if the function were bypassed.
reset role;
select pg_temp.fails($$insert into public.payouts (affiliate_id, amount_cents, status) select affiliate_id, 5000, 'requested' from public.payouts where idempotency_key = 'k-1'$$,
  'payouts_one_open_idx', 'P6 database refuses a second open payout');

-- ============================================================ ownership / no admin powers for partners
select pg_temp.act_as('00000000-0000-0000-0000-00000000b001');
set local role authenticated;
select pg_temp.assert((select count(*) from public.payouts) = 0, 'P7 Bob cannot see Alice''s payout');
select pg_temp.assert((select count(*) from public.payout_allocations) = 0, 'P7 nor its allocations');
select pg_temp.assert((select count(*) from public.payout_events) = 0, 'P7 nor its history');
select pg_temp.fails($$select public.staff_process_payout((select id from public.payouts limit 1), null)$$, 'forbidden', 'P7 partner cannot process');
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
set local role authenticated;
select pg_temp.fails($$select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-1'), 'X')$$, 'forbidden', 'P7 partner cannot mark own payout paid');
select pg_temp.fails($$select public.staff_reject_payout((select id from public.payouts where idempotency_key = 'k-1'), 'X')$$, 'forbidden', 'P7 partner cannot reject');
select pg_temp.fails($$update public.payouts set status = 'paid'$$, 'permission denied', 'P7 partner cannot write payouts');
select pg_temp.fails($$insert into public.payout_allocations (payout_id, commission_id, amount_cents) select id, id, 1 from public.payouts$$, 'permission denied', 'P7 partner cannot write allocations');
select pg_temp.fails($$select public.affiliate_payable_cents(gen_random_uuid())$$, 'permission denied', 'P7 internal balance helper not exposed');
select pg_temp.assert((select count(*) from public.payouts) = 1, 'P7 Alice sees her own payout');
reset role;

-- ============================================================ admin: process → paid
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.staff_process_payout((select id from public.payouts where idempotency_key = 'k-1'), 'virement préparé');
select pg_temp.assert((select status from public.payouts where idempotency_key = 'k-1') = 'processing', 'P8 processing');
select pg_temp.fails($$select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-1'), '  ')$$, 'payout.reference_required', 'P8 payment reference required');
select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-1'), 'VIR-2026-001');
select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-1'), 'VIR-2026-001');
select pg_temp.assert((select status from public.payouts where idempotency_key = 'k-1') = 'paid', 'P8 paid (and paying twice is a no-op)');
select pg_temp.assert((select count(*) from public.commission_ledger l join public.payouts p on p.id = l.payout_id where p.idempotency_key = 'k-1' and l.entry_type = 'payout') = 1,
  'P8 one ledger payout entry');
select pg_temp.assert((select count(*) from public.commissions where affiliate_id = pg_temp.aff('alice.pay@test.invalid') and status = 'available') = 2,
  'P8 partially paid commission stays available for its remaining cents');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).paid_cents = 100000, 'P8 1 000 € paid');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = 200000, 'P8 2 000 € still available');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).requested_cents = 0, 'P8 nothing requested any more');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.payout_sent') = 1, 'P8 "payout sent" email');
select pg_temp.assert((select string_agg(e.to_status::text, '>' order by e.id) from public.payout_events e join public.payouts p on p.id = e.payout_id where p.idempotency_key = 'k-1')
  = 'requested>processing>paid', 'P8 history requested > processing > paid');
select pg_temp.assert((select e.actor_id from public.payout_events e join public.payouts p on p.id = e.payout_id where p.idempotency_key = 'k-1' and e.to_status = 'paid')
  = '00000000-0000-0000-0000-00000000ad01', 'P8 history records who paid');
select pg_temp.fails($$update public.payout_events set note = 'x'$$, 'append-only', 'P8 history cannot be rewritten');

-- ============================================================ total request, refund during the request, rejection
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.req(200000, 'k-3');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = 0, 'P9 total request → 0 € available');
select pg_temp.assert((select count(*) from public.payout_allocations a join public.payouts p on p.id = a.payout_id where p.idempotency_key = 'k-3') = 2,
  'P9 remaining 500 € of sale 901 + 1 500 € of sale 902');
-- Sale 902 refunded while the request is open.
select public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_902', 'stripe_payment_intent_id', 'pi_902',
  'amount', 600000, 'currency', 'eur', 'status', 'succeeded'));
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select pg_temp.fails($$select public.staff_process_payout((select id from public.payouts where idempotency_key = 'k-3'), null)$$, 'payout.ineligible', 'P9 refunded commission blocks processing');
select pg_temp.fails($$select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-3'), 'VIR-2')$$, 'payout.ineligible', 'P9 … and payment');
select pg_temp.fails($$select public.staff_reject_payout((select id from public.payouts where idempotency_key = 'k-3'), ' ')$$, 'payout.reason_required', 'P9 rejection needs a reason');
select public.staff_reject_payout((select id from public.payouts where idempotency_key = 'k-3'), 'Vente remboursée par le client');
select pg_temp.assert((select status from public.payouts where idempotency_key = 'k-3') = 'rejected', 'P9 rejected');
select pg_temp.assert((select rejection_reason from public.payouts where idempotency_key = 'k-3') = 'Vente remboursée par le client', 'P9 reason kept');
select pg_temp.assert((select count(*) from public.payout_allocations a join public.payouts p on p.id = a.payout_id where p.idempotency_key = 'k-3' and a.released_at is null) = 0,
  'P9 allocations released');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = 50000, 'P9 the unrefunded 500 € is available again');
select pg_temp.assert((select count(*) from public.email_events where template = 'affiliate.payout_rejected') = 1, 'P9 partner told why');

-- ============================================================ commission already used / exactly the minimum
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.fails($$select pg_temp.req(50001, 'k-4')$$, 'payout.insufficient_balance', 'P10 cents already paid can never be requested again');
select pg_temp.req(5000, 'k-4');
select pg_temp.assert((select status from public.payouts where idempotency_key = 'k-4') = 'requested', 'P10 exactly 50 € accepted');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-4'), 'VIR-3');
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.req(45000, 'k-5');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.staff_process_payout((select id from public.payouts where idempotency_key = 'k-5'), null);
select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-5'), 'VIR-4');
select pg_temp.assert((select c.status from public.commissions c join public.sales s on s.id = c.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_901') = 'paid', 'P10 commission paid once its last cent is paid (3 payouts)');
select pg_temp.assert((select sum(l.amount_cents) from public.commission_ledger l join public.sales s on s.id = l.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_901' and l.entry_type = 'payout') = 150000, 'P10 never more than the commission paid out');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = 0 and (pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).paid_cents = 150000,
  'P10 balances: 0 € available, 1 500 € paid');

-- ============================================================ refund after a partial payout → clawback of the paid part
select pg_temp.buy(904, pg_temp.aff('alice.pay@test.invalid'), now() - interval '40 days');
select pg_temp.release(pg_temp.aff('alice.pay@test.invalid'));
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
select pg_temp.req(100000, 'k-6');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.staff_mark_payout_paid((select id from public.payouts where idempotency_key = 'k-6'), 'VIR-5');
select public.stripe_refund_sync(jsonb_build_object('stripe_refund_id', 're_904', 'stripe_payment_intent_id', 'pi_904',
  'amount', 600000, 'currency', 'eur', 'status', 'succeeded'));
select pg_temp.assert((select count(*) from public.commission_ledger l join public.sales s on s.id = l.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_904' and l.entry_type = 'clawback' and l.amount_cents = -100000) = 1, 'P11 paid 1 000 € clawed back');
select pg_temp.assert((select count(*) from public.commission_ledger l join public.sales s on s.id = l.sale_id join public.invoices i on i.id = s.invoice_id
  where i.stripe_invoice_id = 'in_904' and l.entry_type = 'reversal' and l.amount_cents = 50000) = 1, 'P11 unpaid 500 € reversed');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('alice.pay@test.invalid'))).available_cents = -100000, 'P11 debt shown, recovered from future payouts');

-- ============================================================ failure + legacy staff payout
select pg_temp.buy(905, pg_temp.aff('bob.pay@test.invalid'), now() - interval '40 days');
select pg_temp.release(pg_temp.aff('bob.pay@test.invalid'));
select pg_temp.act_as('00000000-0000-0000-0000-00000000b001');
select pg_temp.req(154900, 'kb-1');
select pg_temp.act_as('00000000-0000-0000-0000-00000000ad01');
select public.staff_process_payout((select id from public.payouts where idempotency_key = 'kb-1'), null);
select public.staff_fail_payout((select id from public.payouts where idempotency_key = 'kb-1'), 'IBAN refusé par la banque');
select pg_temp.assert((select status from public.payouts where idempotency_key = 'kb-1') = 'failed', 'P12 failed');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('bob.pay@test.invalid'))).available_cents = 154900, 'P12 money available again after a failure');
select public.staff_create_payout(pg_temp.aff('bob.pay@test.invalid'));
select pg_temp.assert((select amount_cents from public.payouts where affiliate_id = pg_temp.aff('bob.pay@test.invalid') and status = 'scheduled') = 154900,
  'P13 staff-initiated payout still works, on the same allocations');
select pg_temp.assert((pg_temp.bal(pg_temp.aff('bob.pay@test.invalid'))).available_cents = 0, 'P13 … and is not available twice');
select public.staff_mark_payout_paid((select id from public.payouts where affiliate_id = pg_temp.aff('bob.pay@test.invalid') and status = 'scheduled'), 'VIR-6');
select pg_temp.assert((select count(*) from public.commissions where affiliate_id = pg_temp.aff('bob.pay@test.invalid') and status = 'paid') = 2, 'P13 paid');

rollback;
