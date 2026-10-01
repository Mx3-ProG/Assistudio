begin;

create or replace function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok  %', msg;
end $$;

-- ---------------------------------------------------------------- issue
select pg_temp.assert((select status from public.auth_code_issue('Me@Test.invalid', 'login', 'h1', null, 'ip1')) = 'issued',
  'a code is issued');
select pg_temp.assert((select email from public.auth_login_codes order by created_at desc limit 1) = 'me@test.invalid',
  'the address is stored lower-cased');
select pg_temp.assert((select expires_at - created_at from public.auth_login_codes order by created_at desc limit 1) = interval '5 minutes',
  'a code is valid 5 minutes');
select pg_temp.assert((select status from public.auth_code_issue('me@test.invalid', 'login', 'h2', null, 'ip1')) = 'too_soon',
  'a new code cannot be requested within 60 seconds');

-- ---------------------------------------------------------------- consume
select pg_temp.assert((select status from public.auth_code_consume('me@test.invalid', 'wrong')) = 'invalid',
  'a wrong code is refused');
select pg_temp.assert((select attempts from public.auth_login_codes where code_hash = 'h1') = 1,
  'a wrong code counts as an attempt');
select pg_temp.assert((select status from public.auth_code_consume('ME@test.invalid', 'h1')) = 'ok',
  'the right code is accepted (address case-insensitive)');
select pg_temp.assert((select status from public.auth_code_consume('me@test.invalid', 'h1')) = 'invalid',
  'a code works only once');

-- ---------------------------------------------------------------- release after a technical failure
select pg_temp.assert(public.auth_code_release('me@test.invalid', 'h1'),
  'a code consumed just before a technical failure can be released');
select pg_temp.assert((select status from public.auth_code_consume('me@test.invalid', 'h1')) = 'ok',
  'the released code works again (same code, no new email)');
select pg_temp.assert(not public.auth_code_release('me@test.invalid', 'wrong'),
  'only the code that was accepted can be released');
select pg_temp.assert(not has_function_privilege('anon', 'public.auth_code_release(text, text)', 'execute'),
  'release is service role only');

-- ---------------------------------------------------------------- expiry
update public.auth_login_codes set created_at = created_at - interval '2 minutes';
select pg_temp.assert((select status from public.auth_code_issue('me@test.invalid', 'signup', 'h3', '{"full_name":"Me"}', 'ip1')) = 'issued',
  'a new code can be requested after 60 seconds');
update public.auth_login_codes set expires_at = now() - interval '1 second' where code_hash = 'h3';
select pg_temp.assert((select status from public.auth_code_consume('me@test.invalid', 'h3')) = 'expired',
  'an expired code is refused');

-- ---------------------------------------------------------------- supersede + payload
update public.auth_login_codes set created_at = created_at - interval '2 minutes';
select public.auth_code_issue('two@test.invalid', 'signup', 'a1', '{"full_name":"Two"}', 'ip2');
update public.auth_login_codes set created_at = created_at - interval '2 minutes' where email = 'two@test.invalid';
select public.auth_code_issue('two@test.invalid', 'signup', 'a2', '{"full_name":"Two","sponsor_code":"SPONSOR"}', 'ip2');
select pg_temp.assert((select status from public.auth_code_consume('two@test.invalid', 'a1')) = 'invalid',
  'requesting a new code invalidates the previous one');
select pg_temp.assert((select payload ->> 'sponsor_code' from public.auth_code_consume('two@test.invalid', 'a2')) = 'SPONSOR',
  'the sign-up payload (sponsor code) is returned with the accepted code');

-- ---------------------------------------------------------------- attempts
select public.auth_code_issue('brute@test.invalid', 'login', 'b1', null, 'ip3');
select public.auth_code_consume('brute@test.invalid', 'x') from generate_series(1, 4);
select pg_temp.assert((select status from public.auth_code_consume('brute@test.invalid', 'x')) = 'too_many_attempts',
  'the 5th wrong code burns the code');
select pg_temp.assert((select status from public.auth_code_consume('brute@test.invalid', 'b1')) = 'too_many_attempts',
  'after 5 wrong attempts even the right code is refused');

-- ---------------------------------------------------------------- rate limits
update public.auth_login_codes set created_at = created_at - interval '61 seconds';
do $$ begin
  for i in 1..5 loop
    perform public.auth_code_issue('flood@test.invalid', 'login', 'f' || i, null, 'ip4');
    update public.auth_login_codes set created_at = created_at - interval '61 seconds' where email = 'flood@test.invalid';
  end loop;
end $$;
select pg_temp.assert((select status from public.auth_code_issue('flood@test.invalid', 'login', 'f6', null, 'ip4')) = 'rate_limited',
  'at most 5 codes per address per 15 minutes');
do $$ begin
  for i in 1..20 loop
    perform public.auth_code_issue('ip' || i || '@test.invalid', 'login', 'g' || i, null, 'ip-shared');
  end loop;
end $$;
select pg_temp.assert((select status from public.auth_code_issue('ip21@test.invalid', 'login', 'g21', null, 'ip-shared')) = 'rate_limited',
  'at most 20 codes per network per 15 minutes');

-- ---------------------------------------------------------------- privileges + purge
select pg_temp.assert(not has_function_privilege('anon', 'public.auth_code_consume(text, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.auth_code_issue(text, text, text, jsonb, text)', 'execute')
  and not has_table_privilege('anon', 'public.auth_login_codes', 'select'),
  'codes are reachable by the service role only');
update public.auth_login_codes set created_at = now() - interval '2 days' where email = 'me@test.invalid';
select pg_temp.assert(public.auth_code_purge() >= 2, 'old codes are purged');

rollback;
