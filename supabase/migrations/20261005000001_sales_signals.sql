-- V1 Sales Center: structured, admin-editable buying signals.
-- A signal links the prospect's words to a likely problem, the next question,
-- the relevant Studio capability, safe proof and a concrete next action.

alter table public.sales_content drop constraint if exists sales_content_kind_check;
alter table public.sales_content add constraint sales_content_kind_check check (kind in (
  'playbook', 'call_script', 'message', 'email_template', 'objection', 'knowledge',
  'asset', 'sales_angle', 'page_template', 'page_variant', 'journey',
  'pitch', 'case_study', 'diagnostic', 'sequence',
  'stage_guide', 'reply', 'fact', 'find_source', 'signal'));
