-- A sign-in code whose email could not be sent (Resend refused it) must not
-- count as sent: otherwise the next attempt answers "a code was just sent"
-- (60 s) and five failures lock the address out for 15 minutes, even after
-- the email provider is working again.

create or replace function public.auth_code_cancel(p_email text, p_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  delete from public.auth_login_codes c
   where c.email = lower(trim(p_email)) and c.code_hash = p_hash and c.consumed_at is null;
  get diagnostics v_count = row_count;
  return v_count > 0;
end $$;

revoke execute on function public.auth_code_cancel(text, text) from anon, authenticated, public;
