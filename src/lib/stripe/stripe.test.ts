import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import {
  normalizeInvoice, normalizeSubscription, normalizeCheckoutSession, normalizeRefund, normalizeAccount,
  eventReference, invoiceSubscriptionId,
} from "./normalize.ts";
import { verifyStripeEvent, keyMode, WebhookSignatureError } from "./verify.ts";

const T = 1_780_000_000; // unix seconds
const iso = (s: number) => new Date(s * 1000).toISOString();

// Current API shape (2026-08-26.dahlia).
const invoice = {
  id: "in_1", object: "invoice", customer: "cus_1", customer_email: "client@x.test", customer_name: "Client",
  customer_address: { country: "FR" }, billing_reason: "subscription_create", currency: "eur",
  amount_paid: 360_000, amount_due: 360_000, total: 360_000, total_excluding_tax: 300_000, attempt_count: 1,
  next_payment_attempt: null, livemode: false, metadata: {}, period_start: T, period_end: T,
  status_transitions: { paid_at: T + 5 },
  parent: { type: "subscription_details", subscription_details: { subscription: "sub_1", metadata: { studio_checkout_id: "chk-1" } } },
  lines: { data: [{ id: "il_1", parent: { type: "subscription_item_details" }, period: { start: T, end: T + 31_536_000 },
    pricing: { type: "price_details", price_details: { price: "price_1", product: "prod_1" } } }] },
  payments: { data: [{ status: "paid", payment: { type: "payment_intent", payment_intent: "pi_1" } }] },
} as unknown as Stripe.Invoice;

test("invoice (dahlia): subscription, price, payment intent, period, tax, checkout id", () => {
  const p = normalizeInvoice(invoice);
  assert.equal(p.stripe_subscription_id, "sub_1");
  assert.equal(p.stripe_price_id, "price_1");
  assert.equal(p.stripe_payment_intent_id, "pi_1");
  assert.equal(p.period_start, iso(T));
  assert.equal(p.period_end, iso(T + 31_536_000));
  assert.equal(p.paid_at, iso(T + 5));
  assert.equal(p.total_excluding_tax, 300_000);
  assert.equal(p.tax, 60_000);
  assert.equal(p.studio_checkout_id, "chk-1");
  assert.equal(p.customer.country, "FR");
});

test("invoice (legacy fields): still normalised", () => {
  const legacy = {
    ...invoice, parent: null, payments: undefined, subscription: "sub_old", payment_intent: "pi_old", charge: "ch_old",
    lines: { data: [{ id: "il", parent: null, period: { start: T, end: T + 10 }, pricing: null, price: { id: "price_old" } }] },
  } as unknown as Stripe.Invoice;
  const p = normalizeInvoice(legacy);
  assert.equal(invoiceSubscriptionId(legacy), "sub_old");
  assert.equal(p.stripe_price_id, "price_old");
  assert.equal(p.stripe_payment_intent_id, "pi_old");
  assert.equal(p.stripe_charge_id, "ch_old");
});

test("invoice: an expanded price provides the lookup key", () => {
  const p = normalizeInvoice(invoice, { price: { id: "price_1", lookup_key: "studio_yearly_eur" } as Stripe.Price });
  assert.equal(p.lookup_key, "studio_yearly_eur");
});

test("subscription: period from items (dahlia) with legacy fallback", () => {
  const sub = {
    id: "sub_1", customer: "cus_1", status: "active", start_date: T, cancel_at: null, cancel_at_period_end: true,
    canceled_at: null, ended_at: null, livemode: false, metadata: { studio_checkout_id: "chk-1" },
    items: { data: [{ current_period_start: T, current_period_end: T + 100, price: { id: "price_1", lookup_key: "k" } }] },
  } as unknown as Stripe.Subscription;
  const p = normalizeSubscription(sub);
  assert.equal(p.current_period_end, iso(T + 100));
  assert.equal(p.cancel_at_period_end, true);
  assert.equal(p.lookup_key, "k");
  assert.equal(p.studio_checkout_id, "chk-1");
  const legacy = { ...sub, metadata: {}, current_period_end: T + 7, items: { data: [{ price: "price_1" }] } } as unknown as Stripe.Subscription;
  assert.equal(normalizeSubscription(legacy, "fallback").current_period_end, iso(T + 7));
  assert.equal(normalizeSubscription(legacy, "fallback").studio_checkout_id, "fallback");
});

test("checkout session: our row id comes from metadata or client_reference_id", () => {
  const s = {
    id: "cs_1", customer: "cus_1", subscription: "sub_1", mode: "subscription", payment_status: "paid", livemode: false,
    locale: "fr", metadata: {}, client_reference_id: "chk-9",
    customer_details: { email: "c@x.test", name: "C", business_name: "Atelier", address: { country: "BE" } },
  } as unknown as Stripe.Checkout.Session;
  const p = normalizeCheckoutSession(s);
  assert.equal(p.studio_checkout_id, "chk-9");
  assert.equal(p.customer.company_name, "Atelier");
  assert.equal(p.customer.country, "BE");
});

test("refund / connect account", () => {
  const r = normalizeRefund({ id: "re_1", amount: 100, currency: "eur", status: "succeeded", reason: null,
    payment_intent: "pi_1", charge: { id: "ch_1" } } as unknown as Stripe.Refund);
  assert.equal(r.stripe_charge_id, "ch_1");
  const a = normalizeAccount({ id: "acct_1", payouts_enabled: false, details_submitted: true,
    requirements: { currently_due: ["external_account"], past_due: [], pending_verification: [], disabled_reason: null } } as unknown as Stripe.Account);
  assert.equal(a.requirements_status, "currently_due");
  assert.equal(a.payout_last4, null);
  const b = normalizeAccount({ id: "acct_2", payouts_enabled: true, details_submitted: true, requirements: {},
    external_accounts: { data: [{ object: "bank_account", last4: "1111" }, { object: "bank_account", last4: "4821", default_for_currency: true, account_number: "FR7612345678901234567894821" }] } } as unknown as Stripe.Account);
  assert.equal(b.payout_last4, "4821", "only the last 4 digits of the default account");
  assert.ok(!JSON.stringify(b).includes("FR76"), "never the full account number");
});

test("event reference keeps ids and amounts, never personal data", () => {
  const ref = eventReference({ id: "evt_1", type: "invoice.paid", data: { object: invoice } } as unknown as Stripe.Event);
  assert.equal(ref.id, "in_1");
  assert.equal(ref.customer, "cus_1");
  assert.equal(ref.amount_paid, 360_000);
  assert.ok(!JSON.stringify(ref).includes("client@x.test"));
  assert.ok(!JSON.stringify(ref).includes("Client"));
});

test("webhook signature: valid, tampered, wrong secret, second endpoint secret", async () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test_platform";
  const payload = JSON.stringify({ id: "evt_1", object: "event", type: "invoice.paid", data: { object: {} } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });

  const ev = await verifyStripeEvent(stripe, payload, header, [secret]);
  assert.equal(ev.id, "evt_1");
  await assert.rejects(verifyStripeEvent(stripe, payload.replace("evt_1", "evt_2"), header, [secret]), WebhookSignatureError);
  await assert.rejects(verifyStripeEvent(stripe, payload, header, ["whsec_other"]), WebhookSignatureError);
  await assert.rejects(verifyStripeEvent(stripe, payload, null, [secret]), WebhookSignatureError);
  await assert.rejects(verifyStripeEvent(stripe, payload, header, []), WebhookSignatureError);
  assert.equal((await verifyStripeEvent(stripe, payload, header, ["whsec_other", secret])).id, "evt_1");

  const old = stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) - 3600 });
  await assert.rejects(verifyStripeEvent(stripe, payload, old, [secret]), WebhookSignatureError, "replayed old signature rejected");
});

test("test / live keys are told apart", () => {
  assert.equal(keyMode("sk_test_123"), "test");
  assert.equal(keyMode("rk_live_123"), "live");
  assert.equal(keyMode("pk_test_123"), null);
});
