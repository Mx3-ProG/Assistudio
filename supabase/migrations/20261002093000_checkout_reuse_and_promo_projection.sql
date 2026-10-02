-- Keep repeated checkout mounts inexpensive and make recurring projections use
-- the same affiliate-funded promotion formula as paid commissions.
create index if not exists checkout_sessions_visitor_recent_idx
  on public.checkout_sessions (session_key, created_at desc)
  where session_key is not null;

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
  v_discount bigint;
  v_catalog bigint;
  v_net bigint;
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

  v_discount := coalesce(last_sale.discount_amount_cents, 0);
  v_catalog := coalesce(last_sale.catalog_amount_cents, last_sale.gross_amount_cents, o.price_cents);
  v_net := coalesce(last_sale.net_amount_cents + v_discount, o.price_cents);
  e := public.evaluate_commission_for(s.affiliate_id, s.offer_id, s.customer_id, s.id, 'renewal', o.currency,
         v_catalog, v_net, s.current_period_end, null);
  if e.eligible and v_discount > 0 then
    e.amount_cents := greatest(0, e.amount_cents - v_discount);
    e.rate := case when e.base_cents > 0
      then round(e.amount_cents::numeric / e.base_cents, 4) else 0 end;
    if e.amount_cents = 0 then
      e.eligible := false;
      e.reason := 'promotion_consumed_commission';
    end if;
  end if;
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

revoke execute on function public.project_next_commission(uuid) from anon, authenticated, public;

-- The catalog isolation renamed Premium's lookup key. Keep the staff-side
-- lead conversion on the Assistudio offer instead of the unrelated Studio app.
create or replace function public.staff_create_sale_from_lead(p_lead_id uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  l public.leads;
  o public.offers;
  v_customer uuid;
  v_sale uuid;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into l from public.leads where id = p_lead_id and deleted_at is null for update;
  if not found then raise exception 'lead not found'; end if;
  if l.status = 'converted' then raise exception 'lead already converted'; end if;

  select * into o from public.offers
   where stripe_lookup_key = 'assistudio_premium_yearly_eur' and is_active;
  if not found then raise exception 'Studio Premium offer not found'; end if;

  insert into public.customers (company_name, contact_name, email)
  values (l.company, l.full_name, l.email) returning id into v_customer;

  insert into public.sales (customer_id, offer_id, affiliate_id, lead_id, link_id, campaign_id, kind, status, gross_amount_cents, currency)
  values (v_customer, o.id, l.affiliate_id, l.id, l.link_id, l.campaign_id, 'new', 'pending', o.price_cents, o.currency)
  returning id into v_sale;

  update public.leads set status = 'converted' where id = l.id;
  perform public.log_audit('sale.create_from_lead', 'sale', v_sale::text, null,
    jsonb_build_object('lead_id', l.id, 'affiliate_id', l.affiliate_id), p_reason);
  return v_sale;
end $$;

revoke execute on function public.staff_create_sale_from_lead(uuid, text) from anon, public;
