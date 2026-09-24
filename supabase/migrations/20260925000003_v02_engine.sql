-- =============================================================================
-- STUDIO V0.2 — financial engine
--
--   Stripe webhook (signed, verified in the app)
--     → stripe_event_claim()               exactly-once claim of the event
--     → stripe_*() domain function          ONE transaction per financial fact
--         customer → subscription → invoice → payment → sale (unique per invoice)
--         → trigger on_sale_change → commission_accrue() → evaluate_commission()
--         → commission (pending) + ledger + activity + notification + email outbox
--     → stripe_event_finish()
--
-- Idempotency is layered: stripe_events.stripe_event_id UNIQUE, then a unique
-- business key per object (invoice → sale, sale → commission, refund id,
-- dispute id), then advisory locks per Stripe object against concurrent
-- deliveries of different events about the same object.
--
-- A commission only exists once its payment is confirmed. Renewal commissions
-- are created by the renewal payment itself — never projected in advance.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Small helpers
-- -----------------------------------------------------------------------------
create or replace function public.affiliate_profile(p_affiliate_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select profile_id from public.affiliates where id = p_affiliate_id
$$;

create or replace function public.add_activity(p_affiliate_id uuid, p_type text, p_payload jsonb default '{}'::jsonb)
returns void
language sql security definer set search_path = public as $$
  insert into public.activity_events (affiliate_id, type, payload)
  select p_affiliate_id, p_type, coalesce(p_payload, '{}'::jsonb) where p_affiliate_id is not null
$$;

-- In-app notification only. Emails go through the email outbox (queue_email).
create or replace function public.notify_affiliate(
  p_affiliate_id uuid, p_type public.notification_type, p_title_key text,
  p_params jsonb default '{}'::jsonb, p_href text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid := public.affiliate_profile(p_affiliate_id);
begin
  if v_profile is null then return; end if;
  insert into public.notifications (profile_id, type, title_key, params, href)
  values (v_profile, p_type, p_title_key, coalesce(p_params, '{}'::jsonb), p_href);
end $$;

-- Transactional outbox: the email is committed together with the financial
-- fact it describes, and sent after commit by the EmailService (webhook fast
-- path + cron retry). The idempotency key guarantees one email per fact.
create or replace function public.queue_email(
  p_template text, p_recipient_type text,
  p_profile_id uuid, p_customer_id uuid, p_lead_id uuid,
  p_entity text, p_entity_id text, p_params jsonb, p_key text,
  p_pref_type public.notification_type default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_profile_id is null and p_customer_id is null and p_lead_id is null then return; end if;
  if p_pref_type is not null and p_profile_id is not null and not coalesce((
      select enabled from public.notification_preferences
       where profile_id = p_profile_id and type = p_pref_type and channel = 'email'), true) then
    return;
  end if;
  insert into public.email_events (idempotency_key, template, recipient_type, recipient_profile_id,
                                   recipient_customer_id, recipient_lead_id, related_entity, related_id, params)
  values (p_key, p_template, p_recipient_type, p_profile_id, p_customer_id, p_lead_id, p_entity, p_entity_id,
          coalesce(p_params, '{}'::jsonb))
  on conflict (idempotency_key) do nothing;
end $$;

create or replace function public.billing_emails_by_studio() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.setting('emails.customer_billing_owner') #>> '{}', 'stripe') = 'studio'
$$;

create or replace function public.ledger_write(
  p_commission public.commissions, p_type public.ledger_entry_type,
  p_from public.ledger_bucket, p_to public.ledger_bucket,
  p_amount bigint, p_note text default null, p_payout uuid default null
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_sale public.sales;
  v_id bigint;
begin
  select * into v_sale from public.sales where id = p_commission.sale_id;
  insert into public.commission_ledger
    (commission_id, affiliate_id, payout_id, entry_type, from_bucket, to_bucket, amount_cents, currency, actor_id, note,
     sale_id, invoice_id, subscription_id, product_id, rule_id, gross_amount_cents, commission_rate)
  values
    (p_commission.id, p_commission.affiliate_id, p_payout, p_type, p_from, p_to, p_amount, p_commission.currency,
     auth.uid(), p_note, v_sale.id, v_sale.invoice_id, v_sale.subscription_id,
     (select product_id from public.offers where id = v_sale.offer_id), p_commission.rule_id,
     p_commission.base_amount_cents, p_commission.rate)
  returning id into v_id;
  return v_id;
end $$;

-- V0.1 signature kept for compatibility; forwards to ledger_write.
create or replace function public.ledger_move(
  p_commission public.commissions, p_type public.ledger_entry_type,
  p_from public.ledger_bucket, p_to public.ledger_bucket,
  p_amount bigint, p_note text default null, p_payout uuid default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.ledger_write(p_commission, p_type, p_from, p_to, p_amount, p_note, p_payout);
end $$;

-- -----------------------------------------------------------------------------
-- Commission engine
-- -----------------------------------------------------------------------------
create or replace function public.resolve_commission_rule(p_affiliate_id uuid, p_offer_id uuid, p_at timestamptz)
returns public.commission_rules
language sql stable security definer set search_path = public as $$
  select r.*
    from public.commission_rules r
    join public.offers o on o.id = p_offer_id
   where r.is_active
     and r.valid_from <= p_at and (r.valid_to is null or r.valid_to > p_at)
     and (r.product_id is null or r.product_id = o.product_id)
     and (r.offer_id is null or r.offer_id = p_offer_id)
     and (r.affiliate_id is null or r.affiliate_id = p_affiliate_id)
   order by (r.affiliate_id is not null) desc, (r.offer_id is not null) desc, (r.product_id is not null) desc,
            r.priority desc, r.created_at desc
   limit 1
$$;

create type public.commission_evaluation as (
  eligible        boolean,
  reason          text,        -- why not eligible (null when eligible)
  rule_id         uuid,
  rate            numeric(5,4),
  base_cents      bigint,
  amount_cents    bigint,
  validation_days int,
  needs_review    boolean,     -- eligible but must be `disputed` until a human decides
  review_reason   text
);

-- Pure decision: no writes. Mirrored by src/lib/commission-engine.ts (tested).
create or replace function public.evaluate_commission_for(
  p_affiliate_id uuid, p_offer_id uuid, p_customer_id uuid, p_subscription_id uuid,
  p_kind public.sale_kind, p_currency char(3), p_gross_cents bigint, p_net_cents bigint,
  p_at timestamptz, p_exclude_sale_id uuid default null
) returns public.commission_evaluation
language plpgsql stable security definer set search_path = public as $$
declare
  e public.commission_evaluation;
  a public.affiliates;
  o public.offers;
  r public.commission_rules;
  v_type public.commission_type;
  v_rate numeric(5,4);
  v_fixed bigint;
  v_fixed_currency char(3);
  v_new boolean;
  v_renewals boolean;
  v_duration int;
  v_max int;
  v_validation int;
  v_base_kind text;
  v_started timestamptz;
  v_prior int;
begin
  e.eligible := false;
  e.needs_review := false;
  if p_affiliate_id is null then e.reason := 'no_affiliate'; return e; end if;
  select * into a from public.affiliates where id = p_affiliate_id;
  if not found or a.deleted_at is not null then e.reason := 'affiliate_not_found'; return e; end if;
  if p_kind not in ('new', 'renewal') then e.reason := 'billing_reason_requires_review'; return e; end if;

  select * into o from public.offers where id = p_offer_id;
  r := public.resolve_commission_rule(p_affiliate_id, p_offer_id, p_at);
  if r.id is not null then
    v_type := r.commission_type; v_rate := r.rate; v_fixed := r.fixed_amount_cents; v_fixed_currency := r.currency;
    v_new := r.applies_to_new; v_renewals := r.applies_to_renewals; v_duration := r.duration_months;
    v_max := r.max_payments; v_validation := r.validation_days; v_base_kind := r.base;
    e.rule_id := r.id;
  else
    -- No rule configured: fall back to the V0.1 offer fields.
    v_type := 'percentage'; v_rate := o.commission_rate; v_new := true; v_renewals := o.commission_recurring;
    v_base_kind := 'net_excluding_tax';
  end if;

  if p_kind = 'new' and not v_new then e.reason := 'rule_excludes_new'; return e; end if;
  if p_kind = 'renewal' and not v_renewals then e.reason := 'rule_excludes_renewals'; return e; end if;

  if p_subscription_id is not null and (v_duration is not null or v_max is not null) then
    select started_at into v_started from public.subscriptions where id = p_subscription_id;
    if v_duration is not null and p_at >= v_started + make_interval(months => v_duration) then
      e.reason := 'rule_duration_elapsed'; return e;
    end if;
    if v_max is not null then
      select count(*) into v_prior
        from public.commissions c join public.sales s on s.id = c.sale_id
       where s.subscription_id = p_subscription_id and c.affiliate_id = p_affiliate_id
         and c.status <> 'reversed' and (p_exclude_sale_id is null or s.id <> p_exclude_sale_id);
      if v_prior >= v_max then e.reason := 'rule_max_payments_reached'; return e; end if;
    end if;
  end if;

  e.base_cents := case when v_base_kind = 'net_excluding_tax' then coalesce(p_net_cents, p_gross_cents) else p_gross_cents end;

  if v_type = 'percentage' then
    e.rate := coalesce(a.commission_rate_override, v_rate);
    e.amount_cents := round(e.base_cents * e.rate)::bigint;   -- numeric: exact, half away from zero
  else
    if v_fixed_currency is distinct from p_currency then e.reason := 'currency_mismatch'; return e; end if;
    e.amount_cents := least(v_fixed, e.base_cents);
    e.rate := case when e.base_cents > 0 then least(round(e.amount_cents::numeric / e.base_cents, 4), 1) else 0 end;
  end if;

  if e.amount_cents <= 0 then e.reason := 'zero_amount'; return e; end if;

  e.validation_days := coalesce(v_validation, (public.setting('commission.validation_days'))::int, 30);
  e.eligible := true;

  if a.status <> 'approved' then
    e.needs_review := true; e.review_reason := 'affiliate_' || a.status::text;
  elsif exists (
    select 1 from public.customers c join public.profiles p on p.id = a.profile_id
     where c.id = p_customer_id and c.email is not null and c.email = p.email) then
    e.needs_review := true; e.review_reason := 'self_referral';
  end if;
  return e;
end $$;

create or replace function public.evaluate_commission(p_sale_id uuid) returns public.commission_evaluation
language sql stable security definer set search_path = public as $$
  select public.evaluate_commission_for(s.affiliate_id, s.offer_id, s.customer_id, s.subscription_id, s.kind,
           s.currency, s.gross_amount_cents, s.net_amount_cents, coalesce(s.paid_at, now()), s.id)
    from public.sales s where s.id = p_sale_id
$$;

-- Creates the commission for a paid sale (idempotent: unique (sale_id, affiliate_id)).
create or replace function public.commission_accrue(p_sale public.sales) returns public.commissions
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  e public.commission_evaluation;
  v_paid_at timestamptz := coalesce(p_sale.paid_at, now());
  v_status public.commission_status;
  v_profile uuid := public.affiliate_profile(p_sale.affiliate_id);
  v_params jsonb;
begin
  select * into c from public.commissions
   where sale_id = p_sale.id and affiliate_id = p_sale.affiliate_id for update;
  if found then
    -- V0.1 manual sale: the commission existed before payment → start validation now.
    if c.status = 'awaiting_payment' then
      e := public.evaluate_commission(p_sale.id);
      update public.commissions set status = 'pending', validated_at = v_paid_at,
             hold_until = v_paid_at + make_interval(days => coalesce(e.validation_days, 30)),
             expected_payment_date = (v_paid_at + make_interval(days => coalesce(e.validation_days, 30) + 7))::date
       where id = c.id returning * into c;
      perform public.ledger_write(c, 'validation', 'awaiting_payment', 'pending', c.amount_cents);
    end if;
    return c;
  end if;

  e := public.evaluate_commission(p_sale.id);
  if not e.eligible then
    perform public.log_audit('commission.not_eligible', 'sale', p_sale.id::text, null,
      jsonb_build_object('reason', e.reason, 'affiliate_id', p_sale.affiliate_id), null);
    return null;
  end if;

  v_status := case when e.needs_review then 'disputed' else 'pending' end;
  insert into public.commissions (affiliate_id, sale_id, rule_id, kind, rate, base_amount_cents, amount_cents, currency,
                                  status, validated_at, hold_until, expected_payment_date, dispute_reason)
  values (p_sale.affiliate_id, p_sale.id, e.rule_id, p_sale.kind, e.rate, e.base_cents, e.amount_cents, p_sale.currency,
          v_status, v_paid_at, v_paid_at + make_interval(days => e.validation_days),
          (v_paid_at + make_interval(days => e.validation_days + 7))::date, e.review_reason)
  on conflict (sale_id, affiliate_id) do nothing
  returning * into c;
  if c.id is null then  -- concurrent insert won the race
    select * into c from public.commissions where sale_id = p_sale.id and affiliate_id = p_sale.affiliate_id;
    return c;
  end if;

  perform public.ledger_write(c, (case when p_sale.kind = 'renewal' then 'renewal_commission' else 'commission' end)::public.ledger_entry_type,
                              null, v_status::text::public.ledger_bucket, c.amount_cents);

  if e.needs_review then
    insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
    values (case when e.review_reason = 'self_referral' then 'self_referral' else 'manual_review' end::public.fraud_flag_type,
            2, p_sale.affiliate_id, 'sale', p_sale.id::text, jsonb_build_object('reason', e.review_reason));
  end if;

  v_params := jsonb_build_object('sale_ref', p_sale.public_ref, 'gross_cents', p_sale.gross_amount_cents,
    'commission_cents', c.amount_cents, 'currency', c.currency, 'kind', p_sale.kind,
    'available_on', c.hold_until::date, 'status', c.status);

  perform public.add_activity(p_sale.affiliate_id,
    case when p_sale.kind = 'renewal' then 'renewal_confirmed' else 'payment_confirmed' end, v_params);
  perform public.add_activity(p_sale.affiliate_id,
    case when e.needs_review then 'commission_disputed' else 'commission_pending' end, v_params);
  perform public.notify_affiliate(p_sale.affiliate_id,
    case when p_sale.kind = 'renewal' then 'renewal' else 'sale' end::public.notification_type,
    case when p_sale.kind = 'renewal' then 'notifications.renewalPending' else 'notifications.salePending' end,
    v_params, '/dashboard/commissions');
  perform public.queue_email(
    case when p_sale.kind = 'renewal' then 'affiliate.renewal' else 'affiliate.sale_detected' end,
    'affiliate', v_profile, null, null, 'sale', p_sale.id::text, v_params,
    'affiliate.sale:' || p_sale.id, case when p_sale.kind = 'renewal' then 'renewal' else 'sale' end::public.notification_type);
  return c;
end $$;

-- Full (p_amount null) or partial reversal. Never deletes history.
--   awaiting_payment / pending / disputed / available → `reversal` entry (compensating)
--   paid → `clawback` entry (negative, recovered from future payouts)
create or replace function public.commission_reverse(p_commission_id uuid, p_reason text, p_amount bigint default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  v_delta bigint;
  v_full boolean;
begin
  select * into c from public.commissions where id = p_commission_id for update;
  if not found or c.status = 'reversed' then return; end if;
  v_delta := least(coalesce(p_amount, c.amount_cents), c.amount_cents);
  if v_delta <= 0 then return; end if;
  v_full := v_delta = c.amount_cents;

  if c.status = 'paid' then
    perform public.ledger_write(c, 'clawback', 'paid', 'reversed', -v_delta, p_reason);
    update public.commissions set recovery_status = 'required',
           status = case when v_full then 'reversed'::public.commission_status else status end,
           reversed_at = case when v_full then now() else reversed_at end,
           reversal_reason = p_reason
     where id = c.id;
  else
    perform public.ledger_write(c, 'reversal', c.status::text::public.ledger_bucket, 'reversed', v_delta, p_reason);
    if v_full then
      update public.commissions set status = 'reversed', reversed_at = now(), reversal_reason = p_reason where id = c.id;
    else
      update public.commissions set amount_cents = amount_cents - v_delta, reversal_reason = p_reason where id = c.id;
    end if;
  end if;

  perform public.add_activity(c.affiliate_id, 'commission_reversed',
    jsonb_build_object('commission_cents', v_delta, 'currency', c.currency, 'reason', p_reason, 'recovery', c.status = 'paid'));
  perform public.notify_affiliate(c.affiliate_id, 'commission', 'notifications.commissionReversed',
    jsonb_build_object('sale_ref', (select public_ref from public.sales where id = c.sale_id),
                       'commission_cents', v_delta, 'currency', c.currency, 'reason', p_reason), '/dashboard/commissions');
end $$;

create or replace function public.commission_set_disputed(p_commission_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
begin
  select * into c from public.commissions where id = p_commission_id for update;
  if not found then return; end if;
  if c.status in ('awaiting_payment', 'pending', 'available') then
    update public.commissions set status = 'disputed', dispute_reason = p_reason where id = c.id;
    perform public.ledger_write(c, 'hold', c.status::text::public.ledger_bucket, 'disputed', c.amount_cents, p_reason);
  elsif c.status = 'paid' then
    -- Money already paid out: keep history, flag for a human decision.
    update public.commissions set dispute_reason = p_reason where id = c.id;
  else
    return;
  end if;
  perform public.add_activity(c.affiliate_id, 'commission_disputed',
    jsonb_build_object('commission_cents', c.amount_cents, 'currency', c.currency, 'reason', p_reason));
  perform public.notify_affiliate(c.affiliate_id, 'dispute', 'notifications.commissionDisputed',
    jsonb_build_object('commission_cents', c.amount_cents, 'currency', c.currency, 'reason', p_reason), '/dashboard/commissions');
end $$;

create or replace function public.commission_restore(p_commission_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  v_target public.commission_status;
begin
  select * into c from public.commissions where id = p_commission_id for update;
  if not found then return; end if;
  if c.status <> 'disputed' then
    if c.status = 'paid' then update public.commissions set dispute_reason = null where id = c.id; end if;
    return;
  end if;
  v_target := case
    when c.validated_at is null then 'awaiting_payment'
    when c.hold_until > now() then 'pending'
    else 'available' end;
  update public.commissions set status = v_target, dispute_reason = null,
         available_at = case when v_target = 'available' then now() else available_at end
   where id = c.id;
  perform public.ledger_write(c, 'unhold', 'disputed', v_target::text::public.ledger_bucket, c.amount_cents, p_reason);
end $$;

-- -----------------------------------------------------------------------------
-- Sale lifecycle → commission lifecycle (replaces the V0.1 trigger function)
-- -----------------------------------------------------------------------------
create or replace function public.on_sale_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
begin
  if new.affiliate_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;

  select * into c from public.commissions where sale_id = new.id and affiliate_id = new.affiliate_id;

  if new.status = 'paid' then
    if c.id is not null and c.status = 'disputed' and tg_op = 'UPDATE' and old.status = 'disputed' then
      perform public.commission_restore(c.id, 'payment dispute closed in favour of STUDIO');
    elsif c.id is null or c.status = 'awaiting_payment' then
      perform public.commission_accrue(new);
    end if;
  elsif new.status = 'disputed' then
    if c.id is not null then perform public.commission_set_disputed(c.id, 'payment_dispute'); end if;
  elsif new.status in ('refunded', 'chargeback', 'cancelled', 'failed') then
    if c.id is not null then perform public.commission_reverse(c.id, new.status::text); end if;
    if new.status = 'chargeback' then
      insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
      values ('commission_dispute', 2, new.affiliate_id, 'sale', new.id::text, jsonb_build_object('reason', 'chargeback'));
    end if;
  end if;
  return new;
end $$;

-- Manual (V0.1) sales only: Stripe sales get their subscription from Stripe.
create or replace function public.ensure_subscription_on_paid() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_sub uuid;
  o public.offers;
begin
  if new.invoice_id is not null then return new; end if;
  if new.status = 'paid' and new.kind = 'new' and new.subscription_id is null then
    select * into o from public.offers where id = new.offer_id;
    if o.billing_interval = 'one_time' then return new; end if;
    insert into public.subscriptions (customer_id, offer_id, affiliate_id, status, started_at, current_period_start,
                                      current_period_end, attribution_source, attributed_at, lead_id, link_id, campaign_id)
    values (new.customer_id, new.offer_id, new.affiliate_id, 'active', coalesce(new.paid_at, now()), coalesce(new.paid_at, now()),
            coalesce(new.paid_at, now()) + case o.billing_interval when 'month' then interval '1 month' else interval '1 year' end
              * o.interval_count,
            case when new.affiliate_id is null then 'none' else 'staff' end, now(), new.lead_id, new.link_id, new.campaign_id)
    returning id into v_sub;
    update public.sales set subscription_id = v_sub where id = new.id;
  elsif new.status in ('refunded', 'chargeback', 'cancelled') and new.subscription_id is not null and new.kind = 'new' then
    update public.subscriptions set status = 'cancelled', cancelled_at = now() where id = new.subscription_id;
    perform public.add_activity(new.affiliate_id, 'customer_lost', '{}'::jsonb);
  end if;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Validation period elapsed → available (daily cron). Idempotent.
-- -----------------------------------------------------------------------------
create or replace function public.release_due_commissions() returns int
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  n int := 0;
  v_params jsonb;
begin
  for c in
    select cm.* from public.commissions cm
     where cm.status = 'pending' and cm.hold_until <= now()
       and not exists (
         select 1 from public.fraud_flags f
          where f.entity = 'sale' and f.entity_id = cm.sale_id::text and f.status in ('open', 'reviewing'))
     for update skip locked
  loop
    update public.commissions set status = 'available', available_at = now() where id = c.id;
    perform public.ledger_write(c, 'release', 'pending', 'available', c.amount_cents);
    v_params := jsonb_build_object('commission_cents', c.amount_cents, 'currency', c.currency,
      'sale_ref', (select public_ref from public.sales where id = c.sale_id));
    perform public.add_activity(c.affiliate_id, 'commission_available', v_params);
    perform public.notify_affiliate(c.affiliate_id, 'commission', 'notifications.commissionAvailable', v_params, '/dashboard/commissions');
    perform public.queue_email('affiliate.commission_available', 'affiliate', public.affiliate_profile(c.affiliate_id),
      null, null, 'commission', c.id::text, v_params, 'affiliate.commission_available:' || c.id, 'commission');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Upcoming renewals of active, non-cancelling subscriptions (display only —
-- a renewal only becomes revenue when Stripe confirms its payment).
create or replace function public.schedule_renewals(p_horizon_days int default 60) returns int
language sql security definer set search_path = public as $$
  with ins as (
    insert into public.renewals (subscription_id, period_start, period_end, due_at)
    select s.id, s.current_period_end,
           s.current_period_end + case o.billing_interval when 'month' then interval '1 month' else interval '1 year' end
             * o.interval_count,
           s.current_period_end
      from public.subscriptions s join public.offers o on o.id = s.offer_id
     where s.status = 'active' and s.cancel_at is null and not s.cancel_at_period_end
       and o.billing_interval <> 'one_time'
       and s.current_period_end <= now() + make_interval(days => p_horizon_days)
    on conflict (subscription_id, period_start) do nothing
    returning 1
  )
  select count(*)::int from ins
$$;

-- -----------------------------------------------------------------------------
-- Staff operations (audited). V0.1 signatures preserved.
-- -----------------------------------------------------------------------------
create or replace function public.staff_set_commission_hold(p_commission_id uuid, p_hold boolean, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  after_row public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into c from public.commissions where id = p_commission_id for update;
  if not found then raise exception 'commission not found'; end if;
  if p_hold then
    if c.status not in ('awaiting_payment', 'pending', 'available') then raise exception 'cannot dispute a % commission', c.status; end if;
    perform public.commission_set_disputed(c.id, p_reason);
  else
    if c.status <> 'disputed' then raise exception 'commission is not disputed'; end if;
    perform public.commission_restore(c.id, p_reason);
  end if;
  select * into after_row from public.commissions where id = c.id;
  perform public.log_audit(case when p_hold then 'commission.dispute' else 'commission.undispute' end,
    'commission', c.id::text, jsonb_build_object('status', c.status), jsonb_build_object('status', after_row.status), p_reason);
end $$;

create or replace function public.staff_reverse_commission(p_commission_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into c from public.commissions where id = p_commission_id for update;
  if not found then raise exception 'commission not found'; end if;
  if c.status = 'reversed' then return; end if;
  perform public.commission_reverse(c.id, p_reason);
  perform public.log_audit('commission.reverse', 'commission', c.id::text,
    jsonb_build_object('status', c.status, 'amount_cents', c.amount_cents), jsonb_build_object('status', 'reversed'), p_reason);
end $$;

-- Early validation (e.g. contract signed with no refund right). Audited.
create or replace function public.staff_validate_commission(p_commission_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into c from public.commissions where id = p_commission_id for update;
  if not found then raise exception 'commission not found'; end if;
  if c.status <> 'pending' then raise exception 'only a pending commission can be validated (status: %)', c.status; end if;
  update public.commissions set status = 'available', available_at = now() where id = c.id;
  perform public.ledger_write(c, 'release', 'pending', 'available', c.amount_cents, p_reason);
  perform public.add_activity(c.affiliate_id, 'commission_available',
    jsonb_build_object('commission_cents', c.amount_cents, 'currency', c.currency));
  perform public.notify_affiliate(c.affiliate_id, 'commission', 'notifications.commissionAvailable',
    jsonb_build_object('commission_cents', c.amount_cents, 'currency', c.currency), '/dashboard/commissions');
  perform public.queue_email('affiliate.commission_available', 'affiliate', public.affiliate_profile(c.affiliate_id),
    null, null, 'commission', c.id::text, jsonb_build_object('commission_cents', c.amount_cents, 'currency', c.currency),
    'affiliate.commission_available:' || c.id, 'commission');
  perform public.log_audit('commission.validate', 'commission', c.id::text,
    jsonb_build_object('status', c.status), jsonb_build_object('status', 'available'), p_reason);
end $$;

-- Manual adjustment (bonus, correction, write-off). Positive or negative,
-- immediately part of the available balance, always with a reason. Audited.
create or replace function public.staff_ledger_adjustment(
  p_affiliate_id uuid, p_amount_cents bigint, p_currency char(3), p_reason text
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  if p_amount_cents = 0 then raise exception 'amount must not be zero'; end if;
  if not exists (select 1 from public.affiliates where id = p_affiliate_id) then raise exception 'affiliate not found'; end if;
  insert into public.commission_ledger (affiliate_id, entry_type, from_bucket, to_bucket, amount_cents, currency, actor_id, note)
  values (p_affiliate_id, 'adjustment', null, 'available', p_amount_cents, upper(p_currency), auth.uid(), p_reason)
  returning id into v_id;
  perform public.log_audit('ledger.adjustment', 'affiliate', p_affiliate_id::text, null,
    jsonb_build_object('ledger_id', v_id, 'amount_cents', p_amount_cents, 'currency', upper(p_currency)), p_reason);
  perform public.notify_affiliate(p_affiliate_id, 'commission', 'notifications.ledgerAdjustment',
    jsonb_build_object('amount_cents', p_amount_cents, 'currency', upper(p_currency)), '/dashboard/commissions');
  return v_id;
end $$;

-- Manual attribution correction (V0.1 behaviour, V0.2 statuses).
create or replace function public.staff_correct_attribution(p_sale_id uuid, p_new_affiliate_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.sales;
  c public.commissions;
  v_new public.commissions;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into s from public.sales where id = p_sale_id for update;
  if not found then raise exception 'sale not found'; end if;
  if s.affiliate_id is not distinct from p_new_affiliate_id then return; end if;

  select * into c from public.commissions where sale_id = s.id and affiliate_id = s.affiliate_id for update;
  if c.id is not null then
    if c.status = 'paid' then raise exception 'commission already paid — use a clawback + adjustment'; end if;
    perform public.commission_reverse(c.id, 'attribution corrected: ' || p_reason);
  end if;

  update public.sales set affiliate_id = p_new_affiliate_id where id = s.id;
  if s.subscription_id is not null then
    update public.subscriptions set affiliate_id = p_new_affiliate_id, attribution_source = 'staff', attributed_at = now()
     where id = s.subscription_id;
  end if;

  if p_new_affiliate_id is not null and s.status = 'paid' then
    select * into s from public.sales where id = s.id;
    v_new := public.commission_accrue(s);
  end if;

  perform public.log_audit('attribution.correct', 'sale', s.id::text,
    jsonb_build_object('affiliate_id', c.affiliate_id), jsonb_build_object('affiliate_id', p_new_affiliate_id), p_reason);
end $$;

-- Unsettled ledger entries that are not tied to a commission status:
-- clawbacks (negative) and standalone adjustments.
create or replace function public.unsettled_ledger_cents(p_affiliate_id uuid, p_currency char(3) default null) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(l.amount_cents), 0)::bigint
    from public.commission_ledger l
   where l.affiliate_id = p_affiliate_id
     and (p_currency is null or l.currency = p_currency)
     and (l.entry_type = 'clawback' or (l.entry_type = 'adjustment' and l.commission_id is null))
     and not exists (select 1 from public.ledger_settlements st where st.ledger_id = l.id)
$$;

-- Payout from all available commissions, net of clawbacks and adjustments.
create or replace function public.staff_create_payout(p_affiliate_id uuid, p_scheduled_for date default current_date)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.affiliates;
  v_currency char(3);
  v_total bigint;
  v_extra bigint;
  v_min bigint := coalesce((public.setting('payout.minimum_cents'))::bigint, 0);
  v_payout uuid;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into a from public.affiliates where id = p_affiliate_id for update;
  if not found then raise exception 'affiliate not found'; end if;
  if a.status <> 'approved' then raise exception 'affiliate is not approved'; end if;
  if exists (select 1 from public.payouts where affiliate_id = p_affiliate_id and status in ('scheduled', 'processing')) then
    raise exception 'a payout is already in progress for this affiliate';
  end if;

  -- One payout per currency; the V0 product is EUR only.
  select currency into v_currency from public.commissions
   where affiliate_id = p_affiliate_id and status = 'available' and payout_id is null
   group by currency order by sum(amount_cents) desc limit 1;
  v_currency := coalesce(v_currency, 'EUR');

  select coalesce(sum(amount_cents), 0) into v_total from public.commissions
   where affiliate_id = p_affiliate_id and status = 'available' and payout_id is null and currency = v_currency;
  v_extra := public.unsettled_ledger_cents(p_affiliate_id, v_currency);

  if v_total + v_extra <= 0 or v_total + v_extra < v_min then
    raise exception 'balance below payout minimum';
  end if;

  insert into public.payouts (affiliate_id, amount_cents, currency, scheduled_for, created_by, method)
  values (p_affiliate_id, v_total + v_extra, v_currency, p_scheduled_for, auth.uid(),
          case when a.payouts_enabled and a.stripe_connected_account_id is not null then 'stripe_connect' else 'manual' end)
  returning id into v_payout;

  update public.commissions set payout_id = v_payout
   where affiliate_id = p_affiliate_id and status = 'available' and payout_id is null and currency = v_currency;

  insert into public.ledger_settlements (ledger_id, payout_id)
  select l.id, v_payout from public.commission_ledger l
   where l.affiliate_id = p_affiliate_id and l.currency = v_currency
     and (l.entry_type = 'clawback' or (l.entry_type = 'adjustment' and l.commission_id is null))
     and not exists (select 1 from public.ledger_settlements st where st.ledger_id = l.id);

  perform public.log_audit('payout.create', 'payout', v_payout::text, null,
    jsonb_build_object('amount_cents', v_total + v_extra, 'currency', v_currency, 'net_ledger_cents', v_extra), null);
  return v_payout;
end $$;

create or replace function public.staff_mark_payout_paid(p_payout_id uuid, p_provider_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.payouts;
  c public.commissions;
  v_params jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into p from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout not found'; end if;
  if p.status = 'paid' then return; end if;
  if p.status in ('failed', 'cancelled') then raise exception 'payout is %', p.status; end if;

  update public.payouts set status = 'paid', paid_at = now(), provider_ref = p_provider_ref where id = p.id;
  for c in select * from public.commissions where payout_id = p.id and status = 'available' for update loop
    update public.commissions set status = 'paid', paid_at = now() where id = c.id;
    perform public.ledger_write(c, 'payout', 'available', 'paid', c.amount_cents, null, p.id);
  end loop;
  -- Clawbacks settled by this payout: the money has been recovered.
  update public.commissions cm set recovery_status = 'recovered'
   where cm.recovery_status = 'required' and exists (
     select 1 from public.commission_ledger l join public.ledger_settlements st on st.ledger_id = l.id
      where l.commission_id = cm.id and l.entry_type = 'clawback' and st.payout_id = p.id);

  v_params := jsonb_build_object('amount_cents', p.amount_cents, 'currency', p.currency, 'payout_ref', p.public_ref);
  perform public.add_activity(p.affiliate_id, 'payout_completed', v_params);
  perform public.notify_affiliate(p.affiliate_id, 'payout', 'notifications.payoutPaid', v_params, '/dashboard/payouts');
  perform public.queue_email('affiliate.payout_sent', 'affiliate', public.affiliate_profile(p.affiliate_id), null, null,
    'payout', p.id::text, v_params, 'affiliate.payout_sent:' || p.id, 'payout');
  perform public.log_audit('payout.paid', 'payout', p.id::text, jsonb_build_object('status', p.status),
    jsonb_build_object('status', 'paid', 'provider_ref', p_provider_ref), null);
end $$;

-- -----------------------------------------------------------------------------
-- Stripe: event bookkeeping (exactly-once processing)
-- -----------------------------------------------------------------------------
-- Returns 'process' when the caller owns the event, 'duplicate' when it was
-- already processed (or ignored), 'in_progress' when another worker holds it.
create or replace function public.stripe_event_claim(
  p_event_id text, p_type text, p_livemode boolean, p_api_version text,
  p_created timestamptz, p_reference jsonb
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id bigint;
  v_status public.stripe_event_status;
begin
  insert into public.stripe_events (stripe_event_id, type, livemode, api_version, stripe_created_at, reference)
  values (p_event_id, p_type, p_livemode, p_api_version, p_created, coalesce(p_reference, '{}'::jsonb))
  on conflict (stripe_event_id) do nothing;

  update public.stripe_events
     set processing_status = 'processing', attempts = attempts + 1, locked_at = now(), error = null
   where stripe_event_id = p_event_id
     and (processing_status in ('received', 'failed')
          or (processing_status = 'processing' and locked_at < now() - interval '5 minutes'))
  returning id into v_id;
  if v_id is not null then return 'process'; end if;

  select processing_status into v_status from public.stripe_events where stripe_event_id = p_event_id;
  return case when v_status = 'processing' then 'in_progress' else 'duplicate' end;
end $$;

create or replace function public.stripe_event_finish(p_event_id text, p_status public.stripe_event_status, p_error text default null)
returns void
language sql security definer set search_path = public as $$
  update public.stripe_events
     set processing_status = p_status, locked_at = null,
         processed_at = case when p_status in ('processed', 'ignored') then now() else processed_at end,
         error = left(p_error, 2000)
   where stripe_event_id = p_event_id
$$;

-- -----------------------------------------------------------------------------
-- Stripe: domain functions (service role only). Each takes a normalised
-- payload built by src/lib/stripe/normalize.ts from a VERIFIED Stripe object.
-- -----------------------------------------------------------------------------
create or replace function public.stripe_resolve_offer(p_price_id text, p_lookup_key text) returns public.offers
language plpgsql security definer set search_path = public as $$
declare
  o public.offers;
begin
  if p_price_id is not null then
    select * into o from public.offers where stripe_price_id = p_price_id;
    if found then return o; end if;
  end if;
  if p_lookup_key is not null then
    select * into o from public.offers where stripe_lookup_key = p_lookup_key;
    if found then
      if o.stripe_price_id is null and p_price_id is not null then
        update public.offers set stripe_price_id = p_price_id where id = o.id returning * into o;
      end if;
      return o;
    end if;
  end if;
  raise exception 'unknown_price: % (lookup key %)', p_price_id, p_lookup_key;
end $$;

create or replace function public.stripe_upsert_customer(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if coalesce(p->>'stripe_customer_id', '') = '' then raise exception 'stripe_customer_id required'; end if;
  insert into public.customers (stripe_customer_id, email, contact_name, company_name, country, locale, livemode)
  values (p->>'stripe_customer_id', nullif(lower(p->>'email'), ''), nullif(p->>'name', ''),
          nullif(p->>'company_name', ''), nullif(upper(p->>'country'), ''), nullif(p->>'locale', ''),
          (p->>'livemode')::boolean)
  on conflict (stripe_customer_id) do update set
    email        = coalesce(excluded.email, public.customers.email),
    contact_name = coalesce(excluded.contact_name, public.customers.contact_name),
    company_name = coalesce(excluded.company_name, public.customers.company_name),
    country      = coalesce(excluded.country, public.customers.country),
    locale       = coalesce(excluded.locale, public.customers.locale)
  returning id into v_id;
  return v_id;
end $$;

-- Links the server-created checkout row. The row is found by OUR id (carried in
-- Stripe metadata written by our server) and must agree with Stripe's ids.
create or replace function public.stripe_attach_checkout(
  p_checkout_id uuid, p_stripe_session_id text, p_stripe_subscription_id text, p_customer_id uuid, p_stripe_customer_id text
) returns public.checkout_sessions
language plpgsql security definer set search_path = public as $$
declare
  ch public.checkout_sessions;
begin
  if p_checkout_id is null then return null; end if;
  select * into ch from public.checkout_sessions where id = p_checkout_id for update;
  if not found then
    perform public.log_audit('attribution.checkout_missing', 'checkout_session', p_checkout_id::text, null, null, null);
    return null;
  end if;
  if p_stripe_session_id is not null and ch.stripe_checkout_session_id is distinct from p_stripe_session_id then
    raise exception 'checkout_session_mismatch';
  end if;
  if p_stripe_subscription_id is not null and ch.stripe_subscription_id is not null
     and ch.stripe_subscription_id <> p_stripe_subscription_id then
    raise exception 'checkout_subscription_mismatch';
  end if;
  update public.checkout_sessions set
    stripe_subscription_id = coalesce(stripe_subscription_id, p_stripe_subscription_id),
    customer_id = coalesce(customer_id, p_customer_id),
    stripe_customer_id = coalesce(stripe_customer_id, p_stripe_customer_id)
  where id = ch.id returning * into ch;
  return ch;
end $$;

-- Attribution arriving after the first payment (event ordering): attach the
-- affiliate to the subscription and credit the already-paid first sale.
create or replace function public.apply_subscription_attribution(p_subscription_id uuid, ch public.checkout_sessions)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.sales;
begin
  if ch.id is null or ch.affiliate_id is null then return; end if;
  update public.subscriptions set
    affiliate_id = ch.affiliate_id, checkout_session_id = ch.id, referral_session_id = ch.referral_session_id,
    attribution_source = ch.attribution_source, attributed_at = coalesce(attributed_at, now()),
    lead_id = coalesce(lead_id, ch.lead_id), link_id = coalesce(link_id, ch.link_id), campaign_id = coalesce(campaign_id, ch.campaign_id)
  where id = p_subscription_id and affiliate_id is null;
  if not found then return; end if;

  for s in select * from public.sales
            where subscription_id = p_subscription_id and affiliate_id is null and kind = 'new' for update loop
    update public.sales set affiliate_id = ch.affiliate_id, lead_id = coalesce(lead_id, ch.lead_id),
           link_id = coalesce(link_id, ch.link_id), campaign_id = coalesce(campaign_id, ch.campaign_id),
           checkout_session_id = coalesce(checkout_session_id, ch.id)
     where id = s.id returning * into s;
    if s.status = 'paid' then perform public.commission_accrue(s); end if;
  end loop;
end $$;

create or replace function public.stripe_checkout_completed(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  ch public.checkout_sessions;
  v_sub uuid;
begin
  perform pg_advisory_xact_lock(hashtext('checkout:' || (p->>'stripe_checkout_session_id')));
  v_customer := public.stripe_upsert_customer(p->'customer');
  ch := public.stripe_attach_checkout((p->>'studio_checkout_id')::uuid, p->>'stripe_checkout_session_id',
                                      p->>'stripe_subscription_id', v_customer, p->'customer'->>'stripe_customer_id');
  if ch.id is not null then
    update public.checkout_sessions set status = 'complete', completed_at = coalesce(completed_at, now()) where id = ch.id;
    if ch.lead_id is not null then
      update public.leads set status = 'converted' where id = ch.lead_id and status <> 'converted';
    end if;
    select id into v_sub from public.subscriptions where stripe_subscription_id = p->>'stripe_subscription_id';
    if v_sub is not null then perform public.apply_subscription_attribution(v_sub, ch); end if;
  end if;
  return jsonb_build_object('customer_id', v_customer, 'checkout_id', ch.id);
end $$;

create or replace function public.stripe_checkout_expired(p jsonb) returns void
language sql security definer set search_path = public as $$
  update public.checkout_sessions set status = 'expired'
   where stripe_checkout_session_id = p->>'stripe_checkout_session_id' and status in ('created', 'open')
$$;

create or replace function public.map_stripe_subscription_status(p text) returns public.subscription_status
language sql immutable as $$
  select case p
    when 'active' then 'active' when 'trialing' then 'active'
    when 'past_due' then 'past_due' when 'unpaid' then 'unpaid'
    when 'canceled' then 'cancelled' when 'incomplete_expired' then 'expired'
    when 'paused' then 'paused' else 'incomplete' end::public.subscription_status
$$;

create or replace function public.stripe_subscription_sync(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  o public.offers;
  s public.subscriptions;
  ch public.checkout_sessions;
  v_status public.subscription_status := public.map_stripe_subscription_status(p->>'status');
  v_old_status public.subscription_status;
  v_old_cancel boolean;
  v_profile uuid;
  v_params jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('sub:' || (p->>'stripe_subscription_id')));
  v_customer := public.stripe_upsert_customer(jsonb_build_object(
    'stripe_customer_id', p->>'stripe_customer_id', 'livemode', p->'livemode'));
  o := public.stripe_resolve_offer(p->>'stripe_price_id', p->>'lookup_key');

  select * into s from public.subscriptions where stripe_subscription_id = p->>'stripe_subscription_id' for update;
  if not found then
    ch := public.stripe_attach_checkout((p->>'studio_checkout_id')::uuid, null, p->>'stripe_subscription_id',
                                        v_customer, p->>'stripe_customer_id');
    insert into public.subscriptions (
      customer_id, offer_id, affiliate_id, status, started_at, current_period_start, current_period_end,
      cancel_at, cancel_at_period_end, cancelled_at, ended_at, provider, stripe_subscription_id,
      checkout_session_id, referral_session_id, attribution_source, attributed_at, lead_id, link_id, campaign_id, livemode)
    values (
      v_customer, o.id, ch.affiliate_id, v_status, coalesce((p->>'start_date')::timestamptz, now()),
      coalesce((p->>'current_period_start')::timestamptz, now()),
      coalesce((p->>'current_period_end')::timestamptz, now() + interval '1 year'),
      (p->>'cancel_at')::timestamptz, coalesce((p->>'cancel_at_period_end')::boolean, false),
      (p->>'canceled_at')::timestamptz, (p->>'ended_at')::timestamptz, 'stripe', p->>'stripe_subscription_id',
      ch.id, ch.referral_session_id, coalesce(ch.attribution_source, 'none'), case when ch.affiliate_id is not null then now() end,
      ch.lead_id, ch.link_id, ch.campaign_id, (p->>'livemode')::boolean)
    returning * into s;
    v_old_status := null;
    v_old_cancel := false;
  else
    v_old_status := s.status;
    v_old_cancel := s.cancel_at_period_end or s.cancel_at is not null;
    update public.subscriptions set
      offer_id = o.id, status = v_status,
      current_period_start = coalesce((p->>'current_period_start')::timestamptz, current_period_start),
      current_period_end = coalesce((p->>'current_period_end')::timestamptz, current_period_end),
      cancel_at = (p->>'cancel_at')::timestamptz,
      cancel_at_period_end = coalesce((p->>'cancel_at_period_end')::boolean, false),
      cancelled_at = coalesce((p->>'canceled_at')::timestamptz, cancelled_at),
      ended_at = coalesce((p->>'ended_at')::timestamptz, ended_at)
    where id = s.id returning * into s;
    if s.affiliate_id is null and p->>'studio_checkout_id' is not null then
      ch := public.stripe_attach_checkout((p->>'studio_checkout_id')::uuid, null, p->>'stripe_subscription_id',
                                          v_customer, p->>'stripe_customer_id');
      perform public.apply_subscription_attribution(s.id, ch);
      select * into s from public.subscriptions where id = s.id;
    end if;
  end if;

  -- Cancellation known (scheduled or immediate): tell the customer once, the affiliate once.
  if (s.cancel_at_period_end or s.cancel_at is not null or s.status in ('cancelled', 'expired'))
     and not v_old_cancel and v_old_status is distinct from 'cancelled' then
    v_params := jsonb_build_object('customer_ref', (select public_ref from public.customers where id = s.customer_id),
      'ends_on', coalesce(s.cancel_at, s.ended_at, s.current_period_end)::date);
    perform public.queue_email('customer.cancellation', 'customer', null, s.customer_id, null,
      'subscription', s.id::text, v_params, 'customer.cancellation:' || s.id);
    if s.affiliate_id is not null then
      v_profile := public.affiliate_profile(s.affiliate_id);
      perform public.notify_affiliate(s.affiliate_id, 'lost_customer', 'notifications.customerCancelled', v_params, '/dashboard/recurring');
      perform public.queue_email('affiliate.customer_cancelled', 'affiliate', v_profile, null, null,
        'subscription', s.id::text, v_params, 'affiliate.customer_cancelled:' || s.id, 'lost_customer');
    end if;
  end if;

  if s.status in ('cancelled', 'expired') and v_old_status is distinct from s.status then
    update public.renewals set status = 'cancelled' where subscription_id = s.id and status = 'upcoming';
    perform public.add_activity(s.affiliate_id, 'customer_lost',
      jsonb_build_object('customer_ref', (select public_ref from public.customers where id = s.customer_id)));
  end if;
  return s.id;
end $$;

create or replace function public.stripe_upsert_payment(
  p_pi text, p_charge text, p_invoice uuid, p_customer uuid, p_amount bigint, p_currency char(3),
  p_paid_at timestamptz, p_livemode boolean
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_pi is null and p_charge is null then return null; end if;
  select id into v_id from public.payments
   where (p_pi is not null and stripe_payment_intent_id = p_pi) or (p_charge is not null and stripe_charge_id = p_charge)
   limit 1 for update;
  if v_id is null then
    insert into public.payments (stripe_payment_intent_id, stripe_charge_id, invoice_id, customer_id, amount_cents,
                                 currency, status, paid_at, livemode)
    values (p_pi, p_charge, p_invoice, p_customer, p_amount, upper(p_currency), 'succeeded', p_paid_at, p_livemode)
    returning id into v_id;
  else
    update public.payments set
      stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_pi),
      stripe_charge_id = coalesce(stripe_charge_id, p_charge),
      invoice_id = coalesce(invoice_id, p_invoice)
    where id = v_id;
  end if;
  return v_id;
end $$;

-- invoice.paid → invoice + payment + sale (+ commission via trigger).
-- Requires the subscription to be synced first (the app does it in the same handler).
create or replace function public.stripe_invoice_paid(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  o public.offers;
  s public.subscriptions;
  ch public.checkout_sessions;
  v_invoice uuid;
  v_payment uuid;
  v_sale public.sales;
  v_kind public.sale_kind;
  v_affiliate uuid;
  v_paid_at timestamptz := coalesce((p->>'paid_at')::timestamptz, now());
  v_amount bigint := coalesce((p->>'amount_paid')::bigint, 0);
  v_currency char(3) := upper(p->>'currency');
  c public.commissions;
begin
  perform pg_advisory_xact_lock(hashtext('inv:' || (p->>'stripe_invoice_id')));
  v_customer := public.stripe_upsert_customer(p->'customer');
  o := public.stripe_resolve_offer(p->>'stripe_price_id', p->>'lookup_key');

  if p->>'stripe_subscription_id' is not null then
    select * into s from public.subscriptions where stripe_subscription_id = p->>'stripe_subscription_id' for update;
    if not found then raise exception 'subscription_not_synced: %', p->>'stripe_subscription_id'; end if;
  else
    ch := public.stripe_attach_checkout((p->>'studio_checkout_id')::uuid, null, null, v_customer,
                                        p->'customer'->>'stripe_customer_id');
  end if;

  insert into public.invoices (stripe_invoice_id, customer_id, subscription_id, offer_id, billing_reason, status, currency,
                               amount_due_cents, amount_paid_cents, total_excluding_tax_cents, tax_cents,
                               period_start, period_end, attempt_count, paid_at, livemode)
  values (p->>'stripe_invoice_id', v_customer, s.id, o.id, p->>'billing_reason', 'paid', v_currency,
          coalesce((p->>'amount_due')::bigint, v_amount), v_amount, (p->>'total_excluding_tax')::bigint, (p->>'tax')::bigint,
          (p->>'period_start')::timestamptz, (p->>'period_end')::timestamptz, coalesce((p->>'attempt_count')::int, 1),
          v_paid_at, coalesce((p->>'livemode')::boolean, false))
  on conflict (stripe_invoice_id) do update set
    status = 'paid', amount_paid_cents = excluded.amount_paid_cents, paid_at = coalesce(public.invoices.paid_at, excluded.paid_at),
    subscription_id = coalesce(public.invoices.subscription_id, excluded.subscription_id),
    offer_id = coalesce(public.invoices.offer_id, excluded.offer_id),
    total_excluding_tax_cents = excluded.total_excluding_tax_cents, tax_cents = excluded.tax_cents,
    attempt_count = greatest(public.invoices.attempt_count, excluded.attempt_count), next_payment_attempt_at = null
  returning id into v_invoice;

  v_payment := public.stripe_upsert_payment(p->>'stripe_payment_intent_id', p->>'stripe_charge_id', v_invoice, v_customer,
                                            v_amount, v_currency, v_paid_at, coalesce((p->>'livemode')::boolean, false));

  -- €0 invoice (100% coupon, trial): no revenue, no sale, no commission.
  if v_amount <= 0 then
    return jsonb_build_object('invoice_id', v_invoice, 'sale_id', null, 'created', false, 'reason', 'zero_amount');
  end if;

  v_kind := case
    when p->>'billing_reason' = 'subscription_create' or s.id is null then 'new'
    when p->>'billing_reason' = 'subscription_cycle' then 'renewal'
    else 'upgrade' end;   -- proration / manual invoices: revenue tracked, commission needs review
  v_affiliate := coalesce(s.affiliate_id, ch.affiliate_id);

  insert into public.sales (subscription_id, customer_id, offer_id, affiliate_id, lead_id, link_id, campaign_id, kind, status,
                            gross_amount_cents, net_amount_cents, currency, period_start, period_end, paid_at,
                            provider_payment_id, invoice_id, payment_id, checkout_session_id, livemode)
  values (s.id, v_customer, o.id, v_affiliate, coalesce(s.lead_id, ch.lead_id), coalesce(s.link_id, ch.link_id),
          coalesce(s.campaign_id, ch.campaign_id), v_kind, 'paid', v_amount, (p->>'total_excluding_tax')::bigint, v_currency,
          (p->>'period_start')::timestamptz, (p->>'period_end')::timestamptz, v_paid_at,
          coalesce(p->>'stripe_payment_intent_id', p->>'stripe_charge_id'), v_invoice, v_payment,
          coalesce(s.checkout_session_id, ch.id), coalesce((p->>'livemode')::boolean, false))
  on conflict (invoice_id) do nothing
  returning * into v_sale;

  if v_sale.id is null then  -- replay: already recorded
    select * into v_sale from public.sales where invoice_id = v_invoice;
    select * into c from public.commissions where sale_id = v_sale.id and affiliate_id = v_sale.affiliate_id;
    return jsonb_build_object('invoice_id', v_invoice, 'sale_id', v_sale.id, 'created', false,
                              'commission_id', c.id, 'commission_status', c.status);
  end if;

  if s.id is not null then
    if v_kind = 'renewal' then
      insert into public.renewals (subscription_id, period_start, period_end, due_at, status, sale_id)
      values (s.id, coalesce(v_sale.period_start, v_paid_at), coalesce(v_sale.period_end, v_paid_at + interval '1 year'),
              coalesce(v_sale.period_start, v_paid_at), 'renewed', v_sale.id)
      on conflict (subscription_id, period_start) do update set status = 'renewed', sale_id = excluded.sale_id;
    end if;
    update public.subscriptions set
      status = case when status in ('past_due', 'unpaid', 'incomplete') then 'active'::public.subscription_status else status end,
      current_period_start = greatest(current_period_start, coalesce(v_sale.period_start, current_period_start)),
      current_period_end = greatest(current_period_end, coalesce(v_sale.period_end, current_period_end))
    where id = s.id;
  end if;

  if v_kind = 'new' then
    perform public.queue_email('customer.welcome', 'customer', null, v_customer, null, 'sale', v_sale.id::text,
      jsonb_build_object('product', (select name from public.products where id = o.product_id)),
      'customer.welcome:' || v_customer);
  end if;
  if public.billing_emails_by_studio() then
    perform public.queue_email(case when v_kind = 'renewal' then 'customer.renewal_receipt' else 'customer.order_confirmation' end,
      'customer', null, v_customer, null, 'sale', v_sale.id::text,
      jsonb_build_object('amount_cents', v_amount, 'currency', v_currency, 'sale_ref', v_sale.public_ref),
      'customer.receipt:' || v_sale.id);
  end if;

  select * into c from public.commissions where sale_id = v_sale.id and affiliate_id = v_sale.affiliate_id;
  return jsonb_build_object('invoice_id', v_invoice, 'sale_id', v_sale.id, 'created', true,
                            'commission_id', c.id, 'commission_status', c.status);
end $$;

-- invoice.payment_failed → no sale, no commission. Status + notifications only.
create or replace function public.stripe_invoice_payment_failed(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  s public.subscriptions;
  v_invoice uuid;
  v_offer uuid;
  v_params jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('inv:' || (p->>'stripe_invoice_id')));
  v_customer := public.stripe_upsert_customer(p->'customer');
  select id into v_offer from public.offers
   where stripe_price_id = p->>'stripe_price_id' or stripe_lookup_key = p->>'lookup_key' limit 1;
  if p->>'stripe_subscription_id' is not null then
    select * into s from public.subscriptions where stripe_subscription_id = p->>'stripe_subscription_id';
  end if;

  insert into public.invoices (stripe_invoice_id, customer_id, subscription_id, offer_id, billing_reason, status, currency,
                               amount_due_cents, period_start, period_end, attempt_count, next_payment_attempt_at, livemode)
  values (p->>'stripe_invoice_id', v_customer, s.id, v_offer, p->>'billing_reason', 'open', upper(p->>'currency'),
          coalesce((p->>'amount_due')::bigint, 0), (p->>'period_start')::timestamptz, (p->>'period_end')::timestamptz,
          coalesce((p->>'attempt_count')::int, 1), (p->>'next_payment_attempt')::timestamptz,
          coalesce((p->>'livemode')::boolean, false))
  on conflict (stripe_invoice_id) do update set
    status = case when public.invoices.status = 'paid' then public.invoices.status else 'open'::public.invoice_status end,
    attempt_count = greatest(public.invoices.attempt_count, excluded.attempt_count),
    next_payment_attempt_at = excluded.next_payment_attempt_at
  returning id into v_invoice;

  if s.id is not null and p->>'billing_reason' = 'subscription_cycle' then
    insert into public.renewals (subscription_id, period_start, period_end, due_at, status)
    values (s.id, coalesce((p->>'period_start')::timestamptz, s.current_period_end),
            coalesce((p->>'period_end')::timestamptz, s.current_period_end + interval '1 year'),
            coalesce((p->>'period_start')::timestamptz, s.current_period_end), 'failed')
    on conflict (subscription_id, period_start) do update set status = 'failed'
      where public.renewals.status <> 'renewed';
  end if;

  if s.affiliate_id is not null then
    v_params := jsonb_build_object('customer_ref', (select public_ref from public.customers where id = v_customer),
      'attempt', coalesce((p->>'attempt_count')::int, 1));
    perform public.add_activity(s.affiliate_id, 'payment_failed', v_params);
    perform public.notify_affiliate(s.affiliate_id, 'payment_failed', 'notifications.paymentFailed', v_params, '/dashboard/recurring');
  end if;
  if public.billing_emails_by_studio() then
    perform public.queue_email('customer.payment_failed', 'customer', null, v_customer, null, 'invoice', v_invoice::text,
      jsonb_build_object('amount_cents', (p->>'amount_due')::bigint, 'currency', upper(p->>'currency')),
      'customer.payment_failed:' || (p->>'stripe_invoice_id') || ':' || coalesce(p->>'attempt_count', '1'));
  end if;
  return jsonb_build_object('invoice_id', v_invoice);
end $$;

create or replace function public.find_payment(p_pi text, p_charge text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.payments
   where (p_pi is not null and stripe_payment_intent_id = p_pi) or (p_charge is not null and stripe_charge_id = p_charge)
   limit 1
$$;

-- Refund created / updated. The financial effect is applied once, when the
-- refund has actually succeeded.
create or replace function public.stripe_refund_sync(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_payment uuid := public.find_payment(p->>'stripe_payment_intent_id', p->>'stripe_charge_id');
  pay public.payments;
  r public.refunds;
  v_sale public.sales;
  c public.commissions;
  v_total bigint;
  v_policy text;
begin
  if v_payment is null then return 'unknown_payment'; end if;
  perform pg_advisory_xact_lock(hashtext('pay:' || v_payment));

  insert into public.refunds (stripe_refund_id, payment_id, amount_cents, currency, status, reason)
  values (p->>'stripe_refund_id', v_payment, (p->>'amount')::bigint, upper(p->>'currency'), p->>'status', p->>'reason')
  on conflict (stripe_refund_id) do update set status = excluded.status, amount_cents = excluded.amount_cents,
    reason = coalesce(excluded.reason, public.refunds.reason)
  returning * into r;

  if r.status = 'succeeded' and r.applied_at is null then
    update public.refunds set applied_at = now() where id = r.id;
    select * into pay from public.payments where id = v_payment for update;
    select coalesce(sum(amount_cents), 0) into v_total from public.refunds
     where payment_id = v_payment and applied_at is not null;
    update public.payments set amount_refunded_cents = least(v_total, amount_cents),
           status = case when v_total >= amount_cents then 'refunded'::public.payment_status
                         when status = 'disputed' then status else 'partially_refunded' end
     where id = v_payment;

    select * into v_sale from public.sales where payment_id = v_payment for update;
    if v_sale.id is not null then
      if v_total >= pay.amount_cents then
        update public.sales set status = 'refunded', refunded_at = now() where id = v_sale.id;   -- trigger: full reversal
      else
        update public.sales set status = 'partially_refunded' where id = v_sale.id and status = 'paid';
        select * into c from public.commissions where sale_id = v_sale.id and affiliate_id = v_sale.affiliate_id;
        if c.id is not null and c.status <> 'reversed' then
          v_policy := coalesce(public.setting('refund.partial_policy') #>> '{}', 'manual_review');
          if v_policy = 'proportional' then
            perform public.commission_reverse(c.id, 'partial_refund',
              round(r.amount_cents::numeric * c.amount_cents / nullif(v_sale.gross_amount_cents, 0))::bigint);
          elsif v_policy = 'full_reversal' then
            perform public.commission_reverse(c.id, 'partial_refund');
          else
            perform public.commission_set_disputed(c.id, 'partial_refund_review');
          end if;
        end if;
      end if;
    end if;
    return 'applied';
  elsif r.status in ('failed', 'canceled') and r.applied_at is not null then
    -- A refund we already applied did not go through: never auto-restore money, ask a human.
    insert into public.fraud_flags (type, severity, entity, entity_id, signals)
    values ('manual_review', 2, 'refund', r.id::text, jsonb_build_object('reason', 'refund_' || r.status || '_after_apply'));
    return 'flagged';
  end if;
  return 'recorded';
end $$;

create or replace function public.stripe_dispute_sync(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_payment uuid := public.find_payment(p->>'stripe_payment_intent_id', p->>'stripe_charge_id');
  d public.disputes;
  v_new boolean;
  v_sale public.sales;
  v_status text := p->>'status';
begin
  if v_payment is null then return 'unknown_payment'; end if;
  perform pg_advisory_xact_lock(hashtext('pay:' || v_payment));

  select * into d from public.disputes where stripe_dispute_id = p->>'stripe_dispute_id' for update;
  v_new := not found;
  if v_new then
    insert into public.disputes (stripe_dispute_id, payment_id, amount_cents, currency, status, reason)
    values (p->>'stripe_dispute_id', v_payment, (p->>'amount')::bigint, upper(p->>'currency'), v_status, p->>'reason')
    returning * into d;
  else
    update public.disputes set status = v_status, amount_cents = (p->>'amount')::bigint where id = d.id returning * into d;
  end if;

  select * into v_sale from public.sales where payment_id = v_payment for update;

  if v_status in ('won', 'warning_closed', 'prevented') then
    update public.disputes set outcome = 'won', closed_at = coalesce(closed_at, now()) where id = d.id;
    update public.payments set status = case when amount_refunded_cents > 0 then 'partially_refunded'::public.payment_status
                                             else 'succeeded' end
     where id = v_payment and status = 'disputed';
    if v_sale.id is not null and v_sale.status = 'disputed' then
      update public.sales set status = 'paid' where id = v_sale.id;          -- trigger: commission restored
    end if;
    return 'won';
  elsif v_status = 'lost' then
    update public.disputes set outcome = 'lost', closed_at = coalesce(closed_at, now()) where id = d.id;
    if v_sale.id is not null and v_sale.status <> 'chargeback' then
      update public.sales set status = 'chargeback', refunded_at = now() where id = v_sale.id;  -- trigger: reversal / clawback
    end if;
    return 'lost';
  else
    update public.payments set status = 'disputed' where id = v_payment and status <> 'refunded';
    if v_sale.id is not null and v_sale.status in ('paid', 'partially_refunded') then
      update public.sales set status = 'disputed' where id = v_sale.id;      -- trigger: commission disputed
    end if;
    if v_new then
      insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
      values ('commission_dispute', 2, v_sale.affiliate_id, 'dispute', d.id::text,
              jsonb_build_object('reason', p->>'reason', 'amount_cents', (p->>'amount')::bigint));
    end if;
    return 'open';
  end if;
end $$;

-- Connected account status (Stripe Connect). Sensitive onboarding is handled
-- by Stripe; we only mirror what decides payout eligibility.
create or replace function public.stripe_connect_account_sync(p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.affiliates set
    payouts_enabled = coalesce((p->>'payouts_enabled')::boolean, false),
    connect_onboarding_status = case
      when (p->>'payouts_enabled')::boolean and (p->>'details_submitted')::boolean then 'complete'
      when p->>'disabled_reason' is not null then 'restricted'
      else 'pending' end::public.connect_onboarding_status,
    connect_requirements_status = p->>'requirements_status',
    connect_updated_at = now()
  where stripe_connected_account_id = p->>'stripe_account_id';
  return found;
end $$;

-- -----------------------------------------------------------------------------
-- Attribution touches (server-side, called on every tracked referral click)
-- -----------------------------------------------------------------------------
create or replace function public.record_referral_touch(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.referral_sessions (session_key, affiliate_id, referral_code, link_id, campaign_id, private_page_id,
                                        landing_page, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
                                        last_landing_page, last_utm)
  values ((p->>'session_key')::uuid, (p->>'affiliate_id')::uuid, p->>'referral_code', (p->>'link_id')::uuid,
          (p->>'campaign_id')::uuid, (p->>'private_page_id')::uuid, left(p->>'landing_page', 300),
          p->'utm'->>'source', p->'utm'->>'medium', p->'utm'->>'campaign', p->'utm'->>'content', p->'utm'->>'term',
          left(p->>'landing_page', 300), coalesce(p->'utm', '{}'::jsonb))
  on conflict (session_key, affiliate_id) do update set
    last_touch_at = now(), touch_count = public.referral_sessions.touch_count + 1,
    last_landing_page = excluded.last_landing_page, last_utm = excluded.last_utm,
    link_id = coalesce(excluded.link_id, public.referral_sessions.link_id),
    campaign_id = coalesce(excluded.campaign_id, public.referral_sessions.campaign_id),
    private_page_id = coalesce(excluded.private_page_id, public.referral_sessions.private_page_id)
  returning id into v_id;
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- Read models
-- -----------------------------------------------------------------------------
drop view if exists public.affiliate_balances;
create view public.affiliate_balances with (security_invoker = true) as
select
  a.id as affiliate_id,
  coalesce(sum(c.amount_cents) filter (where c.status = 'awaiting_payment'), 0) as awaiting_payment_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'pending'), 0)          as pending_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'disputed'), 0)         as disputed_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'available'), 0)
    + coalesce((select sum(l.amount_cents) from public.commission_ledger l
                 where l.affiliate_id = a.id
                   and (l.entry_type = 'clawback' or (l.entry_type = 'adjustment' and l.commission_id is null))
                   and not exists (select 1 from public.ledger_settlements st where st.ledger_id = l.id)), 0)
                                                                                as available_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'paid'), 0)             as paid_cents,
  coalesce(sum(c.amount_cents) filter (where c.status in ('available', 'paid')), 0) as lifetime_earned_cents
from public.affiliates a
left join public.commissions c on c.affiliate_id = a.id
group by a.id;

-- What the next eligible payment of a contract would pay the affiliate, under
-- today's rules. A PROJECTION: nothing here is earned.
create or replace function public.project_next_commission(p_subscription_id uuid)
returns table (eligible boolean, reason text, amount_cents bigint, periods_12m int, projected_12m_cents bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  s public.subscriptions;
  o public.offers;
  last_sale public.sales;
  e public.commission_evaluation;
  v_next timestamptz;
  v_step interval;
  v_n int := 0;
  v_rule public.commission_rules;
  v_done int;
begin
  select * into s from public.subscriptions where id = p_subscription_id;
  if not found or s.status not in ('active', 'past_due') or s.cancel_at_period_end or s.cancel_at is not null then
    return query select false, 'not_renewing'::text, 0::bigint, 0, 0::bigint; return;
  end if;
  select * into o from public.offers where id = s.offer_id;
  if o.billing_interval = 'one_time' then
    return query select false, 'one_time'::text, 0::bigint, 0, 0::bigint; return;
  end if;
  select * into last_sale from public.sales where subscription_id = s.id and status in ('paid', 'partially_refunded')
   order by paid_at desc nulls last limit 1;

  e := public.evaluate_commission_for(s.affiliate_id, s.offer_id, s.customer_id, s.id, 'renewal', o.currency,
         coalesce(last_sale.gross_amount_cents, o.price_cents), coalesce(last_sale.net_amount_cents, o.price_cents),
         s.current_period_end, null);
  if not e.eligible then
    return query select false, e.reason, 0::bigint, 0, 0::bigint; return;
  end if;

  v_step := case o.billing_interval when 'month' then interval '1 month' else interval '1 year' end * o.interval_count;
  v_next := s.current_period_end;
  v_rule := public.resolve_commission_rule(s.affiliate_id, s.offer_id, v_next);
  select count(*) into v_done from public.commissions c join public.sales x on x.id = c.sale_id
   where x.subscription_id = s.id and c.affiliate_id = s.affiliate_id and c.status <> 'reversed';
  while v_next <= now() + interval '12 months' loop
    exit when v_rule.duration_months is not null and v_next >= s.started_at + make_interval(months => v_rule.duration_months);
    exit when v_rule.max_payments is not null and v_done + v_n >= v_rule.max_payments;
    v_n := v_n + 1;
    v_next := v_next + v_step;
  end loop;
  return query select true, null::text, e.amount_cents, v_n, e.amount_cents * v_n;
end $$;

-- Recurring book of one affiliate (own book, or any book for staff).
create or replace function public.affiliate_recurring_book(p_affiliate_id uuid)
returns table (
  subscription_id uuid, customer_ref text, customer_name text, product_name text, started_at timestamptz,
  next_renewal_at timestamptz, annual_amount_cents bigint, currency char(3), status public.subscription_status,
  cancelling boolean, rule_label text, rule_rate numeric, rule_duration_months int,
  next_commission_eligible boolean, next_commission_reason text, next_commission_cents bigint,
  projected_12m_cents bigint, renewals_count int, last_paid_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if p_affiliate_id is distinct from public.current_affiliate_id() and not public.is_staff() then
    raise exception 'forbidden';
  end if;
  return query
  select s.id, cu.public_ref, cu.company_name, pr.name, s.started_at, s.current_period_end,
         -- Annualised contract value in the price currency.
         (o.price_cents * case o.billing_interval when 'month' then 12 / o.interval_count else 1 end)::bigint,
         o.currency, s.status, (s.cancel_at_period_end or s.cancel_at is not null),
         r.name, coalesce(af.commission_rate_override, r.rate, o.commission_rate), r.duration_months,
         pn.eligible, pn.reason, pn.amount_cents, pn.projected_12m_cents,
         (select count(*)::int from public.sales x where x.subscription_id = s.id and x.kind = 'renewal' and x.status = 'paid'),
         (select max(x.paid_at) from public.sales x where x.subscription_id = s.id and x.status = 'paid')
    from public.subscriptions s
    join public.customers cu on cu.id = s.customer_id
    join public.offers o on o.id = s.offer_id
    join public.products pr on pr.id = o.product_id
    join public.affiliates af on af.id = s.affiliate_id
    left join lateral (select * from public.resolve_commission_rule(s.affiliate_id, s.offer_id, now())) r on true
    left join lateral (select * from public.project_next_commission(s.id)) pn on true
   where s.affiliate_id = p_affiliate_id
   order by (s.status = 'active') desc, s.current_period_end;
end $$;

-- Admin finance summary with filters. Revenue figures only count money Stripe
-- confirmed; commission buckets are the current state of those sales.
create or replace function public.admin_finance_summary(
  p_from timestamptz default null, p_to timestamptz default null, p_affiliate_id uuid default null,
  p_product_id uuid default null, p_status text default null, p_country text default null,
  p_campaign_id uuid default null, p_currency char(3) default 'EUR'
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  with f as (
    select s.*, o.product_id, cu.country
      from public.sales s
      join public.offers o on o.id = s.offer_id
      join public.customers cu on cu.id = s.customer_id
     where s.currency = p_currency and s.paid_at is not null
       and (p_from is null or s.paid_at >= p_from) and (p_to is null or s.paid_at < p_to)
       and (p_affiliate_id is null or s.affiliate_id = p_affiliate_id)
       and (p_product_id is null or o.product_id = p_product_id)
       and (p_status is null or s.status::text = p_status)
       and (p_country is null or cu.country = upper(p_country))
       and (p_campaign_id is null or s.campaign_id = p_campaign_id)
  ), cm as (
    select c.* from public.commissions c join f on f.id = c.sale_id
  ), subs as (
    select s.* from public.subscriptions s
      join public.offers o on o.id = s.offer_id
      join public.customers cu on cu.id = s.customer_id
     where o.currency = p_currency
       and (p_affiliate_id is null or s.affiliate_id = p_affiliate_id)
       and (p_product_id is null or o.product_id = p_product_id)
       and (p_country is null or cu.country = upper(p_country))
       and (p_campaign_id is null or s.campaign_id = p_campaign_id)
  )
  select jsonb_build_object(
    'currency', p_currency,
    'gross_revenue_cents',      (select coalesce(sum(gross_amount_cents), 0) from f),
    'attributed_revenue_cents', (select coalesce(sum(gross_amount_cents), 0) from f where affiliate_id is not null),
    'sales_count',              (select count(*) from f),
    'renewals_count',           (select count(*) from f where kind = 'renewal'),
    'pending_commissions_cents',   (select coalesce(sum(amount_cents), 0) from cm where status = 'pending'),
    'disputed_commissions_cents',  (select coalesce(sum(amount_cents), 0) from cm where status = 'disputed'),
    'available_commissions_cents', (select coalesce(sum(amount_cents), 0) from cm where status = 'available'),
    'paid_commissions_cents',      (select coalesce(sum(amount_cents), 0) from cm where status = 'paid'),
    'reversed_commissions_cents',  (select coalesce(sum(l.amount_cents), 0) from public.commission_ledger l
                                     join cm on cm.id = l.commission_id where l.entry_type in ('reversal', 'clawback')),
    'recovery_required_count',     (select count(*) from cm where recovery_status = 'required'),
    'refunds_cents',   (select coalesce(sum(r.amount_cents), 0) from public.refunds r join f on f.payment_id = r.payment_id
                         where r.applied_at is not null),
    'chargebacks_count', (select count(*) from public.disputes d join f on f.payment_id = d.payment_id where d.outcome = 'lost'),
    'chargebacks_cents', (select coalesce(sum(d.amount_cents), 0) from public.disputes d join f on f.payment_id = d.payment_id
                           where d.outcome = 'lost'),
    'open_disputes_count', (select count(*) from public.disputes d join f on f.payment_id = d.payment_id where d.outcome is null),
    'active_subscriptions', (select count(*) from subs where status = 'active'),
    'upcoming_renewals_60d', (select count(*) from subs where status = 'active' and not cancel_at_period_end
                               and cancel_at is null and current_period_end <= now() + interval '60 days'),
    'cancelling_subscriptions', (select count(*) from subs where status = 'active' and (cancel_at_period_end or cancel_at is not null)),
    'webhooks_failed', (select count(*) from public.stripe_events where processing_status = 'failed'),
    'webhooks_last_received_at', (select max(received_at) from public.stripe_events),
    'emails_failed', (select count(*) from public.email_events where status = 'failed')
  ) into v;
  return v;
end $$;

-- Email outbox: claim a batch (skip locked → safe with concurrent workers).
create or replace function public.email_claim_batch(p_limit int default 20, p_ids uuid[] default null)
returns table (id uuid, template text, recipient_type text, to_email text, locale text, params jsonb,
               idempotency_key text, related_entity text, related_id text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  return query
  with picked as (
    select e.id from public.email_events e
     where (e.status = 'queued' or (e.status = 'failed' and e.attempts < 5
                                    and e.last_attempt_at < now() - make_interval(mins => 5 * e.attempts))
            or (e.status = 'sending' and e.last_attempt_at < now() - interval '15 minutes'))
       and (p_ids is null or e.id = any (p_ids))
     order by e.requested_at
     limit p_limit
     for update skip locked
  ), upd as (
    update public.email_events e set status = 'sending', attempts = e.attempts + 1, last_attempt_at = now()
      from picked where e.id = picked.id
    returning e.*
  )
  select u.id, u.template, u.recipient_type,
         coalesce(p.email::text, c.email::text, l.email::text),
         coalesce(p.locale, c.locale, l.locale, 'en'),
         u.params, u.idempotency_key, u.related_entity, u.related_id
    from upd u
    left join public.profiles p on p.id = u.recipient_profile_id
    left join public.customers c on c.id = u.recipient_customer_id
    left join public.leads l on l.id = u.recipient_lead_id;
end $$;

create or replace function public.email_mark(p_id uuid, p_status public.email_status, p_provider text,
                                             p_provider_message_id text, p_error text)
returns void
language sql security definer set search_path = public as $$
  update public.email_events set status = p_status, provider = coalesce(p_provider, provider),
         provider_message_id = coalesce(p_provider_message_id, provider_message_id),
         sent_at = case when p_status = 'sent' then now() else sent_at end,
         error = left(p_error, 1000)
   where id = p_id
$$;

-- -----------------------------------------------------------------------------
-- CRM → emails: new lead, appointment request, affiliate welcome
-- -----------------------------------------------------------------------------
create or replace function public.on_lead_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_params jsonb := jsonb_build_object('profession', new.profession, 'company', new.company);
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

  -- The prospect receives a confirmation, attributed or not.
  perform public.queue_email('lead.confirmation', 'lead', null, null, new.id, 'lead', new.id::text,
    '{}'::jsonb, 'lead.confirmation:' || new.id);

  if new.affiliate_id is not null then
    -- Affiliates never receive the lead's contact details (company / profession only).
    perform public.add_activity(new.affiliate_id, 'lead', v_params);
    perform public.notify_affiliate(new.affiliate_id, 'lead', 'notifications.newLead', v_params, '/dashboard');
    perform public.queue_email('affiliate.new_lead', 'affiliate', public.affiliate_profile(new.affiliate_id), null, null,
      'lead', new.id::text, v_params, 'affiliate.new_lead:' || new.id, 'lead');
  end if;

  if new.status = 'appointment_requested' or new.appointment_at is not null then
    perform public.on_lead_appointment(new);
  end if;
  return new;
end $$;

create or replace function public.on_lead_appointment(l public.leads) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_params jsonb := jsonb_build_object('profession', l.profession, 'company', l.company, 'appointment_at', l.appointment_at);
begin
  perform public.queue_email('lead.appointment_confirmation', 'lead', null, null, l.id, 'lead', l.id::text,
    jsonb_build_object('appointment_at', l.appointment_at), 'lead.appointment:' || l.id || ':' || coalesce(l.appointment_at::text, 'requested'));
  if l.affiliate_id is not null then
    perform public.add_activity(l.affiliate_id, 'appointment', v_params);
    perform public.notify_affiliate(l.affiliate_id, 'appointment', 'notifications.appointment', v_params, '/dashboard/prospects');
    perform public.queue_email('affiliate.appointment', 'affiliate', public.affiliate_profile(l.affiliate_id), null, null,
      'lead', l.id::text, v_params, 'affiliate.appointment:' || l.id || ':' || coalesce(l.appointment_at::text, 'requested'), 'appointment');
  end if;
end $$;

create or replace function public.on_lead_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.status = 'appointment_requested' and old.status is distinct from 'appointment_requested')
     or (new.appointment_at is not null and new.appointment_at is distinct from old.appointment_at) then
    perform public.on_lead_appointment(new);
  end if;
  return new;
end $$;

drop trigger if exists leads_after_update on public.leads;
create trigger leads_after_update after update of status, appointment_at on public.leads
  for each row execute function public.on_lead_update();

create or replace function public.on_affiliate_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.queue_email('affiliate.welcome', 'affiliate', new.profile_id, null, null, 'affiliate', new.id::text,
    jsonb_build_object('code', new.code, 'status', new.status), 'affiliate.welcome:' || new.profile_id);
  return new;
end $$;

drop trigger if exists affiliates_after_insert on public.affiliates;
create trigger affiliates_after_insert after insert on public.affiliates
  for each row execute function public.on_affiliate_created();

-- Connect fields are managed by the server (webhooks) and staff only.
create or replace function public.guard_affiliate_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if new.status is distinct from old.status
       or new.code is distinct from old.code
       or new.commission_rate_override is distinct from old.commission_rate_override
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
       or new.profile_id is distinct from old.profile_id
       or new.payout_provider is distinct from old.payout_provider
       or new.payout_account_ref is distinct from old.payout_account_ref
       or new.stripe_connected_account_id is distinct from old.stripe_connected_account_id
       or new.connect_onboarding_status is distinct from old.connect_onboarding_status
       or new.payouts_enabled is distinct from old.payouts_enabled
       or new.connect_requirements_status is distinct from old.connect_requirements_status then
      raise exception 'Field is managed by STUDIO staff';
    end if;
  end if;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Attribution resolution at conversion time (checkout, lead). Mirrors
-- src/lib/attribution.ts#resolveAttribution. Model and window come from settings:
--   first_click → earliest first touch   (window measured from that touch)
--   last_click  → most recent touch      (window measured from that touch)
--   manual      → no automatic attribution (explicit context or staff only)
-- Only approved affiliates can be credited.
-- -----------------------------------------------------------------------------
create or replace function public.resolve_attribution(p_session_key uuid, p_at timestamptz default now())
returns public.referral_sessions
language plpgsql stable security definer set search_path = public as $$
declare
  v_model text := coalesce(public.setting('attribution.model') #>> '{}', 'last_click');
  v_days int := coalesce((public.setting('attribution.window_days'))::int, 90);
  r public.referral_sessions;
begin
  if p_session_key is null or v_model = 'manual' then return null; end if;
  if v_model = 'first_click' then
    select rs.* into r from public.referral_sessions rs
     where rs.session_key = p_session_key order by rs.first_touch_at asc limit 1;
    if r.id is null or r.first_touch_at < p_at - make_interval(days => v_days) then return null; end if;
  else
    select rs.* into r from public.referral_sessions rs
     where rs.session_key = p_session_key order by rs.last_touch_at desc limit 1;
    if r.id is null or r.last_touch_at < p_at - make_interval(days => v_days) then return null; end if;
  end if;
  if not exists (select 1 from public.affiliates a where a.id = r.affiliate_id and a.status = 'approved' and a.deleted_at is null) then
    return null;
  end if;
  return r;
end $$;
