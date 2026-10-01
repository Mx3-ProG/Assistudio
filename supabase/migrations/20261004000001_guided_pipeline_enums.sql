-- =============================================================================
-- V0.5 guided pipeline — enum values (own file: a new enum value cannot be used
-- in the transaction that adds it).
--
-- CRM stages become: new → contacted → replied → qualified → interested →
-- proof_sent → proposal → appointment → handed_off → checkout → won | lost.
-- 'interested' (kept in the type since V0.1) is offered again as "interest
-- detected"; 'proof_sent' and 'handed_off' are new. Existing rows are untouched.
-- =============================================================================

alter type public.prospect_stage add value if not exists 'proof_sent' after 'interested';
alter type public.prospect_stage add value if not exists 'handed_off' after 'appointment';
