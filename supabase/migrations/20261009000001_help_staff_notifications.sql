-- =============================================================================
-- Studio ATS — help requests also notify staff in the app (bell + red dots),
-- not only by email. Same function as 20261008000001, plus one notification
-- per admin / super admin.
-- =============================================================================

create or replace function public.submit_help_request(
  p_category text, p_urgency text, p_subject text, p_message text,
  p_prospect_id uuid default null, p_dossier_id uuid default null, p_page_path text default null
) returns table (id uuid, public_ref text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_aff public.affiliates;
  v_profile public.profiles;
  v_ctx jsonb;
  v_prospect public.prospects;
  v_dossier public.commercial_dossiers;
  v_related text;
  v_id uuid;
  v_ref text;
begin
  select * into v_aff from public.affiliates where profile_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'help.no_affiliate'; end if;
  select * into v_profile from public.profiles where id = auth.uid();

  if (select count(*) from public.help_requests h
       where h.affiliate_id = v_aff.id and h.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'help.rate_limited';
  end if;

  -- Related records must belong to the caller; anything else is ignored.
  if p_prospect_id is not null then
    select * into v_prospect from public.prospects x
     where x.id = p_prospect_id and x.affiliate_id = v_aff.id and x.deleted_at is null;
  end if;
  if p_dossier_id is not null then
    select * into v_dossier from public.commercial_dossiers d
     where d.id = p_dossier_id and d.affiliate_id = v_aff.id and d.deleted_at is null;
  end if;

  v_ctx := public.help_account_snapshot(v_aff.id);
  if v_prospect.id is not null then
    v_ctx := v_ctx || jsonb_build_object('prospect', jsonb_build_object(
      'name', v_prospect.name, 'company', v_prospect.company, 'stage', v_prospect.stage,
      'email', v_prospect.email, 'phone', v_prospect.phone, 'next_action', v_prospect.next_action));
    v_related := concat_ws(' · ', 'Prospect: ' || v_prospect.name, v_prospect.company, v_prospect.stage::text,
                           v_prospect.email::text, v_prospect.phone);
  end if;
  if v_dossier.id is not null then
    v_ctx := v_ctx || jsonb_build_object('dossier', jsonb_build_object(
      'ref', v_dossier.public_ref, 'status', v_dossier.status,
      'client', coalesce(v_dossier.client_company, v_dossier.client_name, v_dossier.client_email::text)));
    v_related := concat_ws(E'\n', v_related, concat_ws(' · ', 'Dossier: ' || v_dossier.public_ref, v_dossier.status,
                           coalesce(v_dossier.client_company, v_dossier.client_name, v_dossier.client_email::text)));
  end if;

  insert into public.help_requests (affiliate_id, profile_id, category, urgency, subject, message,
                                    prospect_id, dossier_id, page_path, context)
  values (v_aff.id, auth.uid(), p_category, coalesce(p_urgency, 'normal'), btrim(p_subject), btrim(p_message),
          v_prospect.id, v_dossier.id, nullif(left(btrim(coalesce(p_page_path, '')), 300), ''), v_ctx)
  returning help_requests.id, help_requests.public_ref into v_id, v_ref;

  -- One email per staff member, in their own locale (outbox, sent after commit).
  insert into public.email_events (idempotency_key, template, recipient_type, recipient_profile_id,
                                   related_entity, related_id, params)
  select 'help:' || v_id || ':' || p.id, 'staff.help_request', 'staff', p.id, 'help_request', v_id::text,
         jsonb_build_object(
           'ref', v_ref, 'category', p_category, 'urgency', coalesce(p_urgency, 'normal'),
           'subject', btrim(p_subject), 'message', btrim(p_message),
           'affiliate_name', coalesce(nullif(v_profile.full_name, ''), v_profile.email::text),
           'affiliate_email', v_profile.email::text, 'code', v_aff.code,
           'affiliate_status', v_ctx->>'affiliate_status', 'sponsor', coalesce(v_ctx->>'sponsor', '—'),
           'recruits', (v_ctx->>'recruits')::int, 'prospects', (v_ctx->>'prospects')::int,
           'leads', (v_ctx->>'leads')::int, 'paid_sales', (v_ctx->>'paid_sales')::int,
           'revenue_cents', (v_ctx->>'revenue_cents')::bigint, 'pending_cents', (v_ctx->>'pending_cents')::bigint,
           'available_cents', (v_ctx->>'available_cents')::bigint, 'paid_cents', (v_ctx->>'paid_cents')::bigint,
           'open_dossiers', (v_ctx->>'open_dossiers')::int, 'related', coalesce(v_related, ''),
           'page', coalesce(nullif(btrim(coalesce(p_page_path, '')), ''), '—'),
           'admin_path', '/admin/network/' || v_aff.id)
    from public.profiles p
   where p.role in ('super_admin', 'admin') and p.deleted_at is null and p.email is not null;

  -- In-app notification for every staff member (bell + red dots in the admin).
  insert into public.notifications (profile_id, type, title_key, params, href)
  select p.id, 'admin_message', 'notifications.helpNew',
         jsonb_build_object('ref', v_ref, 'name', coalesce(nullif(v_profile.full_name, ''), v_profile.email::text),
                            'subject', btrim(p_subject), 'urgency', coalesce(p_urgency, 'normal')),
         '/admin/help'
    from public.profiles p
   where p.role in ('super_admin', 'admin') and p.deleted_at is null;

  perform public.log_audit('help_request.created', 'help_request', v_id::text, null,
    jsonb_build_object('category', p_category, 'urgency', coalesce(p_urgency, 'normal')), null);

  return query select v_id, v_ref;
end $$;

revoke execute on function public.submit_help_request(text, text, text, text, uuid, uuid, text) from anon, public;
grant execute on function public.submit_help_request(text, text, text, text, uuid, uuid, text) to authenticated;
