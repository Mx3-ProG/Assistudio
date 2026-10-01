-- =============================================================================
-- auth_code_release(): give a valid code back after a technical failure.
--
-- auth_code_consume() burns the code before the account / session is created.
-- If that later step fails (a server-side error, not a wrong code), the app
-- calls this so the person can retry with the same code instead of being sent
-- back to "ask for a new code" in a loop. Only a code consumed in the last
-- minute and still within its 5-minute validity is released. Idempotent.
-- Service role only.
-- =============================================================================

create or replace function public.auth_code_release(p_email text, p_hash text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select c.id into v_id from public.auth_login_codes c
   where c.email = lower(trim(p_email)) and c.code_hash = p_hash
     and c.consumed_at is not null and c.consumed_at > now() - interval '1 minute'
     and c.expires_at > now()
   order by c.created_at desc limit 1
   for update;
  if v_id is null then return false; end if;
  update public.auth_login_codes set consumed_at = null where id = v_id;
  return true;
end $$;

revoke execute on function public.auth_code_release(text, text) from anon, authenticated, public;
