-- New affiliates are active immediately. Staff can still suspend or reject an
-- account later from the admin affiliate review screen.
update public.settings
   set value = 'true'::jsonb,
       description = 'Legacy setting; new affiliates are automatically active'
 where key = 'affiliates.auto_approve';

-- Staff profiles may also have an affiliate record for testing or referrals;
-- that record must not leave a super-admin/admin stuck in affiliate onboarding.
do $$
declare
  changed record;
begin
  for changed in
    update public.affiliates a
       set status = 'approved', approved_at = coalesce(a.approved_at, now()), approved_by = null
      from public.profiles p
     where p.id = a.profile_id
       and p.role in ('super_admin', 'admin')
       and a.status = 'pending'
    returning a.id, a.profile_id
  loop
    insert into public.audit_logs (actor_id, action, entity, entity_id, before, after, reason)
    values (null, 'affiliate.status', 'affiliate', changed.id::text,
      jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'approved'),
      'Staff accounts must not be blocked by affiliate approval.');
  end loop;
end $$;

-- Keep direct-trigger and application provisioning paths consistent, including
-- self-heal and OAuth accounts created without the optional auth trigger.
create or replace function public.provision_account(p_id uuid, p_email text, p_meta jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(p_meta, '{}'::jsonb);
  v_sponsor uuid;
  v_code text := nullif(trim(v_meta ->> 'sponsor_code'), '');
begin
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
  values (p_id, 'approved', now(), v_meta ->> 'country', coalesce(v_meta -> 'application', '{}'::jsonb), v_sponsor)
  on conflict (profile_id) do nothing;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.provision_account(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end $$;
