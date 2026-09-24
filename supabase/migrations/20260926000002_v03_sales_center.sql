-- =============================================================================
-- STUDIO V0.3 — Affiliate Sales Center, playbooks, affiliate sales pages.
-- Additive only: no table or column dropped.
--
-- Audit of V0.2 before this migration (what is REUSED rather than duplicated)
--   * markets               → the target segments. Already linked to campaigns,
--                             prospects and private pages; gains relevance +
--                             product. Localised copy stays in markets.content.
--   * private_sales_pages   → the affiliate sales pages (/p/{slug} and the new
--                             /a/{affiliate}/{target}). Gains template, angle,
--                             CTA mode, advisor block, indexing flag.
--   * campaigns / affiliate_links / prospects / leads → extended, not replaced.
--   * referral_sessions + resolve_attribution → unchanged: every page visit is
--                             a server-side touch; checkout re-resolves it.
--
-- NEW
--   * sales_content         → ONE versioned table for every piece of sales
--                             content (playbooks, call scripts, messages,
--                             emails, objections, product knowledge, assets,
--                             sales angles, landing-page templates & variants,
--                             first-week journey). kind + key + locale identify
--                             an item; version/status give the history. At most
--                             one ACTIVE version per (kind, key, locale).
--                             Replaces the 15+ tables a naive model would need;
--                             body shape per kind is validated in the app (Zod,
--                             src/lib/sales/content.ts).
--   * affiliate_favorites, affiliate_progress, sales_events.
--   * affiliate_performance(), admin_sales_center_analytics() read models.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Settings
-- -----------------------------------------------------------------------------
insert into public.settings (key, value, is_public, description) values
  ('crm.follow_up_days',          '3'::jsonb,     false, 'Days without reply before the CRM suggests a follow-up'),
  ('crm.checkout_check_in_days',  '2'::jsonb,     false, 'Days after a started checkout before suggesting ONE personal check-in'),
  ('sales_pages.allow_indexing',  'false'::jsonb, false, 'Allow affiliates to make their sales pages indexable by search engines'),
  ('sales_pages.advisor_enabled', 'true'::jsonb,  false, 'Allow the "Your STUDIO advisor" block on affiliate sales pages')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Catalog: a second, distinct offer family. Inactive until STUDIO confirms its
-- scope and pricing (the historical documents are references, not truth).
-- -----------------------------------------------------------------------------
insert into public.products (slug, name, is_active, sort, content)
values ('technical-assistance', 'Technical intervention', false, 2,
        '{"note":"Hourly technical assistance on demand. Pricing and scope to be confirmed by STUDIO before activation."}'::jsonb)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Targets = markets (reused). Non-localised attributes as columns.
-- -----------------------------------------------------------------------------
alter table public.markets
  add column if not exists relevance  smallint not null default 3 check (relevance between 1 and 5),
  add column if not exists product_id uuid references public.products (id);

update public.markets set product_id = (select id from public.products where slug = 'studio') where product_id is null;

-- -----------------------------------------------------------------------------
-- Versioned sales content
-- -----------------------------------------------------------------------------
create table public.sales_content (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in (
                 'playbook', 'call_script', 'message', 'email_template', 'objection', 'knowledge',
                 'asset', 'sales_angle', 'page_template', 'page_variant', 'journey')),
  -- Stable identifier shared by every version and locale (permanent URLs, favorites).
  key          text not null check (key ~ '^[a-z0-9][a-z0-9_.:-]{0,79}$'),
  locale       text not null default 'en' check (locale in ('en', 'fr', 'de', 'es', 'pt', 'it', 'nl', 'ar')),
  version      int  not null default 1 check (version >= 1),
  status       text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  product_id   uuid references public.products (id),
  target_key   text,          -- markets.slug; null = every target
  channel      text check (channel in ('phone', 'email', 'linkedin', 'whatsapp', 'sms', 'instagram', 'in_person', 'other')),
  stage        text check (stage in ('first_contact', 'follow_up', 'after_call', 'proposal', 'no_response',
                                     'interested', 'objection', 'closing', 'renewal')),
  title        text not null check (length(title) between 1 and 200),
  summary      text check (length(summary) <= 1000),
  body         jsonb not null default '{}'::jsonb
               check (jsonb_typeof(body) = 'object' and pg_column_size(body) < 200000),
  tags         text[] not null default '{}',
  sort         int  not null default 0,
  created_by   uuid references public.profiles (id),
  updated_by   uuid references public.profiles (id),
  published_at timestamptz,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (kind, key, locale, version)
);
create unique index sales_content_one_active on public.sales_content (kind, key, locale) where status = 'active';
create index sales_content_active_idx on public.sales_content (locale, kind, sort) where status = 'active';
create index sales_content_target_idx on public.sales_content (target_key) where status = 'active';
create trigger sales_content_updated_at before update on public.sales_content
  for each row execute function public.set_updated_at();

-- Published content is immutable (a change = a new version) and status only
-- moves through the audited staff functions below.
create or replace function public.guard_sales_content() returns trigger
language plpgsql as $$
declare
  v_publishing boolean := coalesce(current_setting('studio.publishing', true), '') = 'on';
  v_free constant text[] := array['status', 'published_at', 'archived_at', 'updated_at', 'updated_by', 'sort'];
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' and not v_publishing then
      raise exception 'New content starts as a draft; publish it with staff_publish_sales_content()';
    end if;
    return new;
  end if;
  if old.status <> 'draft' and (to_jsonb(new) - v_free) is distinct from (to_jsonb(old) - v_free) then
    raise exception 'Published content is immutable: create a new version';
  end if;
  if new.status is distinct from old.status and not v_publishing then
    raise exception 'Status changes go through staff_publish_sales_content / staff_archive_sales_content';
  end if;
  return new;
end $$;
create trigger sales_content_guard before insert or update on public.sales_content
  for each row execute function public.guard_sales_content();

create or replace function public.audit_sales_content() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r public.sales_content := coalesce(new, old);
begin
  -- Status transitions are logged (with their reason) by the staff functions.
  if tg_op = 'UPDATE' and new.status is distinct from old.status then return null; end if;
  perform public.log_audit('sales_content.' || lower(tg_op), 'sales_content', r.id::text,
    case when tg_op <> 'INSERT' then jsonb_build_object('title', old.title, 'status', old.status, 'version', old.version) end,
    case when tg_op <> 'DELETE' then jsonb_build_object('kind', new.kind, 'key', new.key, 'locale', new.locale,
                                                         'version', new.version, 'title', new.title, 'status', new.status) end,
    null);
  return null;
end $$;
create trigger sales_content_audit after insert or update or delete on public.sales_content
  for each row execute function public.audit_sales_content();

-- Publishing a version archives the previously active one of the same
-- (kind, key, locale): old documents stop circulating, permanent URLs follow.
-- Publishing an archived version is a rollback.
create or replace function public.staff_publish_sales_content(p_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.sales_content;
  v_prev uuid;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into r from public.sales_content where id = p_id for update;
  if not found then raise exception 'content not found'; end if;
  if r.status = 'active' then return; end if;
  perform set_config('studio.publishing', 'on', true);
  update public.sales_content set status = 'archived', archived_at = now(), updated_by = auth.uid()
   where kind = r.kind and key = r.key and locale = r.locale and status = 'active'
  returning id into v_prev;
  update public.sales_content set status = 'active', published_at = now(), archived_at = null, updated_by = auth.uid()
   where id = p_id;
  perform set_config('studio.publishing', 'off', true);
  perform public.log_audit('sales_content.publish', 'sales_content', p_id::text,
    jsonb_build_object('previous_active', v_prev),
    jsonb_build_object('kind', r.kind, 'key', r.key, 'locale', r.locale, 'version', r.version), p_reason);
end $$;

create or replace function public.staff_archive_sales_content(p_id uuid, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare r public.sales_content;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into r from public.sales_content where id = p_id for update;
  if not found then raise exception 'content not found'; end if;
  if r.status = 'archived' then return; end if;
  perform set_config('studio.publishing', 'on', true);
  update public.sales_content set status = 'archived', archived_at = now(), updated_by = auth.uid() where id = p_id;
  perform set_config('studio.publishing', 'off', true);
  perform public.log_audit('sales_content.archive', 'sales_content', p_id::text,
    jsonb_build_object('status', r.status), jsonb_build_object('status', 'archived', 'version', r.version), p_reason);
end $$;

-- New draft version (optionally in another locale) copied from an existing row.
create or replace function public.staff_new_sales_content_version(p_from uuid, p_locale text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  r public.sales_content;
  v_locale text;
  v_id uuid;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into r from public.sales_content where id = p_from;
  if not found then raise exception 'content not found'; end if;
  v_locale := coalesce(p_locale, r.locale);
  insert into public.sales_content (kind, key, locale, version, status, product_id, target_key, channel, stage,
                                    title, summary, body, tags, sort, created_by, updated_by)
  values (r.kind, r.key, v_locale,
          coalesce((select max(version) from public.sales_content where kind = r.kind and key = r.key and locale = v_locale), 0) + 1,
          'draft', r.product_id, r.target_key, r.channel, r.stage, r.title, r.summary, r.body, r.tags, r.sort, auth.uid(), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- Affiliate sales pages (private_sales_pages, reused)
--   brand-controlled: template, angle, product, offer & price (read from the
--                     catalog at render time — never stored on the page)
--   affiliate:        target, CTA mode among the allowed ones, advisor block
-- -----------------------------------------------------------------------------
alter table public.private_sales_pages
  add column if not exists path_key     text check (path_key ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  add column if not exists template_key text,
  add column if not exists angle_key    text,
  add column if not exists product_id   uuid references public.products (id),
  add column if not exists cta_mode     text not null default 'lead'
                                        check (cta_mode in ('buy', 'lead', 'call', 'quote', 'question')),
  add column if not exists show_advisor boolean not null default false,
  -- { name, title, email, phone, photoUrl } — the affiliate's professional contact only.
  add column if not exists advisor      jsonb not null default '{}'::jsonb
                                        check (jsonb_typeof(advisor) = 'object' and pg_column_size(advisor) < 4000),
  add column if not exists indexable    boolean not null default false,
  add column if not exists archived_at  timestamptz;
create unique index if not exists private_sales_pages_path_idx
  on public.private_sales_pages (affiliate_id, path_key) where path_key is not null and archived_at is null;

update public.private_sales_pages set product_id = (select id from public.products where slug = 'studio') where product_id is null;

create or replace function public.guard_sales_page() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if tg_op = 'UPDATE' then
      new.affiliate_id := old.affiliate_id;
      new.slug := old.slug;
      new.view_count := old.view_count;
    else
      new.view_count := 0;
    end if;
    if new.indexable and not coalesce((public.setting('sales_pages.allow_indexing'))::boolean, false) then
      raise exception 'Indexing affiliate sales pages is disabled by STUDIO';
    end if;
    if new.show_advisor and not coalesce((public.setting('sales_pages.advisor_enabled'))::boolean, true) then
      new.show_advisor := false;
    end if;
  end if;
  if new.template_key is not null and not exists (
      select 1 from public.sales_content where kind = 'page_template' and key = new.template_key and status = 'active') then
    raise exception 'Unknown or unpublished page template';
  end if;
  if new.angle_key is not null and not exists (
      select 1 from public.sales_content where kind = 'sales_angle' and key = new.angle_key and status = 'active') then
    raise exception 'Unknown or unpublished sales angle';
  end if;
  return new;
end $$;
drop trigger if exists private_sales_pages_guard on public.private_sales_pages;
create trigger private_sales_pages_guard before insert or update on public.private_sales_pages
  for each row execute function public.guard_sales_page();

-- -----------------------------------------------------------------------------
-- Links & campaigns: target, page, channel, template
-- -----------------------------------------------------------------------------
alter table public.affiliate_links
  add column if not exists private_page_id uuid references public.private_sales_pages (id) on delete set null,
  add column if not exists market_id       uuid references public.markets (id),
  add column if not exists channel         text;

alter table public.campaigns
  add column if not exists private_page_id uuid references public.private_sales_pages (id) on delete set null,
  add column if not exists product_id      uuid references public.products (id),
  add column if not exists message_key     text;

-- An affiliate can only attach their OWN page / campaign to their links.
create or replace function public.guard_affiliate_refs() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.private_page_id is not null and not exists (
      select 1 from public.private_sales_pages p where p.id = new.private_page_id and p.affiliate_id = new.affiliate_id) then
    raise exception 'Sales page belongs to another affiliate';
  end if;
  if tg_table_name = 'affiliate_links' and new.campaign_id is not null and not exists (
      select 1 from public.campaigns c where c.id = new.campaign_id and c.affiliate_id = new.affiliate_id) then
    raise exception 'Campaign belongs to another affiliate';
  end if;
  return new;
end $$;
drop trigger if exists affiliate_links_guard_refs on public.affiliate_links;
create trigger affiliate_links_guard_refs before insert or update on public.affiliate_links
  for each row execute function public.guard_affiliate_refs();
drop trigger if exists campaigns_guard_refs on public.campaigns;
create trigger campaigns_guard_refs before insert or update on public.campaigns
  for each row execute function public.guard_affiliate_refs();

-- -----------------------------------------------------------------------------
-- CRM: new stages; legacy 'interested' → 'qualified'
-- -----------------------------------------------------------------------------
update public.prospects set stage = 'qualified' where stage = 'interested';

-- -----------------------------------------------------------------------------
-- Leads from sales pages. The request type is recorded; contact details reach
-- the affiliate's CRM ONLY when the visitor explicitly agreed to be contacted
-- by that advisor (otherwise the STUDIO team handles the request, V0.2 rule).
-- -----------------------------------------------------------------------------
alter table public.leads
  add column if not exists request_type       text check (request_type in ('info', 'call', 'question', 'quote')),
  add column if not exists advisor_consent_at timestamptz;

create or replace function public.on_lead_share_with_advisor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.affiliate_id is not null and new.advisor_consent_at is not null then
    insert into public.prospects (affiliate_id, lead_id, campaign_id, market_id, name, company, profession,
                                  email, phone, website, notes, source, stage, next_action_at)
    values (new.affiliate_id, new.id, new.campaign_id,
            (select p.market_id from public.private_sales_pages p where p.id = new.private_page_id),
            left(new.full_name, 200), new.company, new.profession, new.email, new.phone, new.website,
            left(new.message, 5000), 'sales_page', 'new', now());
  end if;
  return new;
end $$;
drop trigger if exists leads_share_with_advisor on public.leads;
create trigger leads_share_with_advisor after insert on public.leads
  for each row execute function public.on_lead_share_with_advisor();

-- -----------------------------------------------------------------------------
-- Favorites, progress, usage events
-- -----------------------------------------------------------------------------
-- By (kind, key): a favorite survives new versions of the content.
create table public.affiliate_favorites (
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  content_kind text not null check (length(content_kind) between 1 and 40),
  content_key  text not null check (length(content_key) between 1 and 80),
  created_at   timestamptz not null default now(),
  primary key (affiliate_id, content_kind, content_key)
);

-- First-week plan, onboarding checklists… one row per completed item.
create table public.affiliate_progress (
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  item_key     text not null check (item_key ~ '^[a-z0-9][a-z0-9_.:-]{0,79}$'),
  completed_at timestamptz not null default now(),
  primary key (affiliate_id, item_key)
);

-- Usage & funnel events that are not clicks, leads, checkouts or sales (those
-- have their own tables). No personal data: ids and keys only.
create table public.sales_events (
  id              bigint generated always as identity primary key,
  event           text not null check (event in (
                    'cta_click', 'content_view', 'content_copy', 'page_share', 'start_selling', 'playbook_open')),
  affiliate_id    uuid references public.affiliates (id) on delete cascade,
  visitor_id      uuid references public.visitors (id) on delete set null,
  private_page_id uuid references public.private_sales_pages (id) on delete set null,
  link_id         uuid references public.affiliate_links (id) on delete set null,
  campaign_id     uuid references public.campaigns (id) on delete set null,
  content_kind    text,
  content_key     text,
  target_key      text,
  channel         text,
  meta            jsonb not null default '{}'::jsonb check (pg_column_size(meta) < 2000),
  occurred_at     timestamptz not null default now()
);
create index sales_events_affiliate_idx on public.sales_events (affiliate_id, occurred_at desc);
create index sales_events_page_idx on public.sales_events (private_page_id, event) where private_page_id is not null;
create index sales_events_content_idx on public.sales_events (content_kind, content_key, occurred_at desc) where content_key is not null;

-- -----------------------------------------------------------------------------
-- Read models
-- -----------------------------------------------------------------------------
-- Funnel per page / link / campaign / total for one affiliate. Every stage is
-- counted from its own source of truth and never blended:
--   clicks & unique visitors (clicks) → CTA clicks (sales_events) → leads
--   (leads) → checkout starts (checkout_sessions) → sales, revenue and
--   commissions (sales/commissions, confirmed by Stripe).
create or replace function public.affiliate_performance(p_affiliate uuid default null, p_since timestamptz default null)
returns table (dimension text, ref_id uuid, clicks bigint, visitors bigint, cta_clicks bigint, leads bigint,
               checkouts bigint, sales bigint, revenue_cents bigint, commission_cents bigint, commission_pending_cents bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  v_aff uuid := coalesce(p_affiliate, public.current_affiliate_id());
  v_since timestamptz := coalesce(p_since, '-infinity'::timestamptz);
begin
  if v_aff is null then return; end if;
  if auth.uid() is not null and v_aff is distinct from public.current_affiliate_id() and not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return query
  with src as (
    select 'click'::text as k, c.link_id, c.campaign_id, c.private_page_id, c.visitor_id, 0::bigint as amt, 0::bigint as com, 0::bigint as pend
      from public.clicks c where c.affiliate_id = v_aff and not c.is_bot and c.occurred_at >= v_since
    union all
    select 'cta', e.link_id, e.campaign_id, e.private_page_id, e.visitor_id, 0, 0, 0
      from public.sales_events e where e.affiliate_id = v_aff and e.event = 'cta_click' and e.occurred_at >= v_since
    union all
    select 'lead', l.link_id, l.campaign_id, l.private_page_id, l.visitor_id, 0, 0, 0
      from public.leads l where l.affiliate_id = v_aff and l.deleted_at is null and l.created_at >= v_since
    union all
    select 'checkout', k.link_id, k.campaign_id, k.private_page_id, null, 0, 0, 0
      from public.checkout_sessions k where k.affiliate_id = v_aff and k.created_at >= v_since
    union all
    select 'sale', s.link_id, s.campaign_id, coalesce(cs.private_page_id, cs2.private_page_id), null,
           s.gross_amount_cents,
           coalesce((select sum(co.amount_cents) from public.commissions co where co.sale_id = s.id and co.status <> 'reversed'), 0)::bigint,
           coalesce((select sum(co.amount_cents) from public.commissions co where co.sale_id = s.id
                      and co.status in ('awaiting_payment', 'pending', 'disputed')), 0)::bigint
      from public.sales s
      left join public.checkout_sessions cs on cs.id = s.checkout_session_id
      left join public.subscriptions sub on sub.id = s.subscription_id
      left join public.checkout_sessions cs2 on cs2.id = sub.checkout_session_id
     where s.affiliate_id = v_aff and s.status in ('paid', 'partially_refunded', 'disputed')
       and coalesce(s.paid_at, s.created_at) >= v_since
  )
  select d.dimension, d.ref_id,
         count(*) filter (where src.k = 'click'),
         count(distinct src.visitor_id) filter (where src.k = 'click'),
         count(*) filter (where src.k = 'cta'),
         count(*) filter (where src.k = 'lead'),
         count(*) filter (where src.k = 'checkout'),
         count(*) filter (where src.k = 'sale'),
         coalesce(sum(src.amt) filter (where src.k = 'sale'), 0)::bigint,
         coalesce(sum(src.com) filter (where src.k = 'sale'), 0)::bigint,
         coalesce(sum(src.pend) filter (where src.k = 'sale'), 0)::bigint
    from src
    cross join lateral (values ('total', null::uuid), ('link', src.link_id), ('campaign', src.campaign_id), ('page', src.private_page_id))
         as d(dimension, ref_id)
   where d.dimension = 'total' or d.ref_id is not null
   group by d.dimension, d.ref_id;
end $$;

-- What STUDIO needs to improve its sales system from real data.
create or replace function public.admin_sales_center_analytics(p_since timestamptz default now() - interval '90 days')
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'content', coalesce((select jsonb_agg(x order by x.copies + x.views desc) from (
        select content_kind as kind, content_key as key,
               count(*) filter (where event = 'content_view') as views,
               count(*) filter (where event = 'content_copy') as copies,
               count(distinct affiliate_id) as affiliates
          from public.sales_events where occurred_at >= p_since and content_key is not null
         group by content_kind, content_key order by count(*) desc limit 40) x), '[]'::jsonb),
    'targets', coalesce((select jsonb_agg(x order by x.pages desc) from (
        select m.slug as target, count(distinct p.id) as pages,
               count(distinct c.visitor_id) as visitors,
               (select count(*) from public.leads l join public.private_sales_pages pp on pp.id = l.private_page_id
                 where pp.market_id = m.id and l.created_at >= p_since) as leads
          from public.markets m
          left join public.private_sales_pages p on p.market_id = m.id and p.archived_at is null
          left join public.clicks c on c.private_page_id = p.id and not c.is_bot and c.occurred_at >= p_since
         group by m.id, m.slug) x), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(x order by x.sales desc, x.visitors desc) from (
        select p.id, p.slug, p.path_key, p.template_key, m.slug as target, p.cta_mode,
               (select count(distinct c.visitor_id) from public.clicks c
                 where c.private_page_id = p.id and not c.is_bot and c.occurred_at >= p_since) as visitors,
               (select count(*) from public.leads l where l.private_page_id = p.id and l.created_at >= p_since) as leads,
               (select count(*) from public.checkout_sessions k where k.private_page_id = p.id and k.created_at >= p_since) as checkouts,
               (select count(*) from public.sales s join public.checkout_sessions k on k.id = s.checkout_session_id
                 where k.private_page_id = p.id and s.status in ('paid', 'partially_refunded') and s.created_at >= p_since) as sales
          from public.private_sales_pages p left join public.markets m on m.id = p.market_id
         where p.archived_at is null
         order by 10 desc, 7 desc limit 30) x), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(x order by x.sales desc) from (
        select c.id, c.name, c.source, m.slug as target,
               (select count(*) from public.leads l where l.campaign_id = c.id and l.created_at >= p_since) as leads,
               (select count(*) from public.sales s where s.campaign_id = c.id and s.status in ('paid', 'partially_refunded')
                  and s.created_at >= p_since) as sales
          from public.campaigns c left join public.markets m on m.id = c.market_id
         where c.archived_at is null
         order by 6 desc, 5 desc limit 30) x), '[]'::jsonb),
    'objections', coalesce((select jsonb_agg(x order by x.views desc) from (
        select content_key as key, count(*) as views from public.sales_events
         where occurred_at >= p_since and content_kind = 'objection' and event in ('content_view', 'content_copy')
         group by content_key order by 2 desc limit 20) x), '[]'::jsonb)
  );
end $$;
