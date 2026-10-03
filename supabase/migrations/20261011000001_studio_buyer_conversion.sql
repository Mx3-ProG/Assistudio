-- Buyer conversion V1: truthful Studio onboarding capacity and public funnel events.
insert into public.settings (key, value, is_public, description) values
  ('studio.capacity_enabled', 'false'::jsonb, true, 'Show truthful Pro/Premium onboarding capacity'),
  ('studio.monthly_capacity', '0'::jsonb, true, 'Maximum accompanied Studio onboardings this month'),
  ('studio.remaining_capacity', '0'::jsonb, true, 'Accompanied Studio onboarding places still available'),
  ('studio.next_onboarding_window', '""'::jsonb, true, 'Human-maintained next onboarding window label')
on conflict (key) do nothing;

alter table public.funnel_events drop constraint if exists funnel_events_event_check;
alter table public.funnel_events add constraint funnel_events_event_check check (event in (
  'home_view', 'hero_signup_click', 'see_product_click', 'studio_demo_click',
  'commission_simulator_interaction', 'sales_center_click', 'first_prospect_cta', 'cta_click',
  'signup_started', 'signup_completed', 'onboarding_started', 'onboarding_completed',
  'affiliate_link_copied', 'sales_script_copied', 'prospect_added', 'prospect_submitted',
  'studio_view', 'studio_cta_click', 'studio_demo_interaction', 'studio_proof_view',
  'studio_offer_selected', 'studio_form_started', 'studio_lead_submitted', 'studio_buy_view'
));
