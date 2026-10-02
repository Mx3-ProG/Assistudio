-- =============================================================================
-- Studio ATS — Admin network view + partner help requests.
--
-- 1. help_requests: an affiliate asks the Studio ATS team for help. The
--    database stores the request with a FACTUAL snapshot of the account taken
--    at submission (status, sponsor, prospects, sales, balances, open
--    dossiers…) so the team never has to ask "what is your situation?". Every
--    staff member is emailed (email_events outbox, template staff.help_request).
-- 2. admin_network_stats(): one row per affiliate with everything the admin
--    network page needs (sponsor, recruits, prospects, sales, revenue,
--    commission buckets, open requests). Staff only.
--
-- Writes only go through SECURITY DEFINER functions; status changes by staff
-- are audited and notify the affiliate.
-- =============================================================================

create table public.help_requests (
  id            uuid primary key default gen_random_uuid(),
  public_ref    text not null unique default ('HLP-' || public.gen_code(6)),
  affiliate_id  uuid not null references public.affiliates (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  category      text not null check (category in (
                  'commission', 'payout', 'contract', 'prospect', 'sale', 'account', 'technical', 'training', 'other')),
  urgency       text not null default 'normal' check (urgency in ('low', 'normal', 'high')),
  subject       text not null check (length(btrim(subject)) between 3 and 160),
  message       text not null check (length(btrim(message)) between 10 and 4000),
  prospect_id   uuid references public.prospects (id) on delete set null,
  dossier_id    uuid references public.commercial_dossiers (id) on delete set null,
  page_path     text check (page_path is null or length(page_path) <= 300),
  -- Computed by submit_help_request(), never by the client.
  context       jsonb not null default '{}'::jsonb,
  status        text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  staff_note    text check (staff_note is null or length(staff_note) <= 2000),
  handled_by    uuid references public.profiles (id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index help_requests_affiliate_idx on public.help_requests (affiliate_id, created_at desc);
create index help_requests_open_idx on public.help_requests (status, created_at desc) where status in ('open', 'in_progress');
create trigger help_requests_updated_at before update on public.help_requests
  for each row execute function public.set_updated_at();

alter table public.help_requests enable row level security;
revoke all on public.help_requests from anon, authenticated;
grant select on public.help_requests to authenticated;
create policy help_requests_read on public.help_requests for select to authenticated
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());

-- -----------------------------------------------------------------------------
-- Factual account snapshot (shared by the help request and the email).
-- -----------------------------------------------------------------------------
create or replace function public.help_account_snapshot(p_affiliate_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'affiliate_status', a.status,
    'code', a.code,
    'country', a.country,
    'member_since', a.created_at,
    'onboarding_completed', a.onboarding_completed_at is not null,
    'sponsor', (select coalesce(nullif(p.full_name, ''), p.email::text) from public.affiliates s
                  join public.profiles p on p.id = s.profile_id where s.id = a.sponsor_id),
    'recruits', (select count(*) from public.affiliates r where r.sponsor_id = a.id and r.deleted_at is null),
    'prospects', (select count(*) from public.prospects x where x.affiliate_id = a.id and x.deleted_at is null),
    'leads', (select count(*) from public.leads l where l.affiliate_id = a.id and l.deleted_at is null),
    'paid_sales', (select count(*) from public.sales x where x.affiliate_id = a.id and x.status = 'paid' and x.kind = 'new'),
    'revenue_cents', (select coalesce(sum(x.gross_amount_cents), 0) from public.sales x
                       where x.affiliate_id = a.id and x.status = 'paid'),
    'pending_cents', coalesce(b.pending_cents, 0) + coalesce(b.disputed_cents, 0),
    'available_cents', coalesce(b.available_cents, 0),
    'paid_cents', coalesce(b.paid_cents, 0),
    'open_dossiers', (select count(*) from public.commercial_dossiers d where d.affiliate_id = a.id
                        and d.deleted_at is null and d.status not in ('active', 'declined', 'expired', 'cancelled')),
    'open_requests', (select count(*) from public.help_requests h where h.affiliate_id = a.id
                        and h.status in ('open', 'in_progress'))
  )
  from public.affiliates a
  left join public.affiliate_balances b on b.affiliate_id = a.id
  where a.id = p_affiliate_id
$$;

-- -----------------------------------------------------------------------------
-- Affiliate: submit a help request (rate-limited, emails every staff member).
-- -----------------------------------------------------------------------------
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

  perform public.log_audit('help_request.created', 'help_request', v_id::text, null,
    jsonb_build_object('category', p_category, 'urgency', coalesce(p_urgency, 'normal')), null);

  return query select v_id, v_ref;
end $$;

-- -----------------------------------------------------------------------------
-- Staff: move a request forward (audited, notifies the affiliate).
-- -----------------------------------------------------------------------------
create or replace function public.staff_update_help_request(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  h public.help_requests;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if p_status not in ('open', 'in_progress', 'resolved', 'closed') then raise exception 'help.invalid_status'; end if;
  select * into h from public.help_requests where id = p_id for update;
  if not found then raise exception 'not_found'; end if;

  update public.help_requests set
    status = p_status,
    staff_note = coalesce(nullif(btrim(coalesce(p_note, '')), ''), staff_note),
    handled_by = auth.uid(),
    resolved_at = case when p_status in ('resolved', 'closed') then coalesce(resolved_at, now()) else null end
  where id = p_id;

  perform public.log_audit('help_request.status', 'help_request', p_id::text,
    jsonb_build_object('status', h.status), jsonb_build_object('status', p_status), nullif(btrim(coalesce(p_note, '')), ''));
  if h.status is distinct from p_status then
    perform public.notify_affiliate(h.affiliate_id, 'admin_message', 'notifications.helpUpdated',
      jsonb_build_object('ref', h.public_ref, 'status', p_status), '/dashboard/help');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Staff: one row per affiliate for the network page.
-- Money is integer cents. `pending` is never earned; `available` is owed now
-- (net of unsettled clawbacks/adjustments); `paid` was paid out. Contract
-- dossiers are read by the page from src/lib/contracts/service.ts.
-- -----------------------------------------------------------------------------
create or replace function public.admin_network_stats()
returns table (
  affiliate_id uuid, profile_id uuid, full_name text, email text, role text, code text, status text,
  country text, sponsor_id uuid, created_at timestamptz, onboarding_completed boolean,
  recruits int, prospects int, prospects_won int, leads int, clicks_30d int,
  paid_sales int, renewals int, revenue_cents bigint,
  pending_cents bigint, disputed_cents bigint, available_cents bigint, paid_cents bigint, sponsor_earned_cents bigint,
  open_help int, open_fraud int, last_activity_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return query
  select a.id, a.profile_id, coalesce(nullif(p.full_name, ''), p.email::text), p.email::text, p.role::text,
         a.code, a.status::text, a.country, a.sponsor_id, a.created_at, a.onboarding_completed_at is not null,
         (select count(*)::int from public.affiliates r where r.sponsor_id = a.id and r.deleted_at is null),
         pr.total, pr.won,
         (select count(*)::int from public.leads l where l.affiliate_id = a.id and l.deleted_at is null
             and not exists (select 1 from public.prospects x where x.lead_id = l.id and x.deleted_at is null)),
         (select count(*)::int from public.clicks c where c.affiliate_id = a.id and not c.is_bot
             and c.occurred_at > now() - interval '30 days'),
         sa.paid_new, sa.paid_renewals, sa.revenue,
         coalesce(b.pending_cents, 0)::bigint, coalesce(b.disputed_cents, 0)::bigint,
         coalesce(b.available_cents, 0)::bigint, coalesce(b.paid_cents, 0)::bigint,
         (select coalesce(sum(c.amount_cents), 0)::bigint from public.commissions c
           where c.affiliate_id = a.id and c.commission_role = 'sponsor' and c.status in ('available', 'paid')),
         (select count(*)::int from public.help_requests h where h.affiliate_id = a.id and h.status in ('open', 'in_progress')),
         (select count(*)::int from public.fraud_flags f where f.affiliate_id = a.id and f.status in ('open', 'reviewing')),
         greatest(pr.last_at, sa.last_at,
                  (select max(l.created_at) from public.leads l where l.affiliate_id = a.id),
                  (select max(c.occurred_at) from public.clicks c where c.affiliate_id = a.id and not c.is_bot))
    from public.affiliates a
    join public.profiles p on p.id = a.profile_id
    left join public.affiliate_balances b on b.affiliate_id = a.id
    left join lateral (
      select count(*)::int as total, (count(*) filter (where x.stage = 'won'))::int as won, max(x.updated_at) as last_at
        from public.prospects x where x.affiliate_id = a.id and x.deleted_at is null
    ) pr on true
    left join lateral (
      select (count(*) filter (where s.status = 'paid' and s.kind = 'new'))::int as paid_new,
             (count(*) filter (where s.status = 'paid' and s.kind <> 'new'))::int as paid_renewals,
             coalesce(sum(s.gross_amount_cents) filter (where s.status = 'paid'), 0)::bigint as revenue,
             max(s.created_at) as last_at
        from public.sales s where s.affiliate_id = a.id and not s.is_demo
    ) sa on true
   where a.deleted_at is null and p.deleted_at is null
   order by a.created_at desc;
end $$;

revoke execute on function public.help_account_snapshot(uuid) from anon, authenticated, public;
revoke execute on function
  public.submit_help_request(text, text, text, text, uuid, uuid, text),
  public.staff_update_help_request(uuid, text, text),
  public.admin_network_stats()
  from anon, public;
grant execute on function
  public.submit_help_request(text, text, text, text, uuid, uuid, text),
  public.staff_update_help_request(uuid, text, text),
  public.admin_network_stats()
  to authenticated;
