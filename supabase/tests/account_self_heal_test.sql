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

-- Sign-up still provisions profile + affiliate through the trigger.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a001', 'signup@test.invalid', '{"full_name":"Sign Up","locale":"fr"}');
select pg_temp.assert((select locale = 'fr' and full_name = 'Sign Up' from public.profiles
  where id = '00000000-0000-0000-0000-00000000a001'), 'sign-up trigger creates the profile');
select pg_temp.assert(exists (select 1 from public.affiliates
  where profile_id = '00000000-0000-0000-0000-00000000a001'), 'sign-up trigger creates the affiliate application');

-- An auth user created without the trigger (e.g. from the Supabase dashboard).
alter table auth.users disable trigger on_auth_user_created;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a002', 'orphan@test.invalid', '{"full_name":"Orphan"}');
alter table auth.users enable trigger on_auth_user_created;
select pg_temp.assert(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000a002'),
  'orphan auth user has no profile');

select pg_temp.act_as(null);
set local role authenticated;
select pg_temp.assert(public.ensure_my_account() = false, 'anonymous caller cannot provision anything');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-00000000a002');
set local role authenticated;
select pg_temp.assert(public.ensure_my_account() = true, 'orphan user heals their own account');
select pg_temp.assert(public.ensure_my_account() = false, 'healing is idempotent');
reset role;

select pg_temp.assert(exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000a002'
  and full_name = 'Orphan'), 'healed profile carries the auth metadata');
select pg_temp.assert(exists (select 1 from public.affiliates where profile_id = '00000000-0000-0000-0000-00000000a002'),
  'healed account gets an affiliate application');
select pg_temp.assert(exists (select 1 from public.audit_logs where action = 'account.self_heal'
  and entity_id = '00000000-0000-0000-0000-00000000a002'), 'self-heal is audited');

-- A soft-deleted profile is never resurrected.
update public.profiles set deleted_at = now() where id = '00000000-0000-0000-0000-00000000a001';
select pg_temp.act_as('00000000-0000-0000-0000-00000000a001');
set local role authenticated;
select pg_temp.assert(public.ensure_my_account() = false, 'soft-deleted profile is left alone');
reset role;

set local role authenticated;
do $$ begin
  perform public.provision_account(gen_random_uuid(), 'x@test.invalid', '{}'::jsonb);
  raise exception 'ASSERTION FAILED: provision_account must not be callable by users';
exception when insufficient_privilege then raise notice 'ok  provision_account is not callable by users';
end $$;
reset role;

rollback;
