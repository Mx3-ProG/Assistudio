-- =============================================================================
-- V0.5 guided pipeline ("next best action").
--
-- * prospect_events: append-only history of each CRM prospect (message sent,
--   reply received, proof sent, handed to Studio…). It feeds the prospect
--   timeline and the ambassador's progress ("small wins"). Owned by the
--   affiliate (RLS), readable by staff, never updated or deleted by clients.
-- * sales_content gains four admin-editable kinds that drive the guidance:
--   stage_guide (what to do at each stage), reply (what the prospect said →
--   answer level 1/2/3 + next step), fact (official Studio information,
--   including what may / may not be promised), find_source (where to find
--   first prospects). Body shapes are validated in src/lib/sales/content.ts.
-- No second CRM: prospects stay the single pipeline.
-- =============================================================================

create table public.prospect_events (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  prospect_id  uuid not null references public.prospects (id) on delete cascade,
  type         text not null check (type in (
                 'created', 'message_sent', 'reply_received', 'need_identified', 'interest', 'proof_sent',
                 'offer_presented', 'meeting', 'handed_off', 'quote', 'won', 'lost', 'follow_up_sent', 'stage_changed')),
  stage        public.prospect_stage,
  payload      jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 8000),
  created_at   timestamptz not null default now()
);
create index prospect_events_prospect_idx on public.prospect_events (prospect_id, created_at desc);
create index prospect_events_affiliate_idx on public.prospect_events (affiliate_id, type, created_at desc);

alter table public.prospect_events enable row level security;
revoke all on public.prospect_events from anon, authenticated;
grant select, insert on public.prospect_events to authenticated;

create policy prospect_events_read on public.prospect_events for select to authenticated
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
-- An affiliate can only log events on its own (non-deleted) prospects.
create policy prospect_events_insert on public.prospect_events for insert to authenticated
  with check (
    affiliate_id = public.current_affiliate_id()
    and exists (select 1 from public.prospects p
                 where p.id = prospect_id and p.affiliate_id = public.current_affiliate_id() and p.deleted_at is null)
  );

alter table public.sales_content drop constraint if exists sales_content_kind_check;
alter table public.sales_content add constraint sales_content_kind_check check (kind in (
  'playbook', 'call_script', 'message', 'email_template', 'objection', 'knowledge',
  'asset', 'sales_angle', 'page_template', 'page_variant', 'journey',
  'pitch', 'case_study', 'diagnostic', 'sequence',
  'stage_guide', 'reply', 'fact', 'find_source'));
