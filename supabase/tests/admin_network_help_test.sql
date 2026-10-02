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
  ('00000000-0000-0000-0000-0000000a0001', 'net-admin@test.invalid', '{"full_name":"Net Admin"}'),
  ('00000000-0000-0000-0000-0000000a0002', 'net-sponsor@test.invalid', '{"full_name":"Net Sponsor"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000a0001';
update public.affiliates set status = 'approved', code = 'NETSPO'
 where profile_id = '00000000-0000-0000-0000-0000000a0002';
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000a0003', 'net-seller@test.invalid', '{"full_name":"Net Seller","sponsor_code":"NETSPO"}'),
  ('00000000-0000-0000-0000-0000000a0004', 'net-other@test.invalid', '{"full_name":"Net Other"}');

insert into public.prospects (affiliate_id, name, company, stage, email)
select id, 'Clinic Rossi', 'Rossi SRL', 'interested', 'rossi@test.invalid'
  from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000a0003';
insert into public.prospects (affiliate_id, name, stage)
select id, 'Won prospect', 'won' from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000a0003';

insert into public.customers (email) values ('net-buyer@test.invalid');
insert into public.sales (customer_id, offer_id, affiliate_id, kind, status, gross_amount_cents,
                          net_amount_cents, currency, paid_at, provider_payment_id)
select c.id, o.id, a.id, 'new', 'paid', 600000, 600000, 'EUR', now(), 'pi_network_test'
  from public.customers c, public.offers o, public.affiliates a
 where c.email = 'net-buyer@test.invalid' and o.stripe_lookup_key = 'studio_yearly_eur'
   and a.profile_id = '00000000-0000-0000-0000-0000000a0003';

-- ---------------------------------------------------------------- help request
select pg_temp.act_as('00000000-0000-0000-0000-0000000a0003');
set local role authenticated;

select pg_temp.assert((select count(*) from public.submit_help_request('prospect', 'high', 'Need help closing',
  'The prospect asks for a demo with the technical team, what do I do?',
  (select id from public.prospects where name = 'Clinic Rossi'), null, '/fr/dashboard/prospects')) = 1,
  'an affiliate can submit a help request');

reset role;
select pg_temp.assert((select context->>'paid_sales' = '1' and context->>'sponsor' = 'Net Sponsor'
                              and context->'prospect'->>'name' = 'Clinic Rossi'
                         from public.help_requests where subject = 'Need help closing'),
  'the request stores a factual snapshot incl. sponsor, sales and the related prospect');
select pg_temp.assert((select count(*) from public.email_events
                        where template = 'staff.help_request' and recipient_type = 'staff'
                          and recipient_profile_id = '00000000-0000-0000-0000-0000000a0001') = 1,
  'every staff member gets one email in the outbox');
select pg_temp.assert((select params->>'related' like 'Prospect: Clinic Rossi%' from public.email_events
                        where template = 'staff.help_request' limit 1),
  'the email carries the related prospect');

-- A prospect that belongs to someone else is ignored.
select pg_temp.act_as('00000000-0000-0000-0000-0000000a0004');
set local role authenticated;
select public.submit_help_request('other', 'normal', 'Other question', 'A question that mentions a foreign prospect id.',
  (select id from public.prospects where name = 'Clinic Rossi'), null, null);
select pg_temp.assert((select count(*) from public.help_requests) = 1,
  'an affiliate only reads its own help requests (RLS)');
reset role;
select pg_temp.assert((select prospect_id is null and not (context ? 'prospect') from public.help_requests
                        where subject = 'Other question'),
  'a foreign prospect id is never attached');

select pg_temp.act_as('00000000-0000-0000-0000-0000000a0004');
set local role authenticated;
do $$ begin
  for i in 1..4 loop
    perform public.submit_help_request('other', 'low', 'Burst ' || i, 'Repeated request to hit the hourly limit.', null, null, null);
  end loop;
  begin
    perform public.submit_help_request('other', 'low', 'Burst 6', 'Repeated request to hit the hourly limit.', null, null, null);
    raise exception 'ASSERTION FAILED: rate limit not enforced';
  exception when others then
    if sqlerrm not like '%help.rate_limited%' then raise; end if;
  end;
end $$;
select pg_temp.assert(true, 'help requests are rate-limited to 5 per hour');

-- Affiliates cannot read the network or move requests.
do $$ begin
  begin
    perform public.admin_network_stats();
    raise exception 'ASSERTION FAILED: affiliate read network stats';
  exception when others then if sqlerrm not like '%forbidden%' then raise; end if; end;
end $$;
select pg_temp.assert(true, 'admin_network_stats is staff-only');
reset role;

-- ---------------------------------------------------------------- staff
select pg_temp.act_as('00000000-0000-0000-0000-0000000a0001');
set local role authenticated;
select pg_temp.assert((select recruits = 1 from public.admin_network_stats()
                        where email = 'net-sponsor@test.invalid'), 'sponsor shows one recruit');
select pg_temp.assert((select sponsor_id is not null and prospects = 2 and prospects_won = 1 and paid_sales = 1
                              and revenue_cents = 600000 and pending_cents = 150000 and open_help = 1
                         from public.admin_network_stats() where email = 'net-seller@test.invalid'),
  'seller row: sponsor, prospects, sales, revenue, pending commission, open requests');

select public.staff_update_help_request((select id from public.help_requests where subject = 'Need help closing'),
  'resolved', 'Demo booked with the team.');
reset role;
select pg_temp.assert((select status = 'resolved' and resolved_at is not null and staff_note = 'Demo booked with the team.'
                         from public.help_requests where subject = 'Need help closing'),
  'staff resolves a request with a note');
select pg_temp.assert((select count(*) from public.notifications n
                         join public.affiliates a on a.profile_id = n.profile_id
                        where a.profile_id = '00000000-0000-0000-0000-0000000a0003'
                          and n.title_key = 'notifications.helpUpdated') = 1,
  'the affiliate is notified of the status change');
select pg_temp.assert((select count(*) from public.audit_logs where action = 'help_request.status') = 1,
  'status changes are audited');

select pg_temp.act_as('00000000-0000-0000-0000-0000000a0003');
set local role authenticated;
do $$ begin
  begin
    perform public.staff_update_help_request((select id from public.help_requests limit 1), 'closed', null);
    raise exception 'ASSERTION FAILED: affiliate updated a request';
  exception when others then if sqlerrm not like '%forbidden%' then raise; end if; end;
end $$;
select pg_temp.assert(true, 'only staff can update help requests');

rollback;
