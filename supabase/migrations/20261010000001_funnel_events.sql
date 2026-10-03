-- =============================================================================
-- Activation funnel (home conversion V1)
--
-- 1. funnel_events: first-party, cookie-free product analytics.
--    Public events (home_view, CTA clicks…) carry NO visitor identifier — they
--    are aggregate counts only, so no consent is needed. Events tied to an
--    ambassador (signup_completed, prospect_added…) carry the affiliate id.
--    Written only with the service role (server actions + /api/events), read
--    by staff only.
--
-- 2. admin_activation_funnel(p_since): the metrics that matter after sign-up
--    (link copied, first prospect, first hand-over, opportunities → sales,
--    median delays, revenue per active ambassador), each computed from its own
--    source of truth. Staff only.
-- =============================================================================

create table public.funnel_events (
  id           bigint generated always as identity primary key,
  event        text not null check (event in (
                 'home_view', 'hero_signup_click', 'see_product_click', 'studio_demo_click',
                 'commission_simulator_interaction', 'sales_center_click', 'first_prospect_cta', 'cta_click',
                 'signup_started', 'signup_completed', 'onboarding_started', 'onboarding_completed',
                 'affiliate_link_copied', 'sales_script_copied', 'prospect_added', 'prospect_submitted')),
  affiliate_id uuid references public.affiliates (id) on delete cascade,
  locale       text check (locale is null or locale ~ '^[a-z]{2}$'),
  placement    text check (placement is null or placement ~ '^[a-z0-9_]{1,40}$'),
  meta         jsonb not null default '{}'::jsonb
                 check (jsonb_typeof(meta) = 'object' and pg_column_size(meta) < 2000),
  occurred_at  timestamptz not null default now()
);
create index funnel_events_event_idx on public.funnel_events (event, occurred_at desc);
create index funnel_events_affiliate_idx on public.funnel_events (affiliate_id, event, occurred_at)
  where affiliate_id is not null;

alter table public.funnel_events enable row level security;
create policy funnel_events_staff_read on public.funnel_events for select using (public.is_staff());
revoke insert, update, delete on public.funnel_events from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Staff read model
-- -----------------------------------------------------------------------------
create or replace function public.admin_activation_funnel(p_since timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_since timestamptz := coalesce(p_since, now() - interval '30 days');
  v jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;

  with cohort as (
    select a.id, a.created_at
      from public.affiliates a
      join public.profiles p on p.id = a.profile_id
     where a.created_at >= v_since and a.deleted_at is null and p.role = 'affiliate'
  ),
  firsts as (
    select c.id, c.created_at,
           (select min(f.occurred_at) from public.funnel_events f
             where f.affiliate_id = c.id and f.event = 'affiliate_link_copied') as link_at,
           (select min(pr.created_at) from public.prospects pr
             where pr.affiliate_id = c.id and pr.deleted_at is null) as prospect_at,
           (select min(e.created_at) from public.prospect_events e
             where e.affiliate_id = c.id and e.type = 'handed_off') as handoff_at,
           (select min(f.occurred_at) from public.funnel_events f
             where f.affiliate_id = c.id
               and f.event in ('affiliate_link_copied', 'sales_script_copied', 'prospect_added', 'prospect_submitted')) as action_at
      from cohort c
  ),
  firsts2 as (
    -- First action: a tracked action, else the first prospect (created before tracking existed).
    select f.*, nullif(least(coalesce(f.action_at, 'infinity'), coalesce(f.prospect_at, 'infinity')), 'infinity'::timestamptz) as first_action_at
      from firsts f
  ),
  opp as (
    -- Opportunities = prospects handed over to Studio or that reached checkout, in the period.
    select distinct pr.id, pr.stage
      from public.prospects pr
     where pr.deleted_at is null
       and (pr.stage in ('handed_off', 'checkout', 'won')
            or exists (select 1 from public.prospect_events e where e.prospect_id = pr.id and e.type in ('handed_off', 'quote')))
       and pr.created_at >= v_since
  ),
  active as (
    -- Active ambassador = did something trackable in the period.
    select distinct affiliate_id as id from public.prospects where created_at >= v_since and deleted_at is null
    union select distinct affiliate_id from public.funnel_events where occurred_at >= v_since and affiliate_id is not null
      and event in ('affiliate_link_copied', 'sales_script_copied', 'prospect_added', 'prospect_submitted')
    union select distinct affiliate_id from public.sales where paid_at >= v_since and status = 'paid' and affiliate_id is not null
  ),
  revenue as (
    select coalesce(sum(s.gross_amount_cents), 0)::bigint as cents
      from public.sales s where s.status = 'paid' and s.paid_at >= v_since and s.affiliate_id is not null
  )
  select jsonb_build_object(
    'since', v_since,
    'signups', (select count(*) from cohort),
    'link_copied', (select count(*) from firsts2 where link_at is not null),
    'first_prospect', (select count(*) from firsts2 where prospect_at is not null),
    'first_handoff', (select count(*) from firsts2 where handoff_at is not null),
    'opportunities', (select count(*) from opp),
    'opportunities_won', (select count(*) from opp where stage = 'won'),
    'median_hours_first_action', (select round((percentile_cont(0.5) within group (order by extract(epoch from first_action_at - created_at)) / 3600)::numeric, 1)
                                    from firsts2 where first_action_at is not null),
    'median_hours_first_prospect', (select round((percentile_cont(0.5) within group (order by extract(epoch from prospect_at - created_at)) / 3600)::numeric, 1)
                                      from firsts2 where prospect_at is not null),
    'active_ambassadors', (select count(*) from active),
    'revenue_cents', (select cents from revenue),
    'events', coalesce((select jsonb_object_agg(event, n) from (
                 select event, count(*) as n from public.funnel_events where occurred_at >= v_since group by event) x), '{}'::jsonb)
  ) into v;
  return v;
end $$;

revoke all on function public.admin_activation_funnel(timestamptz) from public, anon;
grant execute on function public.admin_activation_funnel(timestamptz) to authenticated;
