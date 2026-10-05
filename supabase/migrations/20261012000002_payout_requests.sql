-- =============================================================================
-- Studio ATS — partner payout requests (V1: human-validated, paid manually;
-- ready for Stripe Connect transfers).
--
--   available commission ──(partner: affiliate_request_payout)──▶ payout `requested`
--        │                      allocations lock the exact cents requested
--        ▼
--   staff_process_payout ─▶ `processing` ─▶ staff_mark_payout_paid ─▶ `paid`
--                     ↘ staff_reject_payout (reason) / staff_fail_payout ─▶ allocations released
--
-- Design (backward compatible):
--   * `payouts` stays THE payout entity (PAY-XXXXXX ref, method, provider ref,
--     Stripe transfer id); a request is a payout in status `requested`.
--   * `payout_allocations` says precisely which cents of which commission
--     belong to which payout. A commission can be split across payouts (partial
--     requests); the sum of its live allocations never exceeds its amount
--     (checked under lock). This is what prevents paying a commission twice.
--   * Commission statuses are unchanged (available → paid): "payout requested"
--     is derived from live allocations, so every existing report keeps working.
--   * One open payout per partner (unique partial index) + idempotency key:
--     double clicks and concurrent requests cannot create two payouts.
--   * `payout_events` is the append-only history of each payout (who, when,
--     from → to, amount); audit_logs keeps the global trail.
--   * Bank details never enter Studio ATS: Stripe Connect holds them; we store
--     the connected account id and, at most, the last 4 digits for display.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Schema
-- -----------------------------------------------------------------------------
alter table public.payouts
  add column if not exists requested_by         uuid references public.profiles (id),
  add column if not exists balance_before_cents bigint,
  add column if not exists processed_at         timestamptz,
  add column if not exists rejected_at          timestamptz,
  add column if not exists failed_at            timestamptz,
  add column if not exists rejection_reason     text,
  add column if not exists admin_note           text,
  -- Connected account the payout is destined to (snapshot at request time).
  add column if not exists stripe_account_id    text,
  add column if not exists idempotency_key      text;
alter table public.payouts alter column scheduled_for set default current_date;

create unique index if not exists payouts_idempotency_idx
  on public.payouts (affiliate_id, idempotency_key) where idempotency_key is not null;
-- At most one payout in progress per partner: the database itself refuses a
-- second concurrent request, whatever the application does.
create unique index if not exists payouts_one_open_idx
  on public.payouts (affiliate_id) where status in ('requested', 'scheduled', 'processing');

-- Display only ("•••• 4821"): never the full IBAN / card number.
alter table public.affiliates add column if not exists connect_payout_last4 text
  check (connect_payout_last4 is null or connect_payout_last4 ~ '^[0-9]{4}$');

create table if not exists public.payout_allocations (
  payout_id     uuid not null references public.payouts (id),
  commission_id uuid not null references public.commissions (id),
  amount_cents  bigint not null check (amount_cents > 0),
  -- Set when the payout is rejected / failed / cancelled: the cents are free again.
  released_at   timestamptz,
  created_at    timestamptz not null default now(),
  primary key (payout_id, commission_id)
);
create index if not exists payout_allocations_live_idx
  on public.payout_allocations (commission_id) where released_at is null;

create table if not exists public.payout_events (
  id           bigint generated always as identity primary key,
  payout_id    uuid not null references public.payouts (id),
  actor_id     uuid references public.profiles (id),
  actor_role   text not null check (actor_role in ('affiliate', 'staff', 'system')),
  from_status  public.payout_status,
  to_status    public.payout_status not null,
  amount_cents bigint not null,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists payout_events_payout_idx on public.payout_events (payout_id, created_at);
drop trigger if exists payout_events_immutable on public.payout_events;
create trigger payout_events_immutable before update or delete on public.payout_events
  for each row execute function public.forbid_mutation();

alter table public.payout_allocations enable row level security;
alter table public.payout_events enable row level security;
drop policy if exists payout_allocations_read on public.payout_allocations;
create policy payout_allocations_read on public.payout_allocations for select using (
  public.is_staff() or exists (select 1 from public.payouts p
    where p.id = payout_allocations.payout_id and p.affiliate_id = public.current_affiliate_id()));
drop policy if exists payout_events_read on public.payout_events;
create policy payout_events_read on public.payout_events for select using (
  public.is_staff() or exists (select 1 from public.payouts p
    where p.id = payout_events.payout_id and p.affiliate_id = public.current_affiliate_id()));
-- Writes only through the SECURITY DEFINER functions below.
revoke insert, update, delete on public.payout_allocations, public.payout_events from anon, authenticated;
revoke insert, update, delete on public.payouts from anon, authenticated;

-- Legacy staff payouts (commissions.payout_id, whole commissions) become allocations,
-- so one rule decides what is already taken.
insert into public.payout_allocations (payout_id, commission_id, amount_cents, released_at)
select c.payout_id, c.id, c.amount_cents,
       case when p.status in ('failed', 'cancelled') then now() end
  from public.commissions c join public.payouts p on p.id = c.payout_id
 where c.amount_cents > 0
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Balance helpers (internal)
-- -----------------------------------------------------------------------------
-- Cents of a commission held by live allocations (requested, in progress or paid).
create or replace function public.commission_allocated_cents(p_commission_id uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_cents), 0)::bigint from public.payout_allocations
   where commission_id = p_commission_id and released_at is null
$$;

-- What the partner can request right now: free cents of available commissions,
-- net of clawbacks / adjustments not yet settled by a payout.
create or replace function public.affiliate_payable_cents(p_affiliate_id uuid, p_currency char(3) default 'EUR') returns bigint
language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(greatest(c.amount_cents - public.commission_allocated_cents(c.id), 0))
                      from public.commissions c
                     where c.affiliate_id = p_affiliate_id and c.status = 'available' and c.currency = p_currency), 0)
          + public.unsettled_ledger_cents(p_affiliate_id, p_currency))::bigint
$$;

-- Reserve `p_amount` for a payout: settle open clawbacks / adjustments into it,
-- then take the oldest available commissions first (FIFO). Caller holds the
-- affiliate row lock.
create or replace function public.payout_allocate(p_payout_id uuid, p_affiliate_id uuid, p_currency char(3), p_amount bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_extra bigint := public.unsettled_ledger_cents(p_affiliate_id, p_currency);
  v_need bigint;
  v_take bigint;
  r record;
begin
  if v_extra > 0 and p_amount < v_extra then raise exception 'payout.amount_below_adjustments'; end if;
  insert into public.ledger_settlements (ledger_id, payout_id)
  select l.id, p_payout_id from public.commission_ledger l
   where l.affiliate_id = p_affiliate_id and l.currency = p_currency
     and (l.entry_type = 'clawback' or (l.entry_type = 'adjustment' and l.commission_id is null))
     and not exists (select 1 from public.ledger_settlements st where st.ledger_id = l.id);

  v_need := p_amount - v_extra;
  -- Lock the candidate commissions (a refund cannot slip in between).
  perform 1 from public.commissions
   where affiliate_id = p_affiliate_id and status = 'available' and currency = p_currency for update;
  for r in
    select c.id, c.amount_cents - public.commission_allocated_cents(c.id) as free
      from public.commissions c
     where c.affiliate_id = p_affiliate_id and c.status = 'available' and c.currency = p_currency
     order by coalesce(c.available_at, c.created_at), c.created_at, c.id
  loop
    exit when v_need <= 0;
    continue when r.free <= 0;
    v_take := least(r.free, v_need);
    insert into public.payout_allocations (payout_id, commission_id, amount_cents) values (p_payout_id, r.id, v_take);
    v_need := v_need - v_take;
  end loop;
  if v_need > 0 then raise exception 'payout.insufficient_balance'; end if;
end $$;

-- Before money moves: every allocated commission must still be payable and
-- never be over-allocated. Returns null when OK, else a human-readable reason.
create or replace function public.payout_problem(p_payout_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select string_agg(format('%s: %s', coalesce(s.public_ref, c.id::text),
           case when c.status <> 'available' and c.status <> 'paid' then 'commission ' || c.status::text
                else 'over-allocated' end), '; ')
    from public.payout_allocations a
    join public.commissions c on c.id = a.commission_id
    left join public.sales s on s.id = c.sale_id
   where a.payout_id = p_payout_id and a.released_at is null
     and (c.status not in ('available', 'paid') or public.commission_allocated_cents(c.id) > c.amount_cents)
$$;

create or replace function public.payout_log(p public.payouts, p_from public.payout_status, p_to public.payout_status, p_role text, p_note text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.payout_events (payout_id, actor_id, actor_role, from_status, to_status, amount_cents, note)
  values (p.id, auth.uid(), p_role, p_from, p_to, p.amount_cents, p_note);
  perform public.log_audit('payout.' || p_to::text, 'payout', p.id::text,
    case when p_from is null then null else jsonb_build_object('status', p_from) end,
    jsonb_build_object('status', p_to, 'amount_cents', p.amount_cents, 'ref', p.public_ref), p_note);
end $$;

-- Free the cents of a payout that will not be paid.
create or replace function public.payout_release(p_payout_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.payout_allocations set released_at = now() where payout_id = p_payout_id and released_at is null;
  delete from public.ledger_settlements where payout_id = p_payout_id;
$$;

-- -----------------------------------------------------------------------------
-- Partner: request a payout
-- -----------------------------------------------------------------------------
create or replace function public.affiliate_request_payout(p_amount_cents bigint, p_idempotency_key text default null)
returns table (id uuid, public_ref text, amount_cents bigint, status public.payout_status, created boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  a public.affiliates;
  me public.profiles;
  p public.payouts;
  v_min bigint := coalesce((public.setting('payout.minimum_cents'))::bigint, 0);
  v_currency char(3) := 'EUR';
  v_available bigint;
  v_method text;
  v_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_params jsonb;
begin
  if auth.uid() is null then raise exception 'payout.unauthenticated'; end if;
  -- The lock serialises every request of this partner.
  select * into a from public.affiliates where profile_id = auth.uid() and deleted_at is null for update;
  if not found then raise exception 'payout.no_affiliate'; end if;

  -- Same click, same key: return the payout already created (idempotent).
  if v_key is not null then
    select * into p from public.payouts x where x.affiliate_id = a.id and x.idempotency_key = v_key;
    if found then return query select p.id, p.public_ref, p.amount_cents, p.status, false; return; end if;
  end if;

  if a.status <> 'approved' then raise exception 'payout.not_approved'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'payout.invalid_amount'; end if;
  if p_amount_cents < v_min then raise exception 'payout.below_minimum'; end if;
  if exists (select 1 from public.payouts x where x.affiliate_id = a.id and x.status in ('requested', 'scheduled', 'processing')) then
    raise exception 'payout.already_open';
  end if;
  v_available := public.affiliate_payable_cents(a.id, v_currency);
  if p_amount_cents > v_available then raise exception 'payout.insufficient_balance'; end if;

  v_method := case when a.payouts_enabled and a.stripe_connected_account_id is not null then 'stripe_connect' else 'manual' end;
  insert into public.payouts (affiliate_id, amount_cents, currency, status, scheduled_for, created_by, requested_by,
                              method, stripe_account_id, balance_before_cents, idempotency_key)
  values (a.id, p_amount_cents, v_currency, 'requested', current_date, auth.uid(), auth.uid(),
          v_method, case when v_method = 'stripe_connect' then a.stripe_connected_account_id end, v_available, v_key)
  returning * into p;
  perform public.payout_allocate(p.id, a.id, v_currency, p_amount_cents);
  perform public.payout_log(p, null, 'requested', 'affiliate', null);

  select * into me from public.profiles where id = auth.uid();
  v_params := jsonb_build_object('amount_cents', p.amount_cents, 'currency', p.currency, 'payout_ref', p.public_ref,
    'balance_before_cents', v_available, 'requested_at', p.created_at, 'method', v_method,
    'first_name', split_part(coalesce(nullif(me.full_name, ''), ''), ' ', 1),
    'affiliate_name', coalesce(nullif(me.full_name, ''), me.email::text), 'affiliate_email', me.email::text,
    'admin_path', '/admin/payouts/' || p.id);

  -- Confirmation to the partner (transactional: not subject to notification preferences).
  perform public.queue_email('affiliate.payout_requested', 'affiliate', auth.uid(), null, null, 'payout', p.id::text,
    v_params, 'affiliate.payout_requested:' || p.id, null);
  perform public.notify_affiliate(a.id, 'payout', 'notifications.payoutRequested', v_params, '/dashboard/payouts');
  -- Every admin: one email in their own locale + the bell in the admin.
  insert into public.email_events (idempotency_key, template, recipient_type, recipient_profile_id, related_entity, related_id, params)
  select 'staff.payout_request:' || p.id || ':' || s.id, 'staff.payout_request', 'staff', s.id, 'payout', p.id::text, v_params
    from public.profiles s
   where s.role in ('super_admin', 'admin') and s.deleted_at is null and s.email is not null
  on conflict (idempotency_key) do nothing;
  insert into public.notifications (profile_id, type, title_key, params, href)
  select s.id, 'payout_request', 'notifications.payoutRequestStaff', v_params, '/admin/payouts/' || p.id
    from public.profiles s where s.role in ('super_admin', 'admin') and s.deleted_at is null;

  return query select p.id, p.public_ref, p.amount_cents, p.status, true;
end $$;

-- -----------------------------------------------------------------------------
-- Staff: accept → processing, paid, rejected, failed
-- -----------------------------------------------------------------------------
create or replace function public.staff_process_payout(p_payout_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.payouts;
  v_from public.payout_status;
  v_problem text;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into p from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout.not_found'; end if;
  if p.status = 'processing' then return; end if;
  if p.status not in ('requested', 'scheduled') then raise exception 'payout.invalid_status:%', p.status; end if;
  v_problem := public.payout_problem(p.id);
  if v_problem is not null then raise exception 'payout.ineligible:%', v_problem; end if;
  v_from := p.status;
  update public.payouts set status = 'processing', processed_at = now(), admin_note = coalesce(nullif(btrim(p_note), ''), admin_note)
   where id = p.id returning * into p;
  perform public.payout_log(p, v_from, 'processing', 'staff', nullif(btrim(p_note), ''));
  perform public.notify_affiliate(p.affiliate_id, 'payout', 'notifications.payoutProcessing',
    jsonb_build_object('amount_cents', p.amount_cents, 'currency', p.currency, 'payout_ref', p.public_ref), '/dashboard/payouts');
end $$;

-- Pays a payout: each allocation becomes a `payout` ledger entry; a commission
-- turns `paid` once all its cents are paid. Also settles legacy payouts.
create or replace function public.staff_mark_payout_paid(p_payout_id uuid, p_provider_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.payouts;
  c public.commissions;
  r record;
  v_from public.payout_status;
  v_problem text;
  v_params jsonb;
  v_ref text := nullif(btrim(coalesce(p_provider_ref, '')), '');
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into p from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout.not_found'; end if;
  if p.status = 'paid' then return; end if;
  if p.status not in ('requested', 'scheduled', 'processing') then raise exception 'payout.invalid_status:%', p.status; end if;
  if v_ref is null then raise exception 'payout.reference_required'; end if;
  v_problem := public.payout_problem(p.id);
  if v_problem is not null then raise exception 'payout.ineligible:%', v_problem; end if;
  v_from := p.status;

  update public.payouts set status = 'paid', paid_at = now(), provider_ref = v_ref,
         processed_at = coalesce(processed_at, now())
   where id = p.id returning * into p;
  for r in select a.commission_id, a.amount_cents from public.payout_allocations a
            where a.payout_id = p.id and a.released_at is null order by a.created_at loop
    select * into c from public.commissions where id = r.commission_id for update;
    perform public.ledger_write(c, 'payout', 'available', 'paid', r.amount_cents, null, p.id);
    if c.status = 'available' and (
        select coalesce(sum(a.amount_cents), 0) from public.payout_allocations a join public.payouts x on x.id = a.payout_id
         where a.commission_id = c.id and a.released_at is null and x.status = 'paid') >= c.amount_cents then
      update public.commissions set status = 'paid', paid_at = now() where id = c.id;
    end if;
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
  perform public.payout_log(p, v_from, 'paid', 'staff', v_ref);
end $$;

create or replace function public.staff_reject_payout(p_payout_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.payouts;
  v_from public.payout_status;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_params jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if v_reason is null then raise exception 'payout.reason_required'; end if;
  select * into p from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout.not_found'; end if;
  if p.status = 'rejected' then return; end if;
  if p.status not in ('requested', 'scheduled', 'processing') then raise exception 'payout.invalid_status:%', p.status; end if;
  v_from := p.status;
  update public.payouts set status = 'rejected', rejected_at = now(), rejection_reason = v_reason where id = p.id returning * into p;
  perform public.payout_release(p.id);
  perform public.payout_log(p, v_from, 'rejected', 'staff', v_reason);
  v_params := jsonb_build_object('amount_cents', p.amount_cents, 'currency', p.currency, 'payout_ref', p.public_ref, 'reason', v_reason);
  perform public.notify_affiliate(p.affiliate_id, 'payout', 'notifications.payoutRejected', v_params, '/dashboard/payouts');
  perform public.queue_email('affiliate.payout_rejected', 'affiliate', public.affiliate_profile(p.affiliate_id), null, null,
    'payout', p.id::text, v_params, 'affiliate.payout_rejected:' || p.id, null);
end $$;

-- Provider failure (bank rejected the transfer…). Also the hook a future Stripe
-- `transfer.failed` / `payout.failed` handler will call.
create or replace function public.staff_fail_payout(p_payout_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.payouts;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if v_reason is null then raise exception 'payout.reason_required'; end if;
  select * into p from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout.not_found'; end if;
  if p.status = 'failed' then return; end if;
  if p.status <> 'processing' then raise exception 'payout.invalid_status:%', p.status; end if;
  update public.payouts set status = 'failed', failed_at = now(), failure_reason = v_reason where id = p.id returning * into p;
  perform public.payout_release(p.id);
  perform public.payout_log(p, 'processing', 'failed', 'staff', v_reason);
  perform public.notify_affiliate(p.affiliate_id, 'payout', 'notifications.payoutFailed',
    jsonb_build_object('amount_cents', p.amount_cents, 'currency', p.currency, 'payout_ref', p.public_ref, 'reason', v_reason), '/dashboard/payouts');
end $$;

-- Legacy staff-initiated payout of the whole payable balance, now on allocations.
create or replace function public.staff_create_payout(p_affiliate_id uuid, p_scheduled_for date default current_date)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.affiliates;
  p public.payouts;
  v_currency char(3) := 'EUR';
  v_total bigint;
  v_min bigint := coalesce((public.setting('payout.minimum_cents'))::bigint, 0);
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select * into a from public.affiliates where id = p_affiliate_id for update;
  if not found then raise exception 'affiliate not found'; end if;
  if a.status <> 'approved' then raise exception 'affiliate is not approved'; end if;
  if exists (select 1 from public.payouts where affiliate_id = p_affiliate_id and status in ('requested', 'scheduled', 'processing')) then
    raise exception 'a payout is already in progress for this affiliate';
  end if;
  v_total := public.affiliate_payable_cents(a.id, v_currency);
  if v_total <= 0 or v_total < v_min then raise exception 'balance below payout minimum'; end if;
  insert into public.payouts (affiliate_id, amount_cents, currency, status, scheduled_for, created_by, method, stripe_account_id, balance_before_cents)
  values (a.id, v_total, v_currency, 'scheduled', p_scheduled_for, auth.uid(),
          case when a.payouts_enabled and a.stripe_connected_account_id is not null then 'stripe_connect' else 'manual' end,
          case when a.payouts_enabled then a.stripe_connected_account_id end, v_total)
  returning * into p;
  perform public.payout_allocate(p.id, a.id, v_currency, v_total);
  perform public.payout_log(p, null, 'scheduled', 'staff', null);
  return p.id;
end $$;

-- -----------------------------------------------------------------------------
-- Refunds after a partial payout: the already-paid cents of an `available`
-- commission are recovered (clawback), the rest is reversed normally.
-- Same contract as 20260925000003_v02_engine.sql otherwise.
-- -----------------------------------------------------------------------------
create or replace function public.commission_reverse(p_commission_id uuid, p_reason text, p_amount bigint default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
  v_delta bigint;
  v_full boolean;
  v_paid bigint;
  v_unpaid_part bigint;
  v_paid_part bigint;
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
    select coalesce(sum(a.amount_cents), 0) into v_paid from public.payout_allocations a
      join public.payouts x on x.id = a.payout_id
     where a.commission_id = c.id and a.released_at is null and x.status = 'paid';
    v_unpaid_part := least(v_delta, c.amount_cents - v_paid);
    v_paid_part := v_delta - v_unpaid_part;
    if v_unpaid_part > 0 then
      perform public.ledger_write(c, 'reversal', c.status::text::public.ledger_bucket, 'reversed', v_unpaid_part, p_reason);
    end if;
    if v_paid_part > 0 then
      perform public.ledger_write(c, 'clawback', 'paid', 'reversed', -v_paid_part, p_reason);
      update public.commissions set recovery_status = 'required' where id = c.id;
    end if;
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

-- -----------------------------------------------------------------------------
-- Stripe Connect: keep the last 4 digits of the payout account for display.
-- -----------------------------------------------------------------------------
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
    connect_payout_last4 = case when p->>'payout_last4' ~ '^[0-9]{4}$' then p->>'payout_last4' else connect_payout_last4 end,
    connect_updated_at = now()
  where stripe_connected_account_id = p->>'stripe_account_id';
  return found;
end $$;

-- -----------------------------------------------------------------------------
-- Balances: requested money is no longer "available"; partial payouts count as paid.
-- -----------------------------------------------------------------------------
drop view if exists public.affiliate_balances;
create view public.affiliate_balances with (security_invoker = true) as
with alloc as (
  select a.commission_id,
         coalesce(sum(a.amount_cents) filter (where x.status = 'paid'), 0) as paid_cents,
         coalesce(sum(a.amount_cents) filter (where x.status <> 'paid'), 0) as open_cents
    from public.payout_allocations a join public.payouts x on x.id = a.payout_id
   where a.released_at is null
   group by a.commission_id
)
select
  af.id as affiliate_id,
  coalesce(sum(c.amount_cents) filter (where c.status = 'awaiting_payment'), 0) as awaiting_payment_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'pending'), 0)          as pending_cents,
  coalesce(sum(greatest(c.amount_cents - coalesce(al.paid_cents, 0), 0)) filter (where c.status = 'disputed'), 0) as disputed_cents,
  coalesce(sum(greatest(c.amount_cents - coalesce(al.paid_cents, 0) - coalesce(al.open_cents, 0), 0)) filter (where c.status = 'available'), 0)
    + coalesce((select sum(l.amount_cents) from public.commission_ledger l
                 where l.affiliate_id = af.id
                   and (l.entry_type = 'clawback' or (l.entry_type = 'adjustment' and l.commission_id is null))
                   and not exists (select 1 from public.ledger_settlements st where st.ledger_id = l.id)), 0)
                                                                                as available_cents,
  coalesce((select sum(x.amount_cents) from public.payouts x
             where x.affiliate_id = af.id and x.status in ('requested', 'scheduled', 'processing')), 0) as requested_cents,
  coalesce(sum(c.amount_cents) filter (where c.status = 'paid'), 0)
    + coalesce(sum(al.paid_cents) filter (where c.status <> 'paid'), 0)        as paid_cents,
  coalesce(sum(c.amount_cents) filter (where c.status in ('available', 'paid')), 0) as lifetime_earned_cents
from public.affiliates af
left join public.commissions c on c.affiliate_id = af.id
left join alloc al on al.commission_id = c.id
group by af.id;

grant select on public.affiliate_balances to authenticated;
revoke all on public.affiliate_balances from anon;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
revoke execute on function
  public.commission_allocated_cents(uuid),
  public.affiliate_payable_cents(uuid, char),
  public.payout_allocate(uuid, uuid, char, bigint),
  public.payout_problem(uuid),
  public.payout_log(public.payouts, public.payout_status, public.payout_status, text, text),
  public.payout_release(uuid)
  from anon, authenticated, public;

revoke execute on function
  public.affiliate_request_payout(bigint, text),
  public.staff_process_payout(uuid, text),
  public.staff_mark_payout_paid(uuid, text),
  public.staff_reject_payout(uuid, text),
  public.staff_fail_payout(uuid, text),
  public.staff_create_payout(uuid, date)
  from anon, public;
grant execute on function
  public.affiliate_request_payout(bigint, text),
  public.staff_process_payout(uuid, text),
  public.staff_mark_payout_paid(uuid, text),
  public.staff_reject_payout(uuid, text),
  public.staff_fail_payout(uuid, text),
  public.staff_create_payout(uuid, date)
  to authenticated;
