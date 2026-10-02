-- Give Assistudio its own Stripe catalogue namespace. The previous `studio_*`
-- lookup keys belong to a separate site and must remain untouched in Stripe.
update public.offers
set stripe_lookup_key = case stripe_lookup_key
  when 'studio_one_eur' then 'assistudio_one_eur'
  when 'studio_pro_yearly_eur' then 'assistudio_pro_yearly_eur'
  when 'studio_yearly_eur' then 'assistudio_premium_yearly_eur'
  else stripe_lookup_key
end,
stripe_price_id = null,
updated_at = now()
where stripe_lookup_key in ('studio_one_eur', 'studio_pro_yearly_eur', 'studio_yearly_eur');
