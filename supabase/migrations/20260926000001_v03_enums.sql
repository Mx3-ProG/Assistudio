-- =============================================================================
-- STUDIO V0.3 — enum values (own file: a new enum value cannot be used in the
-- transaction that adds it).
--
-- CRM stages become: new → contacted → replied → qualified → appointment →
-- proposal → checkout → won | lost. 'interested' stays in the type for old
-- rows (migrated to 'qualified' in the next file) and is no longer offered.
-- =============================================================================

alter type public.prospect_stage add value if not exists 'replied' after 'contacted';
alter type public.prospect_stage add value if not exists 'qualified' after 'replied';
alter type public.prospect_stage add value if not exists 'checkout' after 'proposal';
