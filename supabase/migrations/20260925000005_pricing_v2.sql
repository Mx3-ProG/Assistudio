-- =============================================================================
-- STUDIO pricing change (2026-09-24): €6,000 / year, 30% commission on every
-- eligible payment (first sale and renewals). No cap on the amount an affiliate
-- can earn: the engine has none, and none is added here.
--
-- Commissions already created keep the rate they were computed with (stored on
-- each commission row). Only future payments use the new values.
-- =============================================================================

-- Price: Stripe prices are immutable, so the cached price id is dropped and
-- checkout re-resolves the lookup key (run `npm run stripe:setup`, which moves
-- the lookup key to a new €6,000 price). Until then, checkout is blocked by
-- the amount check rather than selling at the old price.
update public.offers
   set price_cents = 600000, commission_rate = 0.3000, stripe_price_id = null
 where stripe_lookup_key = 'studio_yearly_eur';

-- Commission rule: close the 50% rule and open a 30% one, so the history of
-- which rate applied when stays readable.
update public.commission_rules
   set valid_to = now(), is_active = false
 where name = 'STUDIO — default affiliate commission' and is_active and valid_to is null;

insert into public.commission_rules (name, product_id, commission_type, rate, applies_to_new, applies_to_renewals, valid_from)
select 'STUDIO — default affiliate commission (30%)', p.id, 'percentage', 0.3000, true, true, now()
  from public.products p where p.slug = 'studio';
