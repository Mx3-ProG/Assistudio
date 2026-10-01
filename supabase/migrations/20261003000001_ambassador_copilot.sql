-- =============================================================================
-- V0.4 — Ambassador copilot.
--
-- No new table: the copilot reuses public.sales_content (versioned, per locale,
-- admin-published) and public.markets (sectors). This migration only allows
-- four new content kinds:
--   pitch       "Understand Studio" at 15 s / 30 s / 2 min
--   case_study  a project, template or product an ambassador can show
--   diagnostic  questions that guide the conversation
--   sequence    a follow-up sequence (J+1, J+3, J+7…) computed on the CRM
-- Body shapes are validated in the app (src/lib/sales/content.ts).
-- =============================================================================

alter table public.sales_content drop constraint if exists sales_content_kind_check;
alter table public.sales_content add constraint sales_content_kind_check check (kind in (
  'playbook', 'call_script', 'message', 'email_template', 'objection', 'knowledge',
  'asset', 'sales_angle', 'page_template', 'page_variant', 'journey',
  'pitch', 'case_study', 'diagnostic', 'sequence'));
