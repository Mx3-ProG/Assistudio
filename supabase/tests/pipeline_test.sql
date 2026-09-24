-- =============================================================================
-- End-to-end database test: pipeline + commission engine + RLS isolation.
-- Runs inside a transaction and rolls back. Usage (local / staging only):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pipeline_test.sql
-- Any failed assertion raises an exception.
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

-- ---------------------------------------------------------------- users
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.invalid', '{"full_name":"Alice Affiliate","locale":"fr"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.invalid',   '{"full_name":"Bob Affiliate"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@test.invalid', '{"full_name":"Ada Admin"}');

update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-0000000000ad';

select pg_temp.assert((select count(*) from public.affiliates) = 3, 'signup trigger creates profile + affiliate application');
select pg_temp.assert((select status from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email = 'alice@test.invalid') = 'pending',
  'new affiliates start pending (auto-approve off)');

-- ---------------------------------------------------------------- staff approves
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_set_affiliate_status(a.id, 'approved', 'KYC ok')
  from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email in ('alice@test.invalid', 'bob@test.invalid');
select pg_temp.assert((select count(*) from public.audit_logs where action = 'affiliate.status') = 2, 'approvals are audit-logged');

-- ---------------------------------------------------------------- lead attributed to Alice
select pg_temp.act_as(null);
insert into public.leads (affiliate_id, full_name, company, profession, email, consent_at)
select a.id, 'Claire Client', 'Atelier Claire', 'Photographer', 'claire@client.invalid', now()
  from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email = 'alice@test.invalid';
select pg_temp.assert((select count(*) from public.activity_events where type = 'lead') = 1, 'lead produces live activity');

-- ---------------------------------------------------------------- lead → sale (pending)
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_create_sale_from_lead((select id from public.leads where email = 'claire@client.invalid'), 'Contract signed');

select pg_temp.assert((select status from public.sales) = 'pending', 'sale starts pending');
select pg_temp.assert((select status from public.commissions) = 'pending', 'commission pending until payment');
select pg_temp.assert((select amount_cents from public.commissions) = 150000, '50% of €3,000 = €1,500');
select pg_temp.assert((select lifetime_earned_cents from public.affiliate_balances b join public.commissions c on c.affiliate_id = b.affiliate_id) = 0,
  'nothing is "earned" before payment');

-- ---------------------------------------------------------------- payment collected
select public.staff_set_sale_status((select id from public.sales), 'paid', 'Payment received');
select pg_temp.assert((select status from public.commissions) = 'in_validation', 'paid → commission in validation');
select pg_temp.assert((select hold_until::date from public.commissions) = (now() + interval '30 days')::date, 'validation window from settings (30d)');
select pg_temp.assert((select count(*) from public.subscriptions where status = 'active') = 1, 'first payment opens the annual subscription');
select pg_temp.assert((select count(*) from public.notifications where title_key = 'notifications.paymentConfirmed') = 1, 'affiliate notified of payment');

-- Nothing released before the window ends
select pg_temp.act_as(null);
select pg_temp.assert(public.release_due_commissions() = 0, 'no early release');

-- Simulate the end of the validation window
update public.commissions set hold_until = now() - interval '1 minute';
select pg_temp.assert(public.release_due_commissions() = 1, 'release after validation window');
select pg_temp.assert((select status from public.commissions) = 'available', 'commission available');

-- ---------------------------------------------------------------- payout
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select public.staff_create_payout(c.affiliate_id) from public.commissions c;
select public.staff_mark_payout_paid((select id from public.payouts), 'PROVIDER-REF-1');
select pg_temp.assert((select status from public.commissions) = 'paid', 'payout marks commission paid');
select pg_temp.assert((select paid_cents from public.affiliate_balances b join public.commissions c on c.affiliate_id = b.affiliate_id) = 150000, 'paid balance');

-- ---------------------------------------------------------------- refund after payout → clawback
select public.staff_set_sale_status((select id from public.sales), 'refunded', 'Customer refunded');
select pg_temp.assert((select status from public.commissions) = 'reversed', 'refund reverses commission');
select pg_temp.assert((select amount_cents from public.commission_ledger where entry_type = 'clawback') = -150000, 'clawback entry after payout');
select pg_temp.assert((select available_cents from public.affiliate_balances b join public.commissions c on c.affiliate_id = b.affiliate_id) = -150000,
  'clawback carried forward as negative available balance');
select pg_temp.assert((select status from public.subscriptions) = 'cancelled', 'refund cancels the subscription');

-- ---------------------------------------------------------------- ledger is append-only
select pg_temp.act_as(null);
do $$ begin
  update public.commission_ledger set amount_cents = 0;
  raise exception 'ledger update should have failed';
exception when others then
  if sqlerrm like '%append-only%' then raise notice 'ok  ledger is append-only'; else raise; end if;
end $$;

-- ---------------------------------------------------------------- self-referral signal
insert into public.leads (affiliate_id, full_name, email, consent_at)
select a.id, 'Bob himself', 'bob@test.invalid', now()
  from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email = 'bob@test.invalid';
select pg_temp.assert((select count(*) from public.fraud_flags where type = 'self_referral') = 1, 'self-referral flagged (not blocked)');
select pg_temp.assert((select status from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email = 'bob@test.invalid') = 'approved',
  'no automatic blocking on a probabilistic signal');

-- ---------------------------------------------------------------- RLS isolation
insert into public.prospects (affiliate_id, name)
select a.id, 'Alice private prospect' from public.affiliates a join public.profiles p on p.id = a.profile_id where p.email = 'alice@test.invalid';

set local role authenticated;

-- Bob
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.assert((select count(*) from public.prospects) = 0, 'Bob cannot see Alice''s prospects');
select pg_temp.assert((select count(*) from public.commissions) = 0, 'Bob cannot see Alice''s commissions');
select pg_temp.assert((select count(*) from public.sales) = 0, 'Bob cannot see Alice''s sales');
select pg_temp.assert((select count(*) from public.leads) = 0, 'affiliates cannot read the leads table');
select pg_temp.assert((select count(*) from public.affiliates) = 1, 'Bob only sees his own affiliate row');
do $$ begin
  insert into public.prospects (affiliate_id, name)
  select id, 'hijack' from public.affiliates limit 0;  -- cannot even select Alice's id
  insert into public.prospects (affiliate_id, name)
  values ((select a.id from public.affiliates a limit 1), 'mine');  -- own row: allowed
  raise notice 'ok  Bob can create his own prospect';
end $$;
do $$ begin
  update public.affiliates set status = 'approved', commission_rate_override = 0.9;
  raise exception 'self-escalation should have failed';
exception when others then
  if sqlerrm like '%managed by STUDIO staff%' then raise notice 'ok  affiliate cannot change own rate/status'; else raise; end if;
end $$;
do $$ begin
  update public.profiles set role = 'super_admin';
  raise exception 'role escalation should have failed';
exception when others then
  if sqlerrm like '%super admin%' then raise notice 'ok  affiliate cannot change own role'; else raise; end if;
end $$;
do $$ begin
  perform public.staff_set_affiliate_status((select id from public.affiliates limit 1), 'suspended', 'x');
  raise exception 'staff function should have failed';
exception when others then
  if sqlerrm like '%forbidden%' or sqlerrm like '%permission denied%' then raise notice 'ok  staff functions forbidden to affiliates'; else raise; end if;
end $$;

-- Alice
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.assert((select count(*) from public.prospects) = 1, 'Alice sees her own prospect only');
select pg_temp.assert((select count(*) from public.commissions) = 1, 'Alice sees her commission');
select pg_temp.assert((select company from public.my_leads limit 1) = 'Atelier Claire', 'my_leads exposes company…');
select pg_temp.assert(not exists (select 1 from information_schema.columns where table_name = 'my_leads' and column_name in ('email', 'phone', 'full_name')),
  '…but never lead contact details');

reset role;
rollback;
