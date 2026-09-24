import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCommission, resolveRule, type CommissionRule, type EngineAffiliate, type EnginePayment } from "./commission-engine.ts";

const offer = { id: "offer-studio", productId: "prod-studio", commissionRate: 0.5, commissionRecurring: true };
const rule = (over: Partial<CommissionRule>): CommissionRule => ({
  id: "r-default", name: "default", productId: "prod-studio", offerId: null, affiliateId: null,
  commissionType: "percentage", rate: 0.5, fixedAmountCents: null, currency: null, appliesToNew: true,
  appliesToRenewals: true, durationMonths: null, maxPayments: null, validationDays: null,
  base: "net_excluding_tax", priority: 0, isActive: true, validFrom: "2020-01-01T00:00:00Z", validTo: null,
  createdAt: "2020-01-01T00:00:00Z", ...over,
});
const alice: EngineAffiliate = { id: "alice", status: "approved", deleted: false, rateOverride: null, email: "alice@x.test" };
const pay = (over: Partial<EnginePayment> = {}): EnginePayment => ({
  kind: "new", currency: "EUR", grossCents: 300_000, netCents: 300_000, paidAt: "2026-06-01T00:00:00Z",
  customerEmail: "client@x.test", subscriptionStartedAt: "2026-06-01T00:00:00Z", priorCommissionCount: 0, ...over,
});
const run = (over: { affiliate?: EngineAffiliate | null; payment?: EnginePayment; rules?: CommissionRule[] } = {}) =>
  evaluateCommission({
    affiliate: over.affiliate === undefined ? alice : over.affiliate, offer, payment: over.payment ?? pay(),
    rules: over.rules ?? [rule({})], defaultValidationDays: 30,
  });

test("default rule: 50% of €3,000 → €1,500 pending, available after the validation period", () => {
  const e = run();
  assert.ok(e.eligible);
  assert.equal(e.amountCents, 150_000);
  assert.equal(e.status, "pending");
  assert.equal(e.availableOn, "2026-07-01T00:00:00.000Z");
});

test("no affiliate → normal sale, no commission", () => {
  assert.deepEqual(run({ affiliate: null }), { eligible: false, reason: "no_affiliate" });
});

test("commission base excludes tax by default", () => {
  const e = run({ payment: pay({ grossCents: 360_000, netCents: 300_000 }) });
  assert.ok(e.eligible && e.amountCents === 150_000);
  const g = run({ rules: [rule({ base: "amount_paid" })], payment: pay({ grossCents: 360_000, netCents: 300_000 }) });
  assert.ok(g.eligible && g.amountCents === 180_000);
});

test("most specific rule wins: affiliate > product; promotions by validity window", () => {
  const rules = [
    rule({}),
    rule({ id: "r-alice", affiliateId: "alice", rate: 0.4 }),
    rule({ id: "r-promo", rate: 0.6, priority: 10, validFrom: "2026-05-01T00:00:00Z", validTo: "2026-05-31T00:00:00Z" }),
  ];
  assert.equal(resolveRule(rules, "alice", offer, "2026-06-01T00:00:00Z")?.id, "r-alice");
  assert.equal(resolveRule(rules, "bob", offer, "2026-05-15T00:00:00Z")?.id, "r-promo");
  assert.equal(resolveRule(rules, "bob", offer, "2026-06-15T00:00:00Z")?.id, "r-default");
});

test("affiliate rate override (V0.1) applies to percentage rules", () => {
  const e = run({ affiliate: { ...alice, rateOverride: 0.4 } });
  assert.ok(e.eligible && e.amountCents === 120_000);
});

test("renewals: eligible by default, excluded by rule, limited by duration or count", () => {
  assert.ok(run({ payment: pay({ kind: "renewal" }) }).eligible);
  assert.deepEqual(run({ rules: [rule({ appliesToRenewals: false })], payment: pay({ kind: "renewal" }) }),
    { eligible: false, reason: "rule_excludes_renewals" });
  assert.deepEqual(run({ rules: [rule({ durationMonths: 12 })],
    payment: pay({ kind: "renewal", subscriptionStartedAt: "2025-06-01T00:00:00Z" }) }),
    { eligible: false, reason: "rule_duration_elapsed" });
  assert.deepEqual(run({ rules: [rule({ maxPayments: 2 })], payment: pay({ kind: "renewal", priorCommissionCount: 2 }) }),
    { eligible: false, reason: "rule_max_payments_reached" });
});

test("proration / manual invoices need a human decision", () => {
  assert.deepEqual(run({ payment: pay({ kind: "upgrade" }) }), { eligible: false, reason: "billing_reason_requires_review" });
});

test("fixed commissions must match the payment currency", () => {
  const fixed = rule({ commissionType: "fixed", rate: null, fixedAmountCents: 50_000, currency: "EUR" });
  const e = run({ rules: [fixed] });
  assert.ok(e.eligible && e.amountCents === 50_000);
  assert.deepEqual(run({ rules: [fixed], payment: pay({ currency: "USD" }) }), { eligible: false, reason: "currency_mismatch" });
});

test("self-referral and non-approved affiliates go to review (disputed), never auto-paid", () => {
  const self = run({ payment: pay({ customerEmail: "ALICE@x.test" }) });
  assert.ok(self.eligible && self.status === "disputed" && self.reviewReason === "self_referral");
  const suspended = run({ affiliate: { ...alice, status: "suspended" } });
  assert.ok(suspended.eligible && suspended.status === "disputed");
});

test("validation period is configuration", () => {
  const e = run({ rules: [rule({ validationDays: 14 })] });
  assert.ok(e.eligible && e.validationDays === 14);
});
