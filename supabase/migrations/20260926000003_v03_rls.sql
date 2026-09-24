-- =============================================================================
-- STUDIO V0.3 — Row Level Security & grants for the Sales Center
--
--   * sales_content: affiliates (approved or pending review) read ACTIVE rows
--     only; staff read everything and write drafts; status changes only via
--     the audited staff_* functions (enforced by guard_sales_content).
--   * favorites / progress: the owning affiliate only.
--   * sales_events: written by the service role (server actions, tracking);
--     the owning affiliate reads their own rows, staff read all.
--   * private_sales_pages keeps its V0.1 owner policy; guard_sales_page stops
--     an affiliate from touching counters, ownership, indexing or unpublished
--     templates. Prices are never stored on a page.
-- =============================================================================

alter table public.sales_content enable row level security;
alter table public.affiliate_favorites enable row level security;
alter table public.affiliate_progress enable row level security;
alter table public.sales_events enable row level security;

create policy sales_content_read on public.sales_content for select using (
  public.is_staff()
  or (status = 'active' and exists (select 1 from public.affiliates a
        where a.profile_id = auth.uid() and a.deleted_at is null and a.status in ('approved', 'pending'))));
create policy sales_content_staff_insert on public.sales_content for insert with check (public.is_staff());
create policy sales_content_staff_update on public.sales_content for update using (public.is_staff()) with check (public.is_staff());
create policy sales_content_staff_delete on public.sales_content for delete using (public.is_staff() and status = 'draft');

create policy affiliate_favorites_owner on public.affiliate_favorites for all
  using (affiliate_id = public.current_affiliate_id())
  with check (affiliate_id = public.current_affiliate_id());

create policy affiliate_progress_owner on public.affiliate_progress for all
  using (affiliate_id = public.current_affiliate_id())
  with check (affiliate_id = public.current_affiliate_id());

create policy sales_events_read on public.sales_events for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());

-- Staff functions: signed-in callers only (each checks is_staff itself).
revoke execute on function
  public.staff_publish_sales_content(uuid, text),
  public.staff_archive_sales_content(uuid, text),
  public.staff_new_sales_content_version(uuid, text),
  public.admin_sales_center_analytics(timestamptz),
  public.affiliate_performance(uuid, timestamptz)
  from anon, public;

-- Trigger functions are never called directly.
revoke execute on function
  public.guard_sales_content(), public.audit_sales_content(), public.guard_sales_page(),
  public.guard_affiliate_refs(), public.on_lead_share_with_advisor()
  from anon, authenticated, public;
