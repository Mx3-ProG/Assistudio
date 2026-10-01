-- =============================================================================
-- Profile provisioning that does not depend on a trigger on auth.users.
--
-- auth.users belongs to Supabase: on some projects the migration role may not
-- create the on_auth_user_created trigger (see core_schema). The app therefore
-- provisions the profile + affiliate application itself, through the single
-- provisioning function introduced by the self-heal migration
-- (20260930000001_account_self_heal.sql):
--   - provision_account(): right after auth.admin.createUser (sign-up by code);
--   - ensure_profile(): before sending a login code and on sign-in by code.
-- (getSession keeps using ensure_my_account() for OAuth / dashboard users.)
-- provision_account() becomes idempotent: a second call never duplicates,
-- overwrites or resurrects anything. Service role only.
-- =============================================================================

create or replace function public.provision_account(p_id uuid, p_email text, p_meta jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(p_meta, '{}'::jsonb);
  auto_approve boolean;
  v_sponsor uuid;
  v_code text := nullif(trim(v_meta ->> 'sponsor_code'), '');
begin
  select coalesce((value)::boolean, false) into auto_approve
    from public.settings where key = 'affiliates.auto_approve';
  if v_code is not null then
    select id into v_sponsor from public.affiliates
     where deleted_at is null and status = 'approved'
       and (upper(code) = upper(v_code) or lower(slug::text) = lower(v_code))
     limit 1;
  end if;

  insert into public.profiles (id, email, full_name, locale)
  values (p_id, p_email, coalesce(v_meta ->> 'full_name', ''), coalesce(v_meta ->> 'locale', 'en'))
  on conflict (id) do nothing;

  insert into public.affiliates (profile_id, status, approved_at, country, application, sponsor_id)
  values (
    p_id,
    case when coalesce(auto_approve, false) then 'approved'::public.affiliate_status else 'pending' end,
    case when coalesce(auto_approve, false) then now() end,
    v_meta ->> 'country',
    coalesce(v_meta -> 'application', '{}'::jsonb),
    v_sponsor
  )
  on conflict (profile_id) do nothing;
end $$;

-- Finds the auth user by email and provisions the profile if it is missing.
-- No row when no account exists for that address.
create or replace function public.ensure_profile(p_email text)
returns table (id uuid, role public.user_role, deleted boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_user record;
begin
  select u.id, u.email, u.raw_user_meta_data into v_user
    from auth.users u where lower(u.email) = lower(trim(p_email))
   limit 1;
  if not found then return; end if;
  if not exists (select 1 from public.profiles p where p.id = v_user.id) then
    perform public.provision_account(v_user.id, v_user.email, coalesce(v_user.raw_user_meta_data, '{}'::jsonb));
  end if;
  return query select p.id, p.role, p.deleted_at is not null from public.profiles p where p.id = v_user.id;
end $$;

-- Removed: provision_user() from an earlier version of this migration (now provision_account()).
drop function if exists public.provision_user(uuid, text, jsonb);

revoke execute on function
  public.provision_account(uuid, text, jsonb),
  public.ensure_profile(text)
  from anon, authenticated, public;
