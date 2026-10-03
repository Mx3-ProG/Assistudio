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
  ('00000000-0000-0000-0000-0000000f0001', 'fun-admin@test.invalid', '{"full_name":"Funnel Admin"}'),
  ('00000000-0000-0000-0000-0000000f0002', 'fun-active@test.invalid', '{"full_name":"Funnel Active"}'),
  ('00000000-0000-0000-0000-0000000f0003', 'fun-idle@test.invalid', '{"full_name":"Funnel Idle"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000f0001';
update public.affiliates set status = 'approved', created_at = now() - interval '10 hours'
 where profile_id in ('00000000-0000-0000-0000-0000000f0002', '00000000-0000-0000-0000-0000000f0003');

-- The active ambassador copies a link 2 h after sign-up, adds a prospect at 4 h and hands it over.
insert into public.funnel_events (event, affiliate_id, occurred_at)
select 'affiliate_link_copied', id, now() - interval '8 hours' from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000f0002';
insert into public.prospects (affiliate_id, name, stage, created_at)
select id, 'Funnel prospect', 'handed_off', now() - interval '6 hours' from public.affiliates where profile_id = '00000000-0000-0000-0000-0000000f0002';
insert into public.prospect_events (affiliate_id, prospect_id, type, stage)
select p.affiliate_id, p.id, 'handed_off', 'handed_off' from public.prospects p where p.name = 'Funnel prospect';
insert into public.funnel_events (event, locale) values ('home_view', 'fr'), ('home_view', 'en'), ('hero_signup_click', 'fr');

-- ---------------------------------------------------------------- access
select pg_temp.act_as('00000000-0000-0000-0000-0000000f0002');
set local role authenticated;
select pg_temp.assert((select count(*) from public.funnel_events) = 0, 'an ambassador cannot read funnel events');
do $$ begin
  begin
    insert into public.funnel_events (event) values ('home_view');
    raise exception 'ASSERTION FAILED: an ambassador could write funnel events';
  exception when insufficient_privilege then raise notice 'ok  an ambassador cannot write funnel events';
  end;
  begin
    perform public.admin_activation_funnel(null);
    raise exception 'ASSERTION FAILED: an ambassador could read the activation funnel';
  exception when others then
    if sqlerrm like 'ASSERTION%' then raise; end if;
    raise notice 'ok  the activation funnel is staff only';
  end;
end $$;
reset role;

do $$ begin
  begin
    insert into public.funnel_events (event) values ('fake_event');
    raise exception 'ASSERTION FAILED: an unknown event was accepted';
  exception when check_violation then raise notice 'ok  unknown events are rejected';
  end;
end $$;

-- ---------------------------------------------------------------- metrics
select pg_temp.act_as('00000000-0000-0000-0000-0000000f0001');
set local role authenticated;
create temp table f as select public.admin_activation_funnel(now() - interval '1 day') as v;
reset role;

select pg_temp.assert((select (v->>'signups')::int >= 2 from f), 'new ambassadors of the period are counted');
select pg_temp.assert((select (v->>'link_copied')::int >= 1 and (v->>'first_prospect')::int >= 1 and (v->>'first_handoff')::int >= 1 from f),
  'link copied, first prospect and first hand-over are counted');
select pg_temp.assert((select (v->>'opportunities')::int >= 1 and (v->>'opportunities_won')::int = 0 from f),
  'a handed-over prospect is an opportunity, not a sale');
select pg_temp.assert((select (v->>'median_hours_first_prospect')::numeric between 3.9 and 4.1 from f),
  'median delay to first prospect is computed from the sign-up date');
select pg_temp.assert((select (v->'events'->>'home_view')::int >= 2 from f), 'public events are aggregated by type');

rollback;
