-- A tracked visitor can create an account after browsing several clean URLs.
-- Allow the server-side sign-up flow to attach that sponsor afterwards, but
-- never replace an existing relationship and never expose the function to
-- browser roles.
create or replace function public.attach_missing_sponsor(p_profile_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_affiliate uuid;
  v_sponsor uuid;
begin
  select a.id into v_affiliate
    from public.affiliates a
   where a.profile_id = p_profile_id
     and a.deleted_at is null
     and a.sponsor_id is null
   for update;
  if v_affiliate is null then return false; end if;

  select a.id into v_sponsor
    from public.affiliates a
   where a.deleted_at is null
     and a.status = 'approved'
     and a.id <> v_affiliate
     and (upper(a.code) = upper(trim(p_code)) or lower(a.slug::text) = lower(trim(p_code)))
   limit 1;
  if v_sponsor is null then return false; end if;

  update public.affiliates
     set sponsor_id = v_sponsor
   where id = v_affiliate and sponsor_id is null;
  if not found then return false; end if;

  perform public.log_audit(
    'affiliate.sponsor_attached', 'affiliate', v_affiliate::text,
    jsonb_build_object('sponsor_id', null), jsonb_build_object('sponsor_id', v_sponsor),
    'Sponsor recovered from the sign-up referral.'
  );
  return true;
end $$;

revoke execute on function public.attach_missing_sponsor(uuid, text) from anon, authenticated, public;
grant execute on function public.attach_missing_sponsor(uuid, text) to service_role;
