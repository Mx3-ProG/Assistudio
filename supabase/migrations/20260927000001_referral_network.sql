-- =============================================================================
-- STUDIO V0.4 — Affiliate-to-affiliate referral network.
--
-- A seller earns 25% of an eligible payment. Their direct sponsor earns an
-- additional 5% of the same commission base. The sponsor relationship is set
-- once, at registration, and is never inferred from a sale URL.
-- =============================================================================

insert into public.settings (key, value, is_public, description) values
  ('referrals.sponsor_rate', '0.0500'::jsonb, true,
   'Commission rate paid to the direct sponsor of the selling affiliate')
on conflict (key) do update set value = excluded.value, description = excluded.description;

-- Future direct commissions use 25%. Existing commission rows keep their
-- historical stored rate and amount.
update public.offers
   set commission_rate = 0.2500
 where stripe_lookup_key = 'studio_yearly_eur';

update public.commission_rules
   set valid_to = now(), is_active = false
 where name = 'STUDIO — default affiliate commission (30%)'
   and is_active and valid_to is null;

insert into public.commission_rules
  (name, product_id, commission_type, rate, applies_to_new, applies_to_renewals, valid_from)
select 'STUDIO — direct affiliate commission (25%)', p.id, 'percentage', 0.2500, true, true, now()
  from public.products p
 where p.slug = 'studio'
   and not exists (
     select 1 from public.commission_rules r
      where r.name = 'STUDIO — direct affiliate commission (25%)' and r.is_active
   );

alter table public.affiliates
  add column if not exists sponsor_id uuid references public.affiliates (id) on delete set null;
create index if not exists affiliates_sponsor_idx
  on public.affiliates (sponsor_id, created_at desc) where deleted_at is null;
alter table public.affiliates
  add constraint affiliates_not_own_sponsor check (sponsor_id is null or sponsor_id <> id);

alter table public.commissions
  add column if not exists commission_role text not null default 'direct'
    check (commission_role in ('direct', 'sponsor')),
  add column if not exists source_affiliate_id uuid references public.affiliates (id) on delete set null;
create index if not exists commissions_sponsor_source_idx
  on public.commissions (source_affiliate_id, created_at desc)
  where commission_role = 'sponsor';

-- Affiliates cannot attach or replace a sponsor from the client. Staff can
-- correct the relationship when required; cycles are rejected for every actor.
create or replace function public.guard_affiliate_fields() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_cursor uuid;
begin
  if new.sponsor_id is not null then
    v_cursor := new.sponsor_id;
    for i in 1..100 loop
      if v_cursor = new.id then raise exception 'Affiliate sponsorship cycle'; end if;
      select sponsor_id into v_cursor from public.affiliates where id = v_cursor;
      exit when v_cursor is null;
    end loop;
    if v_cursor is not null then raise exception 'Affiliate sponsorship chain is too deep'; end if;
  end if;
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
       or new.connect_requirements_status is distinct from old.connect_requirements_status
       or new.sponsor_id is distinct from old.sponsor_id then
      raise exception 'Field is managed by STUDIO staff';
    end if;
  end if;
  return new;
end $$;

-- The sign-up metadata only carries a public affiliate code/slug. The trigger
-- resolves it server-side and stores the immutable affiliate id.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  auto_approve boolean;
  v_sponsor uuid;
  v_code text := nullif(trim(new.raw_user_meta_data ->> 'sponsor_code'), '');
begin
  select coalesce((value)::boolean, false) into auto_approve
    from public.settings where key = 'affiliates.auto_approve';
  if v_code is not null then
    select id into v_sponsor from public.affiliates
     where deleted_at is null and status = 'approved'
       and (upper(code) = upper(v_code) or lower(slug::text) = lower(v_code))
     limit 1;
  end if;

  insert into public.profiles (id, email, full_name, locale)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(new.raw_user_meta_data ->> 'locale', 'en'));

  insert into public.affiliates (profile_id, status, approved_at, country, application, sponsor_id)
  values (
    new.id,
    case when auto_approve then 'approved'::public.affiliate_status else 'pending' end,
    case when auto_approve then now() end,
    new.raw_user_meta_data ->> 'country',
    coalesce(new.raw_user_meta_data -> 'application', '{}'::jsonb),
    v_sponsor
  );
  return new;
end $$;

-- Creating the direct commission creates the sponsor commission in the same
-- transaction. Both rows therefore share the sale lifecycle and ledger.
create or replace function public.accrue_sponsor_commission() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_sponsor uuid;
  v_status public.commission_status;
  v_rate numeric(5,4) := coalesce((public.setting('referrals.sponsor_rate'))::numeric, 0.0500);
  v_amount bigint;
  v_commission public.commissions;
  v_sale public.sales;
begin
  if new.commission_role <> 'direct' then return new; end if;
  select sponsor_id into v_sponsor from public.affiliates
   where id = new.affiliate_id and deleted_at is null;
  if v_sponsor is null or v_rate <= 0 then return new; end if;

  select * into v_sale from public.sales where id = new.sale_id;
  v_amount := round(new.base_amount_cents * v_rate)::bigint;
  if v_amount <= 0 then return new; end if;
  v_status := case
    when (select status from public.affiliates where id = v_sponsor) = 'approved'
      then new.status
    else 'disputed'::public.commission_status
  end;

  insert into public.commissions (
    affiliate_id, sale_id, rule_id, kind, rate, base_amount_cents, amount_cents,
    currency, status, validated_at, hold_until, expected_payment_date,
    dispute_reason, commission_role, source_affiliate_id
  ) values (
    v_sponsor, new.sale_id, null, new.kind, v_rate, new.base_amount_cents, v_amount,
    new.currency, v_status, new.validated_at, new.hold_until, new.expected_payment_date,
    case when v_status = 'disputed' then 'sponsor_not_approved' end,
    'sponsor', new.affiliate_id
  )
  on conflict (sale_id, affiliate_id) do nothing
  returning * into v_commission;

  if v_commission.id is not null then
    perform public.ledger_write(
      v_commission,
      (case when v_sale.kind = 'renewal' then 'renewal_commission' else 'commission' end)::public.ledger_entry_type,
      null, v_status::text::public.ledger_bucket, v_commission.amount_cents,
      'Direct affiliate referral commission'
    );
    perform public.add_activity(v_sponsor,
      case when v_status = 'disputed' then 'commission_disputed' else 'commission_pending' end,
      jsonb_build_object('sale_ref', v_sale.public_ref, 'commission_cents', v_amount,
        'currency', new.currency, 'kind', v_sale.kind, 'commission_role', 'sponsor'));
    perform public.notify_affiliate(v_sponsor, 'commission', 'notifications.commissionPending',
      jsonb_build_object('sale_ref', v_sale.public_ref, 'commission_cents', v_amount,
        'currency', new.currency, 'commission_role', 'sponsor'), '/dashboard/referrals');
  end if;
  return new;
end $$;

drop trigger if exists commissions_accrue_sponsor on public.commissions;
create trigger commissions_accrue_sponsor after insert on public.commissions
  for each row execute function public.accrue_sponsor_commission();

-- A staff attribution correction reverses the direct commission explicitly.
-- Mirror that terminal state to its sponsor counterpart as well.
create or replace function public.sync_sponsor_commission_reversal() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_sponsor_commission uuid;
begin
  if new.commission_role = 'direct' and new.status = 'reversed' and old.status <> 'reversed' then
    select id into v_sponsor_commission from public.commissions
     where sale_id = new.sale_id and commission_role = 'sponsor';
    if v_sponsor_commission is not null then
      perform public.commission_reverse(v_sponsor_commission,
        coalesce(new.reversal_reason, 'direct commission reversed'));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists commissions_sync_sponsor_reversal on public.commissions;
create trigger commissions_sync_sponsor_reversal after update of status on public.commissions
  for each row execute function public.sync_sponsor_commission_reversal();

-- Every commission attached to the sale (direct and sponsor) follows refunds,
-- disputes and restorations. The previous engine only expected one row.
create or replace function public.on_sale_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.commissions;
begin
  if new.affiliate_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;

  if new.status = 'paid' then
    if not exists (select 1 from public.commissions where sale_id = new.id and commission_role = 'direct') then
      perform public.commission_accrue(new);
    elsif tg_op = 'UPDATE' and old.status = 'disputed' then
      for c in select * from public.commissions where sale_id = new.id and status = 'disputed' for update loop
        perform public.commission_restore(c.id, 'payment dispute closed in favour of STUDIO');
      end loop;
    end if;
  elsif new.status = 'disputed' then
    for c in select * from public.commissions where sale_id = new.id for update loop
      perform public.commission_set_disputed(c.id, 'payment_dispute');
    end loop;
  elsif new.status in ('refunded', 'chargeback', 'cancelled', 'failed') then
    for c in select * from public.commissions where sale_id = new.id for update loop
      perform public.commission_reverse(c.id, new.status::text);
    end loop;
    if new.status = 'chargeback' then
      insert into public.fraud_flags (type, severity, affiliate_id, entity, entity_id, signals)
      values ('commission_dispute', 2, new.affiliate_id, 'sale', new.id::text,
              jsonb_build_object('reason', 'chargeback'));
    end if;
  end if;
  return new;
end $$;

-- Safe read model for the signed-in affiliate. It exposes only public referral
-- metrics, never a recruit's email, customers or private CRM data.
create or replace function public.affiliate_referral_dashboard() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (
    select a.id, a.code, a.slug, a.sponsor_id from public.affiliates a
     where a.id = public.current_affiliate_id()
  ), children as (
    select a.id, coalesce(p.display_name, p.full_name, 'Partner') as name,
           a.status::text as status, a.created_at,
           count(distinct s.id) filter (where s.status in ('paid', 'partially_refunded', 'disputed'))::int as sales,
           coalesce(sum(c.amount_cents) filter (where c.status <> 'reversed'), 0)::bigint as sponsor_commission_cents
      from public.affiliates a
      join public.profiles p on p.id = a.profile_id
      left join public.sales s on s.affiliate_id = a.id
      left join public.commissions c on c.sale_id = s.id
        and c.affiliate_id = (select id from me) and c.commission_role = 'sponsor'
     where a.sponsor_id = (select id from me) and a.deleted_at is null
     group by a.id, p.display_name, p.full_name, a.status, a.created_at
  )
  select jsonb_build_object(
    'code', me.code,
    'slug', me.slug,
    'sponsor', case when sp.id is null then null else jsonb_build_object(
      'name', coalesce(spp.display_name, spp.full_name, 'Partner')) end,
    'recruits', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'status', status, 'joinedAt', created_at,
      'sales', sales, 'commissionCents', sponsor_commission_cents) order by created_at desc) from children), '[]'::jsonb),
    'totalCommissionCents', coalesce((select sum(amount_cents) from public.commissions
      where affiliate_id = me.id and commission_role = 'sponsor' and status <> 'reversed'), 0),
    'pendingCommissionCents', coalesce((select sum(amount_cents) from public.commissions
      where affiliate_id = me.id and commission_role = 'sponsor' and status in ('pending', 'disputed')), 0),
    'availableCommissionCents', coalesce((select sum(amount_cents) from public.commissions
      where affiliate_id = me.id and commission_role = 'sponsor' and status = 'available'), 0)
  )
  from me
  left join public.affiliates sp on sp.id = me.sponsor_id
  left join public.profiles spp on spp.id = sp.profile_id
$$;

revoke execute on function public.accrue_sponsor_commission() from anon, authenticated, public;
revoke execute on function public.sync_sponsor_commission_reversal() from anon, authenticated, public;
revoke execute on function public.affiliate_referral_dashboard() from anon, public;
grant execute on function public.affiliate_referral_dashboard() to authenticated;
