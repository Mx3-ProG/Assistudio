-- =============================================================================
-- STUDIO offers V3 (2026-09-25): three offers of the same STUDIO product.
--
--   Studio One      €500 one-time   (lookup key studio_one_eur)
--   Studio Pro      €3,000 / year   (lookup key studio_pro_yearly_eur)
--   Studio Premium  €6,000 / year   (lookup key studio_yearly_eur — the existing offer)
--
-- Affiliation is unchanged: no new rate, no rate modified. The active
-- product-level rule (25% direct, first sale + renewals) and the 5% direct
-- sponsor setting apply to every offer of the product as they already do.
-- A one-time offer has no renewal, so it pays its commission once.
-- `offers.commission_rate` is only the engine's fallback when no rule matches;
-- it is set to the current direct rate for consistency.
-- =============================================================================

update public.offers
   set name = 'Studio Premium — Annual'
 where stripe_lookup_key = 'studio_yearly_eur';

insert into public.offers
  (product_id, name, price_cents, currency, price_type, billing_interval, interval_count,
   commission_rate, commission_recurring, stripe_lookup_key)
select p.id, v.name, v.price_cents, 'EUR', v.price_type, v.billing_interval::public.billing_interval, 1,
       (select o.commission_rate from public.offers o where o.stripe_lookup_key = 'studio_yearly_eur'),
       v.recurring, v.lookup_key
  from public.products p
 cross join (values
   ('Studio One — One-time',  50000::bigint,  'one_time',  'one_time', false, 'studio_one_eur'),
   ('Studio Pro — Annual',    300000::bigint, 'recurring', 'year',     true,  'studio_pro_yearly_eur')
 ) as v(name, price_cents, price_type, billing_interval, recurring, lookup_key)
 where p.slug = 'studio'
on conflict (stripe_lookup_key) do nothing;

-- Manual sales from a lead used "the latest active STUDIO offer", which is no
-- longer unique. They keep recording the offer they always did (Premium).
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

  select * into o from public.offers where stripe_lookup_key = 'studio_yearly_eur' and is_active;
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
