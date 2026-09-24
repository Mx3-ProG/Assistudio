-- =============================================================================
-- STUDIO — Row Level Security
--
-- Principles
--   * RLS is enabled on EVERY table. No policy = no access.
--   * An affiliate only ever sees rows where affiliate_id = current_affiliate_id().
--   * Financial tables are read-only for affiliates; writes happen through
--     SECURITY DEFINER functions or the service role (payment webhooks).
--   * Staff (admin / super_admin) have operational read access and write
--     through audited functions.
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'settings','profiles','affiliates','products','offers','markets','campaigns','affiliate_links',
    'visitors','clicks','leads','prospects','customers','subscriptions','sales','renewals',
    'payouts','commissions','commission_ledger','goals','notifications','notification_deliveries',
    'notification_preferences','activity_events','sales_assets','private_sales_pages','translations',
    'audit_logs','fraud_flags','privacy_requests'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- settings -------------------------------------------------------------------
create policy settings_public_read on public.settings for select using (is_public or public.is_staff());
create policy settings_staff_write on public.settings for update using (public.is_super_admin()) with check (public.is_super_admin());

-- profiles -------------------------------------------------------------------
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid() or public.is_staff()) with check (id = auth.uid() or public.is_staff());

-- affiliates -----------------------------------------------------------------
create policy affiliates_self_read on public.affiliates for select
  using (profile_id = auth.uid() or public.is_staff());
-- Self-service fields only (slug, goal, onboarding…); protected fields are
-- enforced by the guard_affiliate_fields trigger.
create policy affiliates_self_update on public.affiliates for update
  using (profile_id = auth.uid() or public.is_staff()) with check (profile_id = auth.uid() or public.is_staff());

-- public catalog & content ------------------------------------------------------
create policy products_read on public.products for select using ((is_active and deleted_at is null) or public.is_staff());
create policy products_staff on public.products for all using (public.is_staff()) with check (public.is_staff());
create policy offers_read on public.offers for select using (is_active or public.is_staff());
create policy offers_staff on public.offers for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy markets_read on public.markets for select using (is_active or public.is_staff());
create policy markets_staff on public.markets for all using (public.is_staff()) with check (public.is_staff());
create policy translations_read on public.translations for select using (true);
create policy translations_staff on public.translations for all using (public.is_staff()) with check (public.is_staff());
-- Sales kit is for approved affiliates only.
create policy sales_assets_read on public.sales_assets for select using (
  (is_active and exists (select 1 from public.affiliates a where a.profile_id = auth.uid() and a.status = 'approved'))
  or public.is_staff());
create policy sales_assets_staff on public.sales_assets for all using (public.is_staff()) with check (public.is_staff());

-- affiliate-owned resources ------------------------------------------------------
create policy campaigns_owner on public.campaigns for all
  using (affiliate_id = public.current_affiliate_id() or public.is_staff())
  with check (affiliate_id = public.current_affiliate_id() or public.is_staff());

create policy affiliate_links_owner on public.affiliate_links for all
  using (affiliate_id = public.current_affiliate_id() or public.is_staff())
  with check (affiliate_id = public.current_affiliate_id() or public.is_staff());

create policy prospects_owner on public.prospects for all
  using (affiliate_id = public.current_affiliate_id() or public.is_staff())
  with check (affiliate_id = public.current_affiliate_id());

create policy private_pages_owner on public.private_sales_pages for all
  using (affiliate_id = public.current_affiliate_id() or public.is_staff())
  with check (affiliate_id = public.current_affiliate_id() or public.is_staff());

create policy goals_owner on public.goals for all
  using (affiliate_id = public.current_affiliate_id())
  with check (affiliate_id = public.current_affiliate_id());

-- tracking (writes via service role only) -----------------------------------------
create policy clicks_owner_read on public.clicks for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy visitors_staff_read on public.visitors for select using (public.is_staff());
create policy activity_owner_read on public.activity_events for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());

-- leads: staff only; affiliates use the my_leads view (no contact data) ---------------
create policy leads_staff on public.leads for all using (public.is_staff()) with check (public.is_staff());

-- commerce (read-only for the owning affiliate) --------------------------------------
create policy customers_staff on public.customers for all using (public.is_staff()) with check (public.is_staff());
create policy subscriptions_read on public.subscriptions for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy sales_read on public.sales for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy renewals_read on public.renewals for select using (
  public.is_staff() or exists (select 1 from public.subscriptions s
    where s.id = renewals.subscription_id and s.affiliate_id = public.current_affiliate_id()));
create policy commissions_read on public.commissions for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy ledger_read on public.commission_ledger for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());
create policy payouts_read on public.payouts for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());

-- notifications ------------------------------------------------------------------
create policy notifications_owner_read on public.notifications for select using (profile_id = auth.uid());
create policy notifications_owner_mark_read on public.notifications for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy notification_prefs_owner on public.notification_preferences for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy notification_deliveries_staff on public.notification_deliveries for select using (public.is_staff());

-- governance -----------------------------------------------------------------------
create policy audit_logs_staff_read on public.audit_logs for select using (public.is_staff());
create policy fraud_flags_staff_read on public.fraud_flags for select using (public.is_staff());
create policy privacy_requests_owner on public.privacy_requests for select
  using (profile_id = auth.uid() or public.is_staff());
create policy privacy_requests_owner_insert on public.privacy_requests for insert
  with check (profile_id = auth.uid());

-- Customer identity exposed to the owning affiliate: company + public ref only.
create view public.my_customers with (security_barrier = true) as
select c.id, c.public_ref, c.company_name, c.country
  from public.customers c
 where exists (select 1 from public.subscriptions s
                where s.customer_id = c.id and s.affiliate_id = public.current_affiliate_id());

revoke all on public.my_leads, public.my_customers from anon;
grant select on public.my_leads, public.my_customers, public.affiliate_balances to authenticated;

-- Staff-only functions must not be callable anonymously.
revoke execute on function
  public.staff_set_affiliate_status(uuid, public.affiliate_status, text),
  public.staff_set_commission_hold(uuid, boolean, text),
  public.staff_reverse_commission(uuid, text),
  public.staff_correct_attribution(uuid, uuid, text),
  public.staff_create_payout(uuid, date),
  public.staff_mark_payout_paid(uuid, text),
  public.staff_review_fraud_flag(uuid, public.fraud_status, text)
  from anon, public;
revoke execute on function
  public.release_due_commissions(), public.schedule_renewals(int),
  public.record_renewal_payment(uuid, text, bigint),
  public.ledger_move(public.commissions, public.ledger_entry_type, public.ledger_bucket, public.ledger_bucket, bigint, text, uuid),
  public.notify_affiliate(uuid, public.notification_type, text, jsonb, text),
  public.log_audit(text, text, text, jsonb, jsonb, text)
  from anon, authenticated, public;
