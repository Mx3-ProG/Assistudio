-- =============================================================================
-- STUDIO — commission engine
--
--   sale.pending   → commission.pending         (ledger: accrual → pending)
--   sale.paid      → commission.in_validation   (ledger: validation)
--   hold elapsed   → commission.available       (ledger: release)   [release_due_commissions]
--   payout paid    → commission.paid            (ledger: payout)
--   refund / chargeback / cancel / unpaid
--                  → commission.reversed        (ledger: reversal, or clawback if already paid)
--
-- A fraud/dispute flag never blocks an account automatically: it puts the
-- related commission `on_hold` until a human decides (Flag → Review → Decision).
-- =============================================================================

create or replace function public.setting(p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select value from public.settings where key = p_key
$$;

create or replace function public.log_audit(
  p_action text, p_entity text, p_entity_id text,
  p_before jsonb default null, p_after jsonb default null, p_reason text default null
) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, before, after, reason)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_before, p_after, p_reason)
$$;

create or replace function public.notify_affiliate(
  p_affiliate_id uuid, p_type public.notification_type, p_title_key text,
  p_params jsonb default '{}'::jsonb, p_href text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid;
  v_notification uuid;
begin
  select profile_id into v_profile from public.affiliates where id = p_affiliate_id;
  if v_profile is null then return; end if;

  insert into public.notifications (profile_id, type, title_key, params, href)
  values (v_profile, p_type, p_title_key, p_params, p_href)
  returning id into v_notification;

  -- Email delivery is queued; a worker (Edge Function / cron route) sends it
  -- through the email abstraction, respecting notification_preferences.
  insert into public.notification_deliveries (notification_id, channel)
  select v_notification, 'email'
  where coalesce((select enabled from public.notification_preferences
                   where profile_id = v_profile and type = p_type and channel = 'email'), true);
end $$;

create or replace function public.ledger_move(
  p_commission public.commissions, p_type public.ledger_entry_type,
  p_from public.ledger_bucket, p_to public.ledger_bucket,
  p_amount bigint, p_note text default null, p_payout uuid default null
) returns void
language sql security definer set search_path = public as $$
  insert into public.commission_ledger
    (commission_id, affiliate_id, payout_id, entry_type, from_bucket, to_bucket, amount_cents, currency, actor_id, note)
  values
    (p_commission.id, p_commission.affiliate_id, p_payout, p_type, p_from, p_to, p_amount, p_commission.currency, auth.uid(), p_note)
$$;

-- -----------------------------------------------------------------------------
-- Sale lifecycle → commission lifecycle
-- -----------------------------------------------------------------------------
create or replace function public.on_sale_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_offer      public.offers;
  v_rate       numeric(5,4);
  v_commission public.commissions;
  v_days       int := coalesce((public.setting('commission.validation_days'))::int, 30);
  v_self_ref   boolean;
begin
  if new.affiliate_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select * into v_offer from public.offers where id = new.offer_id;
    if new.kind = 'renewal' and not v_offer.commission_recurring then
      return new;
    end if;

    select coalesce(a.commission_rate_override, v_offer.commission_rate) into v_rate
      from public.affiliates a where a.id = new.affiliate_id;

    -- Self-referral signal: customer email equals the affiliate's own email.
    select exists (
      select 1 from public.customers c
        join public.affiliates a on a.id = new.affiliate_id
        join public.profiles p on p.id = a.profile_id
       where c.id = new.customer_id and c.email is not null and c.email = p.email
    ) into v_self_ref;

    insert into public.commissions (affiliate_id, sale_id, rate, base_amount_cents, amount_cents, currency, status)
    values (new.affiliate_id, new.id, v_rate, new.gross_amount_cents,
            round(new.gross_amount_cents * v_rate)::bigint, new.currency,
            case when v_self_ref then 'on_hold'::public.commission_status else 'pending' end)
    returning * into v_commission;

    perform public.ledger_move(v_commission, 'accrual', null,
      case when v_self_ref then 'on_hold'::public.ledger_bucket else 'pending' end,
      v_commission.amount_cents);

    if v_self_ref then
      insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
      values ('self_referral', 2, new.affiliate_id, 'sale', new.id::text,
              jsonb_build_object('reason', 'customer_email_matches_affiliate'));
    end if;

    insert into public.activity_events (affiliate_id, type, payload)
    values (new.affiliate_id, case when new.kind = 'renewal' then 'renewal' else 'sale_pending' end,
            jsonb_build_object('sale_ref', new.public_ref, 'amount_cents', v_commission.amount_cents));

    -- A sale can be inserted directly as paid (e.g. webhook replay).
    if new.status = 'pending' then
      return new;
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  select * into v_commission from public.commissions
   where sale_id = new.id and affiliate_id = new.affiliate_id for update;
  if not found then
    return new;
  end if;

  if new.status = 'paid' and v_commission.status in ('pending', 'on_hold') then
    update public.commissions set
      status = case when v_commission.status = 'on_hold' then 'on_hold'::public.commission_status else 'in_validation'::public.commission_status end,
      validated_at = coalesce(new.paid_at, now()),
      hold_until = coalesce(new.paid_at, now()) + make_interval(days => v_days),
      expected_payment_date = (coalesce(new.paid_at, now()) + make_interval(days => v_days + 7))::date
    where id = v_commission.id;
    if v_commission.status = 'pending' then
      perform public.ledger_move(v_commission, 'validation', 'pending', 'in_validation', v_commission.amount_cents);
    end if;
    insert into public.activity_events (affiliate_id, type, payload)
    values (new.affiliate_id, 'payment_confirmed', jsonb_build_object('sale_ref', new.public_ref));
    perform public.notify_affiliate(new.affiliate_id, 'payment', 'notifications.paymentConfirmed',
      jsonb_build_object('sale_ref', new.public_ref, 'amount_cents', v_commission.amount_cents), '/dashboard/commissions');

  elsif new.status in ('refunded', 'chargeback', 'cancelled', 'failed') and v_commission.status <> 'reversed' then
    update public.commissions set
      status = 'reversed', reversed_at = now(), reversal_reason = new.status::text
    where id = v_commission.id;

    if v_commission.status = 'paid' then
      -- Already paid out: carry a negative balance forward (clawback).
      perform public.ledger_move(v_commission, 'clawback', 'paid', 'reversed', -v_commission.amount_cents, new.status::text);
    else
      perform public.ledger_move(v_commission, 'reversal',
        v_commission.status::text::public.ledger_bucket, 'reversed', v_commission.amount_cents, new.status::text);
    end if;

    if new.status = 'chargeback' then
      insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
      values ('commission_dispute', 2, new.affiliate_id, 'sale', new.id::text, jsonb_build_object('reason', 'chargeback'));
    end if;

    perform public.notify_affiliate(new.affiliate_id, 'commission', 'notifications.commissionReversed',
      jsonb_build_object('sale_ref', new.public_ref, 'reason', new.status), '/dashboard/commissions');
  end if;

  return new;
end $$;

create trigger sales_commission_lifecycle
  after insert or update of status on public.sales
  for each row execute function public.on_sale_change();

-- -----------------------------------------------------------------------------
-- Validation window elapsed → available. Schedule with pg_cron (daily) or the
-- /api/cron/commissions route. Idempotent.
-- -----------------------------------------------------------------------------
create or replace function public.release_due_commissions() returns int
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  n int := 0;
begin
  for c in
    select cm.* from public.commissions cm
     where cm.status = 'in_validation' and cm.hold_until <= now()
       and not exists (
         select 1 from public.fraud_flags f
          where f.entity = 'sale' and f.entity_id = cm.sale_id::text and f.status in ('open', 'reviewing'))
     for update skip locked
  loop
    update public.commissions set status = 'available', available_at = now() where id = c.id;
    perform public.ledger_move(c, 'release', 'in_validation', 'available', c.amount_cents);
    insert into public.activity_events (affiliate_id, type, payload)
    values (c.affiliate_id, 'commission_validated', jsonb_build_object('amount_cents', c.amount_cents));
    perform public.notify_affiliate(c.affiliate_id, 'commission', 'notifications.commissionAvailable',
      jsonb_build_object('amount_cents', c.amount_cents), '/dashboard/commissions');
    n := n + 1;
  end loop;
  return n;
end $$;

-- -----------------------------------------------------------------------------
-- Renewals
-- -----------------------------------------------------------------------------
create or replace function public.schedule_renewals(p_horizon_days int default 60) returns int
language sql security definer set search_path = public as $$
  with ins as (
    insert into public.renewals (subscription_id, period_start, period_end, due_at)
    select s.id, s.current_period_end,
           s.current_period_end + case o.billing_interval when 'month' then interval '1 month' else interval '1 year' end,
           s.current_period_end
      from public.subscriptions s join public.offers o on o.id = s.offer_id
     where s.status = 'active' and s.cancel_at is null
       and s.current_period_end <= now() + make_interval(days => p_horizon_days)
    on conflict (subscription_id, period_start) do nothing
    returning 1
  )
  select count(*)::int from ins
$$;

-- Entry point for the payment-provider webhook (service role only).
create or replace function public.record_renewal_payment(
  p_renewal_id uuid, p_provider_payment_id text, p_amount_cents bigint
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  r public.renewals;
  s public.subscriptions;
  v_sale uuid;
begin
  select * into r from public.renewals where id = p_renewal_id for update;
  select * into s from public.subscriptions where id = r.subscription_id for update;

  select id into v_sale from public.sales where provider_payment_id = p_provider_payment_id;
  if v_sale is not null then return v_sale; end if;  -- idempotent replay

  insert into public.sales (subscription_id, customer_id, offer_id, affiliate_id, kind, status,
                            gross_amount_cents, period_start, period_end, provider_payment_id)
  values (s.id, s.customer_id, s.offer_id, s.affiliate_id, 'renewal', 'pending',
          p_amount_cents, r.period_start, r.period_end, p_provider_payment_id)
  returning id into v_sale;
  update public.sales set status = 'paid', paid_at = now() where id = v_sale;

  update public.renewals set status = 'renewed', sale_id = v_sale where id = r.id;
  update public.subscriptions set current_period_start = r.period_start, current_period_end = r.period_end,
         status = 'active' where id = s.id;
  return v_sale;
end $$;

-- -----------------------------------------------------------------------------
-- Staff operations (all audit-logged)
-- -----------------------------------------------------------------------------
create or replace function public.staff_set_affiliate_status(
  p_affiliate_id uuid, p_status public.affiliate_status, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  before_row public.affiliates;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into before_row from public.affiliates where id = p_affiliate_id for update;
  update public.affiliates set
    status = p_status,
    approved_at = case when p_status = 'approved' then coalesce(approved_at, now()) else approved_at end,
    approved_by = case when p_status = 'approved' then auth.uid() else approved_by end,
    suspended_reason = case when p_status = 'suspended' then p_reason end
  where id = p_affiliate_id;
  perform public.log_audit('affiliate.status', 'affiliate', p_affiliate_id::text,
    jsonb_build_object('status', before_row.status), jsonb_build_object('status', p_status), p_reason);
  perform public.notify_affiliate(p_affiliate_id, 'admin_message', 'notifications.accountStatus',
    jsonb_build_object('status', p_status));
end $$;

create or replace function public.staff_set_commission_hold(
  p_commission_id uuid, p_hold boolean, p_reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  v_target public.commission_status;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into c from public.commissions where id = p_commission_id for update;

  if p_hold then
    if c.status not in ('pending', 'in_validation', 'available') then raise exception 'cannot hold %', c.status; end if;
    update public.commissions set status = 'on_hold' where id = c.id;
    perform public.ledger_move(c, 'hold', c.status::text::public.ledger_bucket, 'on_hold', c.amount_cents, p_reason);
  else
    if c.status <> 'on_hold' then raise exception 'not on hold'; end if;
    v_target := case
      when c.validated_at is null then 'pending'
      when c.hold_until > now() then 'in_validation'
      else 'available' end;
    update public.commissions set status = v_target,
      available_at = case when v_target = 'available' then now() else available_at end
    where id = c.id;
    perform public.ledger_move(c, 'unhold', 'on_hold', v_target::text::public.ledger_bucket, c.amount_cents, p_reason);
  end if;

  perform public.log_audit(case when p_hold then 'commission.hold' else 'commission.unhold' end,
    'commission', c.id::text, jsonb_build_object('status', c.status), null, p_reason);
end $$;

create or replace function public.staff_reverse_commission(p_commission_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into c from public.commissions where id = p_commission_id for update;
  if c.status = 'reversed' then return; end if;
  update public.commissions set status = 'reversed', reversed_at = now(), reversal_reason = p_reason where id = c.id;
  if c.status = 'paid' then
    perform public.ledger_move(c, 'clawback', 'paid', 'reversed', -c.amount_cents, p_reason);
  else
    perform public.ledger_move(c, 'reversal', c.status::text::public.ledger_bucket, 'reversed', c.amount_cents, p_reason);
  end if;
  perform public.log_audit('commission.reverse', 'commission', c.id::text,
    jsonb_build_object('status', c.status), jsonb_build_object('status', 'reversed'), p_reason);
end $$;

-- Manual attribution correction: moves a sale (and its unpaid commission) to another affiliate.
create or replace function public.staff_correct_attribution(
  p_sale_id uuid, p_new_affiliate_id uuid, p_reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.sales;
  c public.commissions;
  v_new public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into s from public.sales where id = p_sale_id for update;
  if s.affiliate_id is not distinct from p_new_affiliate_id then return; end if;

  select * into c from public.commissions where sale_id = s.id and affiliate_id = s.affiliate_id for update;
  if found then
    if c.status = 'paid' then raise exception 'commission already paid — use a clawback + adjustment'; end if;
    perform public.staff_reverse_commission(c.id, 'attribution corrected: ' || p_reason);
  end if;

  -- Bypass the insert branch of the trigger by writing the new commission explicitly.
  update public.sales set affiliate_id = p_new_affiliate_id where id = s.id;
  if c.id is not null then
    insert into public.commissions (affiliate_id, sale_id, rate, base_amount_cents, amount_cents, currency, status,
                                    validated_at, hold_until, expected_payment_date)
    values (p_new_affiliate_id, s.id, c.rate, c.base_amount_cents, c.amount_cents, c.currency,
            case when s.status = 'paid' then 'in_validation'::public.commission_status else 'pending' end,
            c.validated_at, c.hold_until, c.expected_payment_date)
    returning * into v_new;
    perform public.ledger_move(v_new, 'adjustment', null, v_new.status::text::public.ledger_bucket, v_new.amount_cents,
      'attribution corrected');
  end if;

  perform public.log_audit('attribution.correct', 'sale', s.id::text,
    jsonb_build_object('affiliate_id', s.affiliate_id), jsonb_build_object('affiliate_id', p_new_affiliate_id), p_reason);
end $$;

-- Create a payout from all available commissions (net of clawbacks).
create or replace function public.staff_create_payout(p_affiliate_id uuid, p_scheduled_for date default current_date)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_total bigint;
  v_clawback bigint;
  v_min bigint := coalesce((public.setting('payout.minimum_cents'))::bigint, 0);
  v_payout uuid;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;

  select coalesce(sum(amount_cents), 0) into v_total from public.commissions
   where affiliate_id = p_affiliate_id and status = 'available' and payout_id is null;
  select coalesce(sum(amount_cents), 0) into v_clawback from public.commission_ledger
   where affiliate_id = p_affiliate_id and entry_type = 'clawback' and payout_id is null;

  if v_total + v_clawback < v_min or v_total + v_clawback <= 0 then
    raise exception 'balance below payout minimum';
  end if;

  insert into public.payouts (affiliate_id, amount_cents, scheduled_for, created_by)
  values (p_affiliate_id, v_total + v_clawback, p_scheduled_for, auth.uid())
  returning id into v_payout;

  update public.commissions set payout_id = v_payout
   where affiliate_id = p_affiliate_id and status = 'available' and payout_id is null;

  perform public.log_audit('payout.create', 'payout', v_payout::text, null,
    jsonb_build_object('amount_cents', v_total + v_clawback, 'clawback_cents', v_clawback), null);
  return v_payout;
end $$;

create or replace function public.staff_mark_payout_paid(p_payout_id uuid, p_provider_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.payouts;
  c public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into p from public.payouts where id = p_payout_id for update;
  if p.status = 'paid' then return; end if;

  update public.payouts set status = 'paid', paid_at = now(), provider_ref = p_provider_ref where id = p.id;
  for c in select * from public.commissions where payout_id = p.id and status = 'available' for update loop
    update public.commissions set status = 'paid', paid_at = now() where id = c.id;
    perform public.ledger_move(c, 'payout', 'available', 'paid', c.amount_cents, null, p.id);
  end loop;

  insert into public.activity_events (affiliate_id, type, payload)
  values (p.affiliate_id, 'commission_paid', jsonb_build_object('amount_cents', p.amount_cents, 'payout_ref', p.public_ref));
  perform public.notify_affiliate(p.affiliate_id, 'payout', 'notifications.payoutPaid',
    jsonb_build_object('amount_cents', p.amount_cents), '/dashboard/payouts');
  perform public.log_audit('payout.paid', 'payout', p.id::text, jsonb_build_object('status', p.status),
    jsonb_build_object('status', 'paid', 'provider_ref', p_provider_ref), null);
end $$;

create or replace function public.staff_review_fraud_flag(
  p_flag_id uuid, p_status public.fraud_status, p_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  f public.fraud_flags;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if p_status = 'open' then raise exception 'invalid decision'; end if;
  select * into f from public.fraud_flags where id = p_flag_id for update;
  update public.fraud_flags set status = p_status, reviewed_by = auth.uid(), reviewed_at = now(), decision_note = p_note
   where id = f.id;
  perform public.log_audit('fraud.review', 'fraud_flag', f.id::text,
    jsonb_build_object('status', f.status), jsonb_build_object('status', p_status), p_note);
end $$;

-- -----------------------------------------------------------------------------
-- Fraud signals on inbound leads
-- -----------------------------------------------------------------------------
create or replace function public.on_lead_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.leads l where l.email = new.email and l.id <> new.id
               and l.created_at > now() - interval '90 days' and l.deleted_at is null) then
    insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
    values ('duplicate_lead', 1, new.affiliate_id, 'lead', new.id::text, '{}'::jsonb);
  end if;

  if new.affiliate_id is not null and exists (
    select 1 from public.affiliates a join public.profiles p on p.id = a.profile_id
     where a.id = new.affiliate_id and p.email = new.email) then
    insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
    values ('self_referral', 2, new.affiliate_id, 'lead', new.id::text, jsonb_build_object('reason', 'lead_email_matches_affiliate'));
  end if;

  if new.affiliate_id is not null then
    insert into public.activity_events (affiliate_id, type, payload)
    values (new.affiliate_id, 'lead', jsonb_build_object('profession', new.profession));
    perform public.notify_affiliate(new.affiliate_id, 'lead', 'notifications.newLead',
      jsonb_build_object('profession', new.profession), '/dashboard');
  end if;
  return new;
end $$;

create trigger leads_after_insert after insert on public.leads
  for each row execute function public.on_lead_insert();

-- -----------------------------------------------------------------------------
-- Read models
-- -----------------------------------------------------------------------------
-- Balance per affiliate. security_invoker → RLS of the caller applies.
create view public.affiliate_balances with (security_invoker = true) as
select
  a.id as affiliate_id,
  coalesce(sum(c.amount_cents) filter (where c.status = 'pending'), 0)        as pending_payment_cents,
  coalesce(sum(c.amount_cents) filter (where c.status in ('in_validation', 'on_hold')), 0) as in_validation_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'available'), 0)
    + coalesce((select sum(l.amount_cents) from public.commission_ledger l
                 where l.affiliate_id = a.id and l.entry_type = 'clawback' and l.payout_id is null), 0)
                                                                              as available_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'paid'), 0)           as paid_cents,
  coalesce(sum(c.amount_cents) filter (where c.status in ('available', 'paid')), 0) as lifetime_earned_cents
from public.affiliates a
left join public.commissions c on c.affiliate_id = a.id
group by a.id;

-- Leads as seen by an affiliate: no direct contact data (the STUDIO team
-- handles inbound leads); company / profession / status only.
create view public.my_leads with (security_barrier = true) as
select l.id, l.affiliate_id, l.link_id, l.campaign_id, l.company, l.profession, l.status,
       l.appointment_at, l.created_at
  from public.leads l
 where l.affiliate_id = public.current_affiliate_id() and l.deleted_at is null;

-- Leaderboard: pseudonyms only, opt-in only, and only when enabled.
create or replace function public.leaderboard(p_since timestamptz default date_trunc('month', now()))
returns table (rank bigint, display_name text, sales bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by count(s.id) desc),
         coalesce(nullif(p.display_name, ''), left(coalesce(p.full_name, 'A'), 1) || '***'),
         count(s.id),
         a.id = public.current_affiliate_id()
    from public.affiliates a
    join public.profiles p on p.id = a.profile_id
    join public.sales s on s.affiliate_id = a.id and s.status = 'paid' and s.paid_at >= p_since
   where coalesce((public.setting('leaderboard.enabled'))::boolean, false)
     and a.status = 'approved' and (p.leaderboard_opt_in or a.id = public.current_affiliate_id())
   group by a.id, p.display_name, p.full_name
   order by 3 desc
   limit 20
$$;
