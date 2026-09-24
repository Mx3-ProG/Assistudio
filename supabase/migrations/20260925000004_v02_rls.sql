-- =============================================================================
-- STUDIO V0.2 — Row Level Security, grants, realtime
--
--   * Every new table has RLS enabled. No policy = no access.
--   * Stripe mirror tables (invoices, payments, refunds, disputes, events),
--     checkout sessions and the email log are staff-read-only; writes happen
--     only through service-role functions called by the verified webhook.
--   * An affiliate reads financial data only through rows where
--     affiliate_id = current_affiliate_id() (sales, commissions, ledger,
--     payouts, subscriptions — V0.1 policies) and the SECURITY DEFINER read
--     models below, which check the caller themselves.
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'commission_rules', 'referral_sessions', 'checkout_sessions', 'invoices', 'payments', 'refunds', 'disputes',
    'stripe_events', 'email_events', 'ledger_settlements'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- commission rules: staff manage; an affiliate reads the rules that apply to them.
create policy commission_rules_read on public.commission_rules for select using (
  public.is_staff()
  or (is_active and public.current_affiliate_id() is not null
      and (affiliate_id is null or affiliate_id = public.current_affiliate_id())));
create policy commission_rules_admin on public.commission_rules for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- attribution sessions: the owning affiliate may read their touches (no personal data).
create policy referral_sessions_read on public.referral_sessions for select
  using (affiliate_id = public.current_affiliate_id() or public.is_staff());

-- Stripe mirror & operations: staff read only.
create policy checkout_sessions_staff_read on public.checkout_sessions for select using (public.is_staff());
create policy invoices_staff_read          on public.invoices          for select using (public.is_staff());
create policy payments_staff_read          on public.payments          for select using (public.is_staff());
create policy refunds_staff_read           on public.refunds           for select using (public.is_staff());
create policy disputes_staff_read          on public.disputes          for select using (public.is_staff());
create policy stripe_events_staff_read     on public.stripe_events     for select using (public.is_staff());
create policy email_events_staff_read      on public.email_events      for select using (public.is_staff());
create policy ledger_settlements_read      on public.ledger_settlements for select using (
  public.is_staff() or exists (select 1 from public.commission_ledger l
                                where l.id = ledger_settlements.ledger_id and l.affiliate_id = public.current_affiliate_id()));

-- Notifications: the owner may only mark as read / archive — never rewrite content.
revoke update on public.notifications from anon, authenticated;
grant update (read_at, archived_at) on public.notifications to authenticated;

-- Views
revoke all on public.prices from anon;
grant select on public.prices to authenticated;
grant select on public.affiliate_balances to authenticated;
revoke all on public.affiliate_balances from anon;

-- -----------------------------------------------------------------------------
-- Function privileges. Supabase grants EXECUTE to anon/authenticated by
-- default: every internal function is revoked explicitly.
-- -----------------------------------------------------------------------------
-- Service role only (webhook, cron, ingestion).
revoke execute on function
  public.affiliate_profile(uuid),
  public.add_activity(uuid, text, jsonb),
  public.queue_email(text, text, uuid, uuid, uuid, text, text, jsonb, text, public.notification_type),
  public.billing_emails_by_studio(),
  public.ledger_write(public.commissions, public.ledger_entry_type, public.ledger_bucket, public.ledger_bucket, bigint, text, uuid),
  public.resolve_commission_rule(uuid, uuid, timestamptz),
  public.evaluate_commission_for(uuid, uuid, uuid, uuid, public.sale_kind, char, bigint, bigint, timestamptz, uuid),
  public.evaluate_commission(uuid),
  public.commission_accrue(public.sales),
  public.commission_reverse(uuid, text, bigint),
  public.commission_set_disputed(uuid, text),
  public.commission_restore(uuid, text),
  public.unsettled_ledger_cents(uuid, char),
  public.stripe_event_claim(text, text, boolean, text, timestamptz, jsonb),
  public.stripe_event_finish(text, public.stripe_event_status, text),
  public.stripe_resolve_offer(text, text),
  public.stripe_upsert_customer(jsonb),
  public.stripe_attach_checkout(uuid, text, text, uuid, text),
  public.apply_subscription_attribution(uuid, public.checkout_sessions),
  public.stripe_checkout_completed(jsonb),
  public.stripe_checkout_expired(jsonb),
  public.stripe_subscription_sync(jsonb),
  public.stripe_upsert_payment(text, text, uuid, uuid, bigint, char, timestamptz, boolean),
  public.stripe_invoice_paid(jsonb),
  public.stripe_invoice_payment_failed(jsonb),
  public.find_payment(text, text),
  public.stripe_refund_sync(jsonb),
  public.stripe_dispute_sync(jsonb),
  public.stripe_connect_account_sync(jsonb),
  public.record_referral_touch(jsonb),
  public.resolve_attribution(uuid, timestamptz),
  public.project_next_commission(uuid),
  public.email_claim_batch(int, uuid[]),
  public.email_mark(uuid, public.email_status, text, text, text),
  public.on_lead_appointment(public.leads)
  from anon, authenticated, public;

-- Callable by signed-in users; the function checks the caller itself.
revoke execute on function
  public.affiliate_recurring_book(uuid),
  public.admin_finance_summary(timestamptz, timestamptz, uuid, uuid, text, text, uuid, char),
  public.staff_validate_commission(uuid, text),
  public.staff_ledger_adjustment(uuid, bigint, char, text)
  from anon, public;

-- -----------------------------------------------------------------------------
-- Realtime: only the two tables whose live updates change what the affiliate
-- sees right now (activity feed, notification badge). RLS applies.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'activity_events') then
      alter publication supabase_realtime add table public.activity_events;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;
