-- =============================================================================
-- Account self-heal (2026-09-30). A Supabase Auth user without a
-- public.profiles row (created from the Supabase dashboard, or before the
-- on_auth_user_created trigger existed) could sign in but was bounced back to
-- /login forever: the app treats "no profile" as "no session".
--
-- provision_account() is the single place that turns an auth user into a
-- profile + affiliate application; the sign-up trigger and the self-heal RPC
-- both call it, so the two paths can never drift. A soft-deleted profile is
-- never resurrected.
-- =============================================================================

create or replace function public.provision_account(p_id uuid, p_email text, p_meta jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  auto_approve boolean;
  v_sponsor uuid;
  v_code text := nullif(trim(p_meta ->> 'sponsor_code'), '');
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
  values (p_id, p_email, coalesce(p_meta ->> 'full_name', ''), coalesce(p_meta ->> 'locale', 'en'));

  insert into public.affiliates (profile_id, status, approved_at, country, application, sponsor_id)
  values (
    p_id,
    case when auto_approve then 'approved'::public.affiliate_status else 'pending' end,
    case when auto_approve then now() end,
    p_meta ->> 'country',
    coalesce(p_meta -> 'application', '{}'::jsonb),
    v_sponsor
  );
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.provision_account(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end $$;

-- Called by the signed-in user when their profile is missing. Returns true
-- when a profile was created. Audited.
create or replace function public.ensure_my_account() returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_user auth.users;
begin
  if v_uid is null then return false; end if;
  if exists (select 1 from public.profiles where id = v_uid) then return false; end if;
  select * into v_user from auth.users where id = v_uid;
  if v_user.id is null then return false; end if;

  perform public.provision_account(v_user.id, v_user.email, coalesce(v_user.raw_user_meta_data, '{}'::jsonb));
  perform public.log_audit('account.self_heal', 'profile', v_uid::text, null,
                           jsonb_build_object('email', v_user.email), 'profile missing at sign-in');
  return true;
end $$;

revoke execute on function public.provision_account(uuid, text, jsonb) from anon, authenticated, public;
revoke execute on function public.ensure_my_account() from anon, public;
grant execute on function public.ensure_my_account() to authenticated;
