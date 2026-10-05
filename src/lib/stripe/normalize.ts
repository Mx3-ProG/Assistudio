/**
 * Stripe object → normalised payload for the SQL domain functions
 * (public.stripe_* in supabase/migrations/*_v02_engine.sql).
 *
 * Pure and framework-free (unit-tested). Only ever called on objects that come
 * from a signature-verified event or from the Stripe API with our secret key.
 *
 * Handles the current API shape (2026-08-26.dahlia: invoice.parent,
 * invoice.payments, line.pricing, subscription item periods) and falls back to
 * the pre-2025 fields when present, so a pinned older webhook endpoint still works.
 */
import type Stripe from "stripe";

const ts = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);
const idOf = (v: string | { id: string } | null | undefined) => (v == null ? null : typeof v === "string" ? v : v.id);
// Legacy fields removed from the typed API are read through this loose view.
type Loose = Record<string, unknown>;
const loose = (o: unknown) => (o ?? {}) as Loose;

export const CHECKOUT_METADATA_KEY = "studio_checkout_id";

export interface CustomerPayload {
  stripe_customer_id: string;
  email: string | null;
  name: string | null;
  company_name: string | null;
  country: string | null;
  locale: string | null;
  livemode: boolean;
}

export interface CheckoutCompletedPayload {
  stripe_checkout_session_id: string;
  studio_checkout_id: string | null;
  stripe_subscription_id: string | null;
  mode: string;
  payment_status: string;
  customer: CustomerPayload;
  livemode: boolean;
}

export interface SubscriptionPayload {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  start_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
  stripe_price_id: string | null;
  lookup_key: string | null;
  studio_checkout_id: string | null;
  livemode: boolean;
}

export interface InvoicePayload {
  stripe_invoice_id: string;
  customer: CustomerPayload;
  stripe_subscription_id: string | null;
  billing_reason: string | null;
  currency: string;
  amount_paid: number;
  amount_due: number;
  total_excluding_tax: number | null;
  tax: number | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  stripe_price_id: string | null;
  lookup_key: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  studio_checkout_id: string | null;
  attempt_count: number;
  next_payment_attempt: string | null;
  livemode: boolean;
}

export interface RefundPayload {
  stripe_refund_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
}

export interface DisputePayload {
  stripe_dispute_id: string;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
}

export interface ConnectAccountPayload {
  stripe_account_id: string;
  payouts_enabled: boolean;
  details_submitted: boolean;
  disabled_reason: string | null;
  requirements_status: "none" | "currently_due" | "past_due" | "pending_verification" | "disabled";
  /** Last 4 digits of the default payout account, for display only — never the full IBAN / card. */
  payout_last4: string | null;
}

export function normalizeCheckoutSession(s: Stripe.Checkout.Session): CheckoutCompletedPayload {
  const customerId = idOf(s.customer as string | { id: string } | null);
  if (!customerId) throw new Error(`checkout session ${s.id} has no customer`);
  const d = s.customer_details;
  return {
    stripe_checkout_session_id: s.id,
    studio_checkout_id: s.metadata?.[CHECKOUT_METADATA_KEY] ?? s.client_reference_id ?? null,
    stripe_subscription_id: idOf(s.subscription as string | { id: string } | null),
    mode: s.mode,
    payment_status: s.payment_status,
    customer: {
      stripe_customer_id: customerId,
      email: d?.email ?? null,
      name: d?.name ?? null,
      company_name: d?.business_name ?? null,
      country: d?.address?.country ?? null,
      locale: s.locale ?? null,
      livemode: s.livemode,
    },
    livemode: s.livemode,
  };
}

function priceOf(p: string | Stripe.Price | null | undefined): { id: string | null; lookupKey: string | null } {
  if (!p) return { id: null, lookupKey: null };
  if (typeof p === "string") return { id: p, lookupKey: null };
  return { id: p.id, lookupKey: p.lookup_key ?? null };
}

export function normalizeSubscription(sub: Stripe.Subscription, fallbackCheckoutId: string | null = null): SubscriptionPayload {
  const item = sub.items?.data?.[0];
  const legacy = loose(sub);
  const price = priceOf(item?.price);
  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: idOf(sub.customer as string | { id: string })!,
    status: sub.status,
    start_date: ts(sub.start_date),
    current_period_start: ts(item?.current_period_start ?? (legacy.current_period_start as number | undefined)),
    current_period_end: ts(item?.current_period_end ?? (legacy.current_period_end as number | undefined)),
    cancel_at: ts(sub.cancel_at),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: ts(sub.canceled_at),
    ended_at: ts(sub.ended_at),
    stripe_price_id: price.id,
    lookup_key: price.lookupKey,
    studio_checkout_id: sub.metadata?.[CHECKOUT_METADATA_KEY] ?? fallbackCheckoutId,
    livemode: sub.livemode,
  };
}

/** The subscription line (or the first line) of an invoice. */
function mainLine(inv: Stripe.Invoice): Stripe.InvoiceLineItem | undefined {
  const lines = inv.lines?.data ?? [];
  return lines.find((l) => l.parent?.type === "subscription_item_details") ?? lines[0];
}

export function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const fromParent = inv.parent?.subscription_details?.subscription;
  return idOf(fromParent as string | { id: string } | null | undefined) ?? idOf(loose(inv).subscription as string | null);
}

export function invoicePriceId(inv: Stripe.Invoice): string | null {
  const line = mainLine(inv);
  if (!line) return null;
  return priceOf(line.pricing?.price_details?.price).id ?? idOf(loose(line).price as { id: string } | null);
}

export function normalizeInvoice(
  inv: Stripe.Invoice,
  extra: { price?: Stripe.Price | null; customer?: Stripe.Customer | null } = {},
): InvoicePayload {
  const customerId = idOf(inv.customer as string | { id: string } | null);
  if (!customerId) throw new Error(`invoice ${inv.id} has no customer`);
  const line = mainLine(inv);
  const legacy = loose(inv);

  // Successful payment of the invoice (API ≥ 2025-03-31: invoice.payments).
  const payments = inv.payments?.data ?? [];
  const paid = payments.find((p) => p.status === "paid") ?? payments[0];
  const pi = idOf(paid?.payment?.payment_intent as string | { id: string } | undefined)
    ?? idOf(legacy.payment_intent as string | { id: string } | null);
  const charge = idOf(paid?.payment?.charge as string | { id: string } | undefined)
    ?? idOf(legacy.charge as string | { id: string } | null);

  const tax = typeof inv.total_excluding_tax === "number" ? inv.total - inv.total_excluding_tax : null;
  const price = extra.price ? priceOf(extra.price) : { id: invoicePriceId(inv), lookupKey: null };
  const c = extra.customer;

  return {
    stripe_invoice_id: inv.id!,
    customer: {
      stripe_customer_id: customerId,
      email: inv.customer_email ?? c?.email ?? null,
      name: inv.customer_name ?? c?.name ?? null,
      company_name: null,
      country: inv.customer_address?.country ?? c?.address?.country ?? null,
      locale: c?.preferred_locales?.[0] ?? null,
      livemode: inv.livemode,
    },
    stripe_subscription_id: invoiceSubscriptionId(inv),
    billing_reason: inv.billing_reason ?? null,
    currency: inv.currency,
    amount_paid: inv.amount_paid,
    amount_due: inv.amount_due,
    total_excluding_tax: inv.total_excluding_tax ?? null,
    tax,
    period_start: ts(line?.period?.start ?? inv.period_start),
    period_end: ts(line?.period?.end ?? inv.period_end),
    paid_at: ts(inv.status_transitions?.paid_at),
    stripe_price_id: price.id,
    lookup_key: price.lookupKey,
    stripe_payment_intent_id: pi,
    stripe_charge_id: charge,
    studio_checkout_id: inv.parent?.subscription_details?.metadata?.[CHECKOUT_METADATA_KEY]
      ?? inv.metadata?.[CHECKOUT_METADATA_KEY] ?? null,
    attempt_count: inv.attempt_count ?? 0,
    next_payment_attempt: ts(inv.next_payment_attempt),
    livemode: inv.livemode,
  };
}

export function normalizeRefund(r: Stripe.Refund): RefundPayload {
  return {
    stripe_refund_id: r.id,
    stripe_payment_intent_id: idOf(r.payment_intent as string | { id: string } | null),
    stripe_charge_id: idOf(r.charge as string | { id: string } | null),
    amount: r.amount,
    currency: r.currency,
    status: r.status ?? "pending",
    reason: r.reason ?? null,
  };
}

export function normalizeDispute(d: Stripe.Dispute): DisputePayload {
  return {
    stripe_dispute_id: d.id,
    stripe_payment_intent_id: idOf(d.payment_intent as string | { id: string } | null),
    stripe_charge_id: idOf(d.charge as string | { id: string }),
    amount: d.amount,
    currency: d.currency,
    status: d.status,
    reason: d.reason ?? null,
  };
}

export function normalizeAccount(a: Stripe.Account): ConnectAccountPayload {
  const req = a.requirements;
  const status: ConnectAccountPayload["requirements_status"] = req?.disabled_reason
    ? "disabled"
    : req?.past_due?.length ? "past_due"
    : req?.currently_due?.length ? "currently_due"
    : req?.pending_verification?.length ? "pending_verification"
    : "none";
  return {
    stripe_account_id: a.id,
    payouts_enabled: a.payouts_enabled ?? false,
    details_submitted: a.details_submitted ?? false,
    disabled_reason: req?.disabled_reason ?? null,
    requirements_status: status,
    payout_last4: payoutLast4(a),
  };
}

/** Default external account (bank account or debit card) → its last 4 digits only. */
function payoutLast4(a: Stripe.Account): string | null {
  const accounts = a.external_accounts?.data ?? [];
  const pick = accounts.find((x) => (x as { default_for_currency?: boolean }).default_for_currency) ?? accounts[0];
  const last4 = (pick as { last4?: string } | undefined)?.last4;
  return typeof last4 === "string" && /^[0-9]{4}$/.test(last4) ? last4 : null;
}

/**
 * Minimal reference stored in stripe_events: ids, amounts and statuses only —
 * never names, emails or addresses (they stay in Stripe).
 */
export function eventReference(event: Stripe.Event): Record<string, unknown> {
  const o = loose(event.data?.object);
  const pick = (k: string) => {
    const v = o[k];
    return typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? v : idOf(v as { id: string } | null);
  };
  const ref: Record<string, unknown> = { object: o.object, id: o.id };
  for (const k of ["customer", "subscription", "invoice", "payment_intent", "charge", "amount", "amount_paid",
                   "currency", "status", "billing_reason", "mode", "payment_status"]) {
    const v = pick(k);
    if (v !== undefined && v !== null) ref[k] = v;
  }
  return ref;
}
