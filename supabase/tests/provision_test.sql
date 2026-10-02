begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

-- A sponsor, created through the trigger (when it exists, it uses provision_account too).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e001', 'sponsor-p@test.invalid', '{"full_name":"Sponsor P"}');
update public.affiliates set status = 'approved', code = 'SPONSP'
 where profile_id = '00000000-0000-0000-0000-00000000e001';
select pg_temp.assert(exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000e001'),
  'the trigger (when present) provisions the profile');
select pg_temp.assert((select count(*) = 1 from public.affiliate_links l join public.affiliates a on a.id = l.affiliate_id
                        where a.profile_id = '00000000-0000-0000-0000-00000000e001' and l.is_default),
  'affiliate creation immediately creates one default tracking link');

-- Accounts created while the trigger is missing (auth.users not owned by the migration role).
alter table auth.users disable trigger on_auth_user_created;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e002', 'New.Partner@Test.invalid',
   '{"full_name":"New Partner","locale":"fr","country":"FR","sponsor_code":"sponsp","application":{"channels":"LinkedIn"}}'),
  ('00000000-0000-0000-0000-00000000e003', 'oauth@test.invalid', '{}'),
  ('00000000-0000-0000-0000-00000000e004', 'late-sponsor@test.invalid', '{}');
alter table auth.users enable trigger on_auth_user_created;
select pg_temp.assert(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000e002'),
  'without the trigger, no profile exists yet');

-- provision_account (called by the app right after auth.admin.createUser)
select public.provision_account('00000000-0000-0000-0000-00000000e002', 'new.partner@test.invalid',
  '{"full_name":"New Partner","locale":"fr","country":"FR","sponsor_code":"sponsp","application":{"channels":"LinkedIn"}}');
select pg_temp.assert((select full_name = 'New Partner' and locale = 'fr' from public.profiles where id = '00000000-0000-0000-0000-00000000e002'),
  'provision_account creates the profile from the sign-up data');
select pg_temp.assert((select a.status = 'approved' and a.country = 'FR' and a.application ->> 'channels' = 'LinkedIn'
                         and a.sponsor_id = s.id
                         from public.affiliates a join public.affiliates s on s.profile_id = '00000000-0000-0000-0000-00000000e001'
                        where a.profile_id = '00000000-0000-0000-0000-00000000e002'),
  'provision_account creates an active affiliate account with its sponsor');
select pg_temp.assert((select count(*) = 1 from public.affiliate_links l join public.affiliates a on a.id = l.affiliate_id
                        where a.profile_id = '00000000-0000-0000-0000-00000000e002' and l.is_default),
  'provision_account creates the default tracking link in the same flow');
select public.provision_account('00000000-0000-0000-0000-00000000e002', 'new.partner@test.invalid', '{"full_name":"Changed"}');
select pg_temp.assert((select count(*) = 1 from public.affiliates where profile_id = '00000000-0000-0000-0000-00000000e002')
  and (select full_name = 'New Partner' from public.profiles where id = '00000000-0000-0000-0000-00000000e002')
  and (select count(*) = 1 from public.affiliate_links l join public.affiliates a on a.id = l.affiliate_id
        where a.profile_id = '00000000-0000-0000-0000-00000000e002' and l.is_default),
  'provision_account is idempotent (no duplicate account, link or overwrite)');

-- A person may first create a sponsorless account after entering through a
-- tracked /s/ link. A repeated sign-up can recover the relationship, but can
-- never overwrite it afterwards.
select public.provision_account('00000000-0000-0000-0000-00000000e004', 'late-sponsor@test.invalid', '{"full_name":"Late Sponsor"}');
select pg_temp.assert(public.attach_missing_sponsor('00000000-0000-0000-0000-00000000e004', 'sponsp'),
  'a sponsorless existing account can recover its sponsor from the sign-up code');
select pg_temp.assert(not public.attach_missing_sponsor('00000000-0000-0000-0000-00000000e004', 'missing'),
  'an existing sponsor is immutable and cannot be replaced');
select pg_temp.assert((select a.sponsor_id = s.id
                         from public.affiliates a
                         join public.affiliates s on s.profile_id = '00000000-0000-0000-0000-00000000e001'
                        where a.profile_id = '00000000-0000-0000-0000-00000000e004'),
  'the recovered sponsor is stored on the affiliate');

-- ensure_profile (before a login code, on sign-in, in getSession)
select pg_temp.assert((select count(*) = 1 and bool_and(role = 'affiliate' and not deleted)
                         from public.ensure_profile('OAUTH@test.invalid')),
  'ensure_profile repairs an account created without profile (email case-insensitive)');
select pg_temp.assert(exists (select 1 from public.affiliates where profile_id = '00000000-0000-0000-0000-00000000e003'),
  'ensure_profile also creates the affiliate application');
select pg_temp.assert((select count(*) = 1 from public.affiliate_links l join public.affiliates a on a.id = l.affiliate_id
                        where a.profile_id = '00000000-0000-0000-0000-00000000e003' and l.is_default),
  'ensure_profile also creates the default tracking link');
select pg_temp.assert((select count(*) from public.ensure_profile('nobody@test.invalid')) = 0,
  'ensure_profile returns nothing for an unknown address');
update public.profiles set deleted_at = now() where id = '00000000-0000-0000-0000-00000000e003';
select pg_temp.assert((select deleted from public.ensure_profile('oauth@test.invalid')),
  'ensure_profile reports a deleted account');

select pg_temp.assert(not has_function_privilege('anon', 'public.ensure_profile(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.provision_account(uuid, text, jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.attach_missing_sponsor(uuid, text)', 'execute'),
  'provisioning is reachable by the service role only');

rollback;
