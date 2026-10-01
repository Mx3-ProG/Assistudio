-- Customer-facing offer names now match the site, Stripe Checkout, invoices,
-- emails and dashboards. Stable offer ids and Stripe lookup keys do not change,
-- so existing purchases and subscriptions remain attached to their original rows.
update public.offers set name = 'Studio One' where stripe_lookup_key = 'studio_one_eur';
update public.offers set name = 'Studio Pro' where stripe_lookup_key = 'studio_pro_yearly_eur';
update public.offers set name = 'Studio Premium' where stripe_lookup_key = 'studio_yearly_eur';
