import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeCommissionCents, newCommission, transition, summarize, illustrate, CommissionTransitionError,
} from "./commission.ts";

const T0 = "2026-01-01T00:00:00.000Z";
const after = (days: number) => new Date(Date.parse(T0) + days * 86_400_000).toISOString();

test("50% of €3,000 is €1,500", () => {
  assert.equal(computeCommissionCents(300_000, 0.5), 150_000);
  assert.throws(() => computeCommissionCents(-1, 0.5));
  assert.throws(() => computeCommissionCents(100, 1.5));
});

test("integer maths: no float drift, half away from zero like Postgres", () => {
  assert.equal(computeCommissionCents(12_345, 0.4), 4_938);      // 4 938.0
  assert.equal(computeCommissionCents(1, 0.5), 1);               // 0.5 → 1
  assert.equal(computeCommissionCents(333, 0.3333), 111);        // 110.9889 → 111
  assert.equal(computeCommissionCents(9_007_199_254_740_991, 0.5), 4_503_599_627_370_496);
});

test("happy path: payment confirmed → pending → available → paid", () => {
  let { state, moves } = newCommission(150_000, T0, 30);
  assert.equal(state.status, "pending");
  assert.equal(moves[0].type, "commission");

  ({ state, moves } = transition(state, { type: "release", at: after(10) }));
  assert.equal(state.status, "pending", "not released before the validation period ends");
  assert.equal(moves.length, 0);

  ({ state, moves } = transition(state, { type: "release", at: after(30) }));
  assert.equal(state.status, "available");

  ({ state, moves } = transition(state, { type: "payout_paid", at: after(40) }));
  assert.equal(state.status, "paid");
  assert.equal(moves[0].type, "payout");
});

test("renewal commissions are typed as such in the ledger", () => {
  assert.equal(newCommission(150_000, T0, 30, { renewal: true }).moves[0].type, "renewal_commission");
});

test("pending money is never earned", () => {
  const { state } = newCommission(150_000, T0, 30);
  const b = summarize([state]);
  assert.equal(b.lifetimeEarnedCents, 0);
  assert.equal(b.pendingCents, 150_000);
});

test("refund before validation reverses; after payout claws back", () => {
  let { state } = newCommission(150_000, T0, 30);
  const r = transition(state, { type: "sale_status", status: "refunded", at: after(5), validationDays: 30 });
  assert.equal(r.state.status, "reversed");
  assert.equal(r.moves[0].type, "reversal");
  assert.equal(r.moves[0].from, "pending");
  assert.equal(r.moves[0].amountCents, 150_000);

  ({ state } = transition(state, { type: "release", at: after(31) }));
  const a = transition(state, { type: "sale_status", status: "refunded", at: after(32), validationDays: 30 });
  assert.equal(a.moves[0].from, "available", "compensating entry from available");

  ({ state } = transition(state, { type: "payout_paid", at: after(40) }));
  const c = transition(state, { type: "sale_status", status: "chargeback", at: after(60), validationDays: 30 });
  assert.equal(c.state.status, "reversed");
  assert.equal(c.state.recoveryRequired, true);
  assert.equal(c.moves[0].type, "clawback");
  assert.equal(c.moves[0].amountCents, -150_000);
});

test("partial reversal reduces the amount, keeps the commission", () => {
  const { state } = newCommission(150_000, T0, 30);
  const r = transition(state, { type: "reverse", at: after(2), reason: "partial_refund", amountCents: 50_000 });
  assert.equal(r.state.status, "pending");
  assert.equal(r.state.amountCents, 100_000);
  assert.equal(r.moves[0].amountCents, 50_000);
});

test("reversal is idempotent", () => {
  let { state } = newCommission(100, T0, 30);
  ({ state } = transition(state, { type: "reverse", at: T0, reason: "fraud" }));
  const again = transition(state, { type: "reverse", at: T0, reason: "fraud" });
  assert.equal(again.moves.length, 0);
});

test("dispute / restore returns to the right bucket", () => {
  let { state } = newCommission(100, T0, 30);
  ({ state } = transition(state, { type: "sale_status", status: "disputed", at: after(1), validationDays: 30 }));
  assert.equal(state.status, "disputed");
  assert.equal(transition(state, { type: "restore", at: after(3), reason: "won" }).state.status, "pending");
  assert.equal(transition(state, { type: "restore", at: after(45), reason: "won" }).state.status, "available");
  assert.throws(() => transition({ ...state, status: "paid" }, { type: "restore", at: T0, reason: "x" }), CommissionTransitionError);
});

test("self-review: a commission needing review starts disputed", () => {
  assert.equal(newCommission(100, T0, 30, { needsReview: true }).state.status, "disputed");
});

test("legacy V0.1 awaiting_payment commission starts validation when paid", () => {
  const legacy = { ...newCommission(100, T0, 30).state, status: "awaiting_payment" as const, validatedAt: null, holdUntil: null };
  const r = transition(legacy, { type: "sale_status", status: "paid", at: T0, validationDays: 30 });
  assert.equal(r.state.status, "pending");
  assert.equal(r.moves[0].type, "validation");
});

test("clawbacks and adjustments net the available balance", () => {
  const b = summarize([{ status: "available", amountCents: 150_000 }], -150_000);
  assert.equal(b.availableCents, 0);
  assert.equal(b.lifetimeEarnedCents, 150_000);
});

test("illustration is plain multiplication", () => {
  assert.equal(illustrate(3, 300_000, 0.5, 2), 900_000);
});
