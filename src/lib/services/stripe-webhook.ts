import "server-only";
import type Stripe from "stripe";
import { supabaseService } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import { stripe, stripeMode } from "@/lib/services/stripe";
import {
  normalizeCheckoutSession, normalizeSubscription, normalizeInvoice, normalizeRefund, normalizeDispute,
  normalizeAccount, eventReference, invoiceSubscriptionId, invoicePriceId,
} from "@/lib/stripe/normalize";

/**
 * PaymentService / SubscriptionService entry point for Stripe events.
 *
 *   verified event → claim (exactly once) → fetch fresh objects when the event
 *   payload is not enough → ONE SQL function per financial fact → finish.
 *
 * The SQL functions are idempotent on their own business keys, so even a
 * crash between "applied" and "finish" cannot double count on retry.
 */
export type WebhookOutcome = "processed" | "duplicate" | "in_progress" | "ignored";

type Sb = ReturnType<typeof supabaseService>;

async function rpc<T = unknown>(sb: Sb, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

const HANDLED = new Set([
  "checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired",
  "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "customer.subscription.paused", "customer.subscription.resumed",
  "invoice.paid", "invoice.payment_failed",
  "charge.refunded", "refund.created", "refund.updated", "refund.failed", "charge.refund.updated",
  "charge.dispute.created", "charge.dispute.updated", "charge.dispute.closed",
  "account.updated",
]);

export async function handleStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  const sb = supabaseService();
  const scope = { event_id: event.id, type: event.type };

  // Test and live never mix.
  if (event.livemode !== (stripeMode() === "live")) {
    log.warn("webhook", "event mode does not match the configured key — ignored", { ...scope, livemode: event.livemode });
    return "ignored";
  }

  const claim = await rpc<string>(sb, "stripe_event_claim", {
    p_event_id: event.id, p_type: event.type, p_livemode: event.livemode, p_api_version: event.api_version ?? null,
    p_created: new Date(event.created * 1000).toISOString(), p_reference: eventReference(event),
  });
  if (claim === "duplicate" || claim === "in_progress") {
    log.info("webhook", `event ${claim}`, scope);
    return claim;
  }

  try {
    const result = HANDLED.has(event.type) ? await apply(sb, event) : "ignored";
    await rpc(sb, "stripe_event_finish", { p_event_id: event.id, p_status: result, p_error: null });
    log.info("webhook", `event ${result}`, scope);
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await rpc(sb, "stripe_event_finish", { p_event_id: event.id, p_status: "failed", p_error: message }).catch(() => {});
    log.error("webhook", "event processing failed", { ...scope, error: message });
    throw e;
  }
}

async function apply(sb: Sb, event: Stripe.Event): Promise<"processed" | "ignored"> {
  const s = stripe();
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.customer) return "ignored";
      await rpc(sb, "stripe_checkout_completed", { p: normalizeCheckoutSession(session) });
      return "processed";
    }
    case "checkout.session.expired": {
      await rpc(sb, "stripe_checkout_expired", { p: { stripe_checkout_session_id: (event.data.object as Stripe.Checkout.Session).id } });
      return "processed";
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed": {
      // Re-read: events can arrive out of order; the API state is authoritative.
      const obj = event.data.object as Stripe.Subscription;
      const sub = event.type === "customer.subscription.deleted"
        ? obj
        : await s.subscriptions.retrieve(obj.id, { expand: ["items.data.price"] });
      await rpc(sb, "stripe_subscription_sync", { p: normalizeSubscription(sub) });
      return "processed";
    }
    case "invoice.paid": {
      const inv = await s.invoices.retrieve((event.data.object as Stripe.Invoice).id!, { expand: ["payments"] });
      if (inv.status !== "paid") return "ignored";
      const priceId = invoicePriceId(inv);
      const price = priceId ? await s.prices.retrieve(priceId) : null;
      const subId = invoiceSubscriptionId(inv);
      if (subId) {
        const sub = await s.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
        const checkoutId = inv.parent?.subscription_details?.metadata?.studio_checkout_id ?? null;
        await rpc(sb, "stripe_subscription_sync", { p: normalizeSubscription(sub, checkoutId) });
      }
      const res = await rpc<{ sale_id: string | null; created: boolean; commission_status: string | null }>(
        sb, "stripe_invoice_paid", { p: normalizeInvoice(inv, { price }) });
      log.info("payments", "invoice paid", {
        invoice: inv.id, sale_id: res.sale_id, created: res.created, commission_status: res.commission_status,
      });
      return "processed";
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      await rpc(sb, "stripe_invoice_payment_failed", { p: normalizeInvoice(inv) });
      log.warn("payments", "invoice payment failed", { invoice: inv.id, attempt: inv.attempt_count });
      return "processed";
    }
    case "charge.refunded": {
      // The charge event may not embed refunds: list them from the API.
      const charge = event.data.object as Stripe.Charge;
      const refunds = await s.refunds.list({ charge: charge.id, limit: 100 });
      let applied = false;
      for (const r of refunds.data) {
        const out = await rpc<string>(sb, "stripe_refund_sync", { p: normalizeRefund(r) });
        applied ||= out !== "unknown_payment";
      }
      return applied ? "processed" : "ignored";
    }
    case "refund.created":
    case "refund.updated":
    case "refund.failed":
    case "charge.refund.updated": {
      const out = await rpc<string>(sb, "stripe_refund_sync", { p: normalizeRefund(event.data.object as Stripe.Refund) });
      return out === "unknown_payment" ? "ignored" : "processed";
    }
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed": {
      const out = await rpc<string>(sb, "stripe_dispute_sync", { p: normalizeDispute(event.data.object as Stripe.Dispute) });
      if (out !== "unknown_payment") log.warn("payments", `dispute ${out}`, { dispute: (event.data.object as Stripe.Dispute).id });
      return out === "unknown_payment" ? "ignored" : "processed";
    }
    case "account.updated": {
      const found = await rpc<boolean>(sb, "stripe_connect_account_sync", { p: normalizeAccount(event.data.object as Stripe.Account) });
      return found ? "processed" : "ignored";
    }
    default:
      return "ignored";
  }
}
