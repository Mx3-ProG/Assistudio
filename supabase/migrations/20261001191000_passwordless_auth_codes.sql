-- Passwordless email codes sent by the app through Resend.
-- Only a keyed hash is stored. Service-role RPCs enforce expiry, single use,
-- attempt limits and per-address/per-network request limits.

create table if not exists public.auth_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  purpose text not null check (purpose in ('login', 'signup')),
  code_hash text not null,
  payload jsonb,
  attempts int not null default 0,
  ip_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create index if not exists auth_login_codes_email_idx on public.auth_login_codes (email, created_at desc);
create index if not exists auth_login_codes_ip_idx on public.auth_login_codes (ip_hash, created_at desc) where ip_hash is not null;

alter table public.auth_login_codes enable row level security;
revoke all on public.auth_login_codes from anon, authenticated, public;

create or replace function public.auth_code_issue(
  p_email text, p_purpose text, p_hash text, p_payload jsonb default null, p_ip_hash text default null
) returns table (status text, id uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('auth_code:' || v_email, 0));
  if exists (select 1 from public.auth_login_codes c where c.email = v_email and c.created_at > now() - interval '60 seconds') then
    return query select 'too_soon'::text, null::uuid; return;
  end if;
  if (select count(*) from public.auth_login_codes c where c.email = v_email and c.created_at > now() - interval '15 minutes') >= 5
     or (p_ip_hash is not null and (select count(*) from public.auth_login_codes c where c.ip_hash = p_ip_hash and c.created_at > now() - interval '15 minutes') >= 20) then
    return query select 'rate_limited'::text, null::uuid; return;
  end if;
  update public.auth_login_codes c set expires_at = least(c.expires_at, now())
   where c.email = v_email and c.consumed_at is null and c.expires_at > now();
  insert into public.auth_login_codes (email, purpose, code_hash, payload, ip_hash, expires_at)
  values (v_email, p_purpose, p_hash, p_payload, p_ip_hash, now() + interval '5 minutes')
  returning auth_login_codes.id into v_id;
  return query select 'issued'::text, v_id;
end $$;

create or replace function public.auth_code_consume(p_email text, p_hash text)
returns table (status text, purpose text, payload jsonb)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v public.auth_login_codes;
begin
  select * into v from public.auth_login_codes c
   where c.email = lower(trim(p_email)) and c.consumed_at is null
   order by c.created_at desc limit 1 for update;
  if not found then return query select 'invalid'::text, null::text, null::jsonb; return; end if;
  if v.expires_at <= now() then return query select 'expired'::text, null::text, null::jsonb; return; end if;
  if v.attempts >= 5 then return query select 'too_many_attempts'::text, null::text, null::jsonb; return; end if;
  update public.auth_login_codes c set attempts = c.attempts + 1 where c.id = v.id;
  if v.code_hash is distinct from p_hash then
    return query select (case when v.attempts + 1 >= 5 then 'too_many_attempts' else 'invalid' end)::text, null::text, null::jsonb; return;
  end if;
  update public.auth_login_codes c set consumed_at = now() where c.id = v.id;
  return query select 'ok'::text, v.purpose, v.payload;
end $$;

create or replace function public.auth_code_release(p_email text, p_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select c.id into v_id from public.auth_login_codes c
   where c.email = lower(trim(p_email)) and c.code_hash = p_hash
     and c.consumed_at is not null and c.consumed_at > now() - interval '1 minute' and c.expires_at > now()
   order by c.created_at desc limit 1 for update;
  if v_id is null then return false; end if;
  update public.auth_login_codes set consumed_at = null where id = v_id;
  return true;
end $$;

create or replace function public.auth_code_purge() returns int
language sql security definer set search_path = public as $$
  with d as (delete from public.auth_login_codes where created_at < now() - interval '1 day' returning 1)
  select count(*)::int from d
$$;

revoke execute on function public.auth_code_issue(text, text, text, jsonb, text) from anon, authenticated, public;
revoke execute on function public.auth_code_consume(text, text) from anon, authenticated, public;
revoke execute on function public.auth_code_release(text, text) from anon, authenticated, public;
revoke execute on function public.auth_code_purge() from anon, authenticated, public;
