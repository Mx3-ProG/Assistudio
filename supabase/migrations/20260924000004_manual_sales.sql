-- =============================================================================
-- Manual sale recording (V0, before a payment provider is wired).
-- Staff convert an attributed lead into a pending sale; payment is then
-- confirmed (webhook later, manually for now). Everything is audit-logged.
-- =============================================================================

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

  select o2.* into o from public.offers o2 join public.products p on p.id = o2.product_id
   where p.slug = 'studio' and o2.is_active order by o2.valid_from desc limit 1;

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

-- Staff may correct a payment status manually (audited in the app layer).
create or replace function public.staff_set_sale_status(p_sale_id uuid, p_status public.sale_status, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.sales;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'reason required'; end if;
  select * into s from public.sales where id = p_sale_id for update;
  update public.sales set
    status = p_status,
    paid_at = case when p_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
    refunded_at = case when p_status in ('refunded', 'chargeback') then now() else refunded_at end
  where id = s.id;
  perform public.log_audit('sale.status', 'sale', s.id::text,
    jsonb_build_object('status', s.status), jsonb_build_object('status', p_status), p_reason);
end $$;

-- A first paid sale opens the annual subscription (renewal base).
create or replace function public.ensure_subscription_on_paid() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_sub uuid;
  o public.offers;
begin
  if new.status = 'paid' and new.kind = 'new' and new.subscription_id is null then
    select * into o from public.offers where id = new.offer_id;
    insert into public.subscriptions (customer_id, offer_id, affiliate_id, status, started_at, current_period_start, current_period_end)
    values (new.customer_id, new.offer_id, new.affiliate_id, 'active', coalesce(new.paid_at, now()), coalesce(new.paid_at, now()),
            coalesce(new.paid_at, now()) + case o.billing_interval when 'month' then interval '1 month' else interval '1 year' end)
    returning id into v_sub;
    update public.sales set subscription_id = v_sub where id = new.id;
  elsif new.status in ('refunded', 'chargeback', 'cancelled') and new.subscription_id is not null and new.kind = 'new' then
    update public.subscriptions set status = 'cancelled', cancelled_at = now() where id = new.subscription_id;
    if new.affiliate_id is not null then
      insert into public.activity_events (affiliate_id, type, payload) values (new.affiliate_id, 'customer_lost', '{}'::jsonb);
    end if;
  end if;
  return new;
end $$;

create trigger sales_subscription_lifecycle
  after insert or update of status on public.sales
  for each row execute function public.ensure_subscription_on_paid();

revoke execute on function public.staff_create_sale_from_lead(uuid, text), public.staff_set_sale_status(uuid, public.sale_status, text) from anon, public;
