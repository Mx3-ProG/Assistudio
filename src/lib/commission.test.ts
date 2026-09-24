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

test("happy path: pending → in_validation → available → paid", () => {
  let { state, moves } = newCommission(150_000);
  assert.equal(state.status, "pending");
  assert.equal(moves[0].type, "accrual");

  ({ state } = transition(state, { type: "sale_status", status: "paid", at: T0, validationDays: 30 }));
  assert.equal(state.status, "in_validation");
  assert.equal(state.holdUntil, after(30));

  // Too early: stays in validation
  ({ state } = transition(state, { type: "release", at: after(10) }));
  assert.equal(state.status, "in_validation");

  ({ state } = transition(state, { type: "release", at: after(30) }));
  assert.equal(state.status, "available");

  ({ state, moves } = transition(state, { type: "payout_paid", at: after(40) }));
  assert.equal(state.status, "paid");
  assert.equal(moves[0].type, "payout");
});

test("never earned before payment is collected", () => {
  const { state } = newCommission(150_000);
  const b = summarize([state]);
  assert.equal(b.lifetimeEarnedCents, 0);
  assert.equal(b.pendingPaymentCents, 150_000);
});

test("refund before payout reverses; after payout claws back", () => {
  let { state } = newCommission(150_000);
  ({ state } = transition(state, { type: "sale_status", status: "paid", at: T0, validationDays: 30 }));
  const r = transition(state, { type: "sale_status", status: "refunded", at: after(5), validationDays: 30 });
  assert.equal(r.state.status, "reversed");
  assert.equal(r.moves[0].type, "reversal");
  assert.equal(r.moves[0].amountCents, 150_000);

  ({ state } = transition(state, { type: "release", at: after(31) }));
  ({ state } = transition(state, { type: "payout_paid", at: after(40) }));
  const c = transition(state, { type: "sale_status", status: "chargeback", at: after(60), validationDays: 30 });
  assert.equal(c.state.status, "reversed");
  assert.equal(c.moves[0].type, "clawback");
  assert.equal(c.moves[0].amountCents, -150_000);
});

test("reversal is idempotent", () => {
  let { state } = newCommission(100);
  ({ state } = transition(state, { type: "reverse", at: T0, reason: "fraud" }));
  const again = transition(state, { type: "reverse", at: T0, reason: "fraud" });
  assert.equal(again.moves.length, 0);
});

test("hold / unhold returns to the right bucket", () => {
  let { state } = newCommission(100);
  ({ state } = transition(state, { type: "sale_status", status: "paid", at: T0, validationDays: 30 }));
  ({ state } = transition(state, { type: "hold", reason: "review" }));
  assert.equal(state.status, "on_hold");
  assert.equal(transition(state, { type: "unhold", at: after(3), reason: "ok" }).state.status, "in_validation");
  assert.equal(transition(state, { type: "unhold", at: after(45), reason: "ok" }).state.status, "available");
  assert.throws(() => transition({ ...state, status: "paid" }, { type: "hold", reason: "x" }), CommissionTransitionError);
});

test("clawback reduces available balance", () => {
  const b = summarize([{ status: "available", amountCents: 150_000 }], -150_000);
  assert.equal(b.availableCents, 0);
});

test("illustration is plain multiplication", () => {
  assert.equal(illustrate(10, 300_000, 0.5), 1_500_000);
  assert.equal(illustrate(1, 300_000, 0.5, 5), 750_000);
});
