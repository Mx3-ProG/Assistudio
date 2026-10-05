-- =============================================================================
-- Studio ATS — payout requests (enums, own migration: new enum values cannot be
-- used in the transaction that creates them).
--
-- Payout workflow (V1):
--   requested  (partner asked)  → processing (staff accepted) → paid
--                               ↘ rejected (reason)   ↘ failed (provider error)
--   scheduled: legacy staff-initiated payout (staff_create_payout), unchanged.
-- =============================================================================

alter type public.payout_status add value if not exists 'requested' before 'scheduled';
alter type public.payout_status add value if not exists 'rejected';
alter type public.notification_type add value if not exists 'payout_request';
