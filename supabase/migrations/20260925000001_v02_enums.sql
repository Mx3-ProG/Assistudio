-- =============================================================================
-- STUDIO V0.2 — enum alignment (own migration: new enum values cannot be used
-- in the transaction that creates them).
--
-- Commission statuses are aligned on the V0.2 business vocabulary:
--
--   V0.1 value        V0.2 value          meaning
--   ---------------   -----------------   ------------------------------------------------
--   pending           awaiting_payment    legacy only: V0.1 manual sale not yet paid.
--                                          V0.2 never creates it (a commission only exists
--                                          once its payment is confirmed).
--   in_validation     pending             payment confirmed, inside the validation period
--   on_hold           disputed            needs an administrative decision
--   available / paid / reversed           unchanged
--
-- RENAME VALUE keeps the underlying OIDs: existing rows, indexes and views keep
-- their meaning. Functions whose bodies use the old literals are all replaced in
-- 20260925000003_v02_engine.sql.
-- =============================================================================

alter type public.commission_status rename value 'pending' to 'awaiting_payment';
alter type public.commission_status rename value 'in_validation' to 'pending';
alter type public.commission_status rename value 'on_hold' to 'disputed';

alter type public.ledger_bucket rename value 'pending' to 'awaiting_payment';
alter type public.ledger_bucket rename value 'in_validation' to 'pending';
alter type public.ledger_bucket rename value 'on_hold' to 'disputed';

-- Ledger entry types required by V0.2. The V0.1 movement types (validation,
-- release, hold, unhold, clawback…) stay valid and keep describing status moves.
alter type public.ledger_entry_type add value if not exists 'commission';
alter type public.ledger_entry_type add value if not exists 'renewal_commission';

-- 'manual' = no automatic cookie attribution; only explicit context
-- (private sales page, affiliate checkout link) or staff assignment.
alter type public.attribution_model add value if not exists 'manual';

alter type public.subscription_status add value if not exists 'incomplete';
alter type public.subscription_status add value if not exists 'unpaid';
alter type public.subscription_status add value if not exists 'paused';

alter type public.sale_status add value if not exists 'disputed';
alter type public.sale_status add value if not exists 'partially_refunded';

alter type public.notification_type add value if not exists 'payment_failed';
alter type public.notification_type add value if not exists 'dispute';

create type public.commission_type as enum ('percentage', 'fixed');

create type public.stripe_event_status as enum ('received', 'processing', 'processed', 'failed', 'ignored');

create type public.invoice_status as enum ('draft', 'open', 'paid', 'uncollectible', 'void');

create type public.payment_status as enum ('succeeded', 'failed', 'partially_refunded', 'refunded', 'disputed');

create type public.email_status as enum ('queued', 'sending', 'sent', 'failed', 'skipped');

create type public.connect_onboarding_status as enum ('not_started', 'pending', 'complete', 'restricted');
