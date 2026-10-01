-- =============================================================================
-- V0.5 guided pipeline: new CRM stages, prospect history (RLS), guidance kinds.
-- Runs inside a transaction and rolls back (local / staging only).
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
create or replace function pg_temp.fails(stmt text) returns boolean language plpgsql as $$
begin execute stmt; return false; exception when others then return true; end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', 'alice5@test.invalid', '{"full_name":"Alice Guide"}'),
  ('00000000-0000-0000-0000-0000000005b1', 'bob5@test.invalid',   '{"full_name":"Bob Guide"}');
update public.affiliates set status = 'approved'
 where profile_id in ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-0000000005b1');
insert into public.prospects (id, affiliate_id, name, stage)
select '00000000-0000-0000-0000-0000000c5a1f'::uuid, id, 'Hôtel des Pins', 'new' from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000005a1';

select pg_temp.act_as('00000000-0000-0000-0000-0000000005a1');
set local role authenticated;

update public.prospects set stage = 'proof_sent' where id = '00000000-0000-0000-0000-0000000c5a1f';
select pg_temp.assert((select stage::text from public.prospects where id = '00000000-0000-0000-0000-0000000c5a1f') = 'proof_sent', 'proof_sent is a usable stage');
update public.prospects set stage = 'handed_off' where id = '00000000-0000-0000-0000-0000000c5a1f';
select pg_temp.assert((select stage::text from public.prospects where id = '00000000-0000-0000-0000-0000000c5a1f') = 'handed_off', 'handed_off is a usable stage');

insert into public.prospect_events (affiliate_id, prospect_id, type, stage, payload)
values (public.current_affiliate_id(), '00000000-0000-0000-0000-0000000c5a1f', 'handed_off', 'handed_off', '{"reason":"meeting"}');
select pg_temp.assert((select count(*) from public.prospect_events where prospect_id = '00000000-0000-0000-0000-0000000c5a1f') = 1, 'the owner logs history on its prospect');
select pg_temp.assert(pg_temp.fails($$insert into public.prospect_events (affiliate_id, prospect_id, type) values (public.current_affiliate_id(), '00000000-0000-0000-0000-0000000c5a1f', 'invented')$$),
  'unknown event types are rejected');
select pg_temp.assert(pg_temp.fails($$update public.prospect_events set type = 'won'$$) or (select count(*) from public.prospect_events where type = 'won') = 0,
  'history cannot be rewritten');

select pg_temp.act_as('00000000-0000-0000-0000-0000000005b1');
select pg_temp.assert((select count(*) from public.prospect_events) = 0, 'another affiliate cannot read the history');
select pg_temp.assert(pg_temp.fails($$insert into public.prospect_events (affiliate_id, prospect_id, type) values (public.current_affiliate_id(), '00000000-0000-0000-0000-0000000c5a1f', 'won')$$),
  'another affiliate cannot log events on a prospect it does not own');
reset role;

select pg_temp.assert(not pg_temp.fails($$insert into public.sales_content (kind, key, locale, title, body) values ('reply', 'test-reply', 'en', 'T', '{"level":3}')$$),
  'reply is an allowed content kind');
select pg_temp.assert((select count(*) from public.sales_content where kind = 'stage_guide' and target_key is null and status = 'active') = 24,
  'a published guide for each of the 12 stages, EN + FR');
select pg_temp.assert(exists (select 1 from public.sales_content where kind = 'fact' and key = 'fact.promises' and body ? 'cannot'),
  'the "never promise" list is seeded');

rollback;
