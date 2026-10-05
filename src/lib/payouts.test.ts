import { test } from "node:test";
import assert from "node:assert/strict";
import { allocate, checkRequest, payableCents, payoutProblem, payoutErrorCode, moneyMovements, PayoutError, type AllocatableCommission } from "./payouts.ts";
import { summarize } from "./commission.ts";

const com = (id: string, amountCents: number, availableAt: string, allocatedCents = 0, status: AllocatableCommission["status"] = "available"): AllocatableCommission =>
  ({ id, status, amountCents, availableAt, createdAt: availableAt, allocatedCents });
const MIN = 5000;
const ok = { minimumCents: MIN, approved: true, hasOpenPayout: false };

test("request checks, in the database's order (§16 cases)", () => {
  assert.equal(checkRequest({ ...ok, amountCents: 5000, availableCents: 0 }), "insufficient_balance", "0 € available");
  assert.equal(checkRequest({ ...ok, amountCents: 4900, availableCents: 4900 }), "below_minimum", "49 €");
  assert.equal(checkRequest({ ...ok, amountCents: 5000, availableCents: 5000 }), null, "exactly 50 €");
  assert.equal(checkRequest({ ...ok, amountCents: 5001, availableCents: 5000 }), "insufficient_balance", "more than the balance");
  assert.equal(checkRequest({ ...ok, amountCents: 0, availableCents: 5000 }), "invalid_amount");
  assert.equal(checkRequest({ ...ok, amountCents: 12.5, availableCents: 5000 }), "invalid_amount", "cents are integers");
  assert.equal(checkRequest({ ...ok, amountCents: 5000, availableCents: 9000, hasOpenPayout: true }), "already_open", "one request at a time");
  assert.equal(checkRequest({ ...ok, amountCents: 5000, availableCents: 9000, approved: false }), "not_approved");
});

test("payable = free cents of available commissions, net of clawbacks", () => {
  const c = [com("a", 150000, "2026-01-01", 100000), com("b", 150000, "2026-01-02"), com("p", 99999, "2026-01-01", 0, "pending")];
  assert.equal(payableCents(c), 200000);
  assert.equal(payableCents(c, -50000), 150000);
});

test("allocation is FIFO, splits the last commission, never exceeds what is free", () => {
  const c = [com("new", 150000, "2026-02-01"), com("old", 150000, "2026-01-01", 100000)];
  assert.deepEqual(allocate(c, 100000), [{ commissionId: "old", amountCents: 50000 }, { commissionId: "new", amountCents: 50000 }]);
  assert.deepEqual(allocate(c, 200000), [{ commissionId: "old", amountCents: 50000 }, { commissionId: "new", amountCents: 150000 }], "total request");
  assert.throws(() => allocate(c, 200001), (e: unknown) => e instanceof PayoutError && e.code === "insufficient_balance");
});

test("an open clawback is recovered by the next payout", () => {
  const c = [com("a", 300000, "2026-01-01")];
  assert.deepEqual(allocate(c, 150000, -150000), [{ commissionId: "a", amountCents: 300000 }]);
  assert.throws(() => allocate(c, 10000, 20000), (e: unknown) => e instanceof PayoutError && e.code === "amount_below_adjustments");
});

test("a refunded or over-allocated commission blocks the payment", () => {
  assert.equal(payoutProblem([{ status: "available", amountCents: 100, allocatedCents: 100, ref: "S1" }]), null);
  assert.match(payoutProblem([{ status: "reversed", amountCents: 100, allocatedCents: 100, ref: "S1" }])!, /S1: commission reversed/);
  assert.match(payoutProblem([{ status: "available", amountCents: 100, allocatedCents: 101, ref: "S2" }])!, /S2: over-allocated/);
});

test("database error messages map to codes", () => {
  assert.equal(payoutErrorCode("payout.below_minimum"), "below_minimum");
  assert.equal(payoutErrorCode("ERROR: payout.ineligible:SAL-1: commission reversed"), "ineligible");
  assert.equal(payoutErrorCode("duplicate key value"), null);
});

test("balances: requested money is not available, partial payouts count as paid", () => {
  const b = summarize([
    { status: "available", amountCents: 150000, paidAllocCents: 100000, openAllocCents: 0 },
    { status: "available", amountCents: 150000, paidAllocCents: 0, openAllocCents: 150000 },
    { status: "pending", amountCents: 150000 },
  ], 0, 150000);
  assert.equal(b.availableCents, 50000);
  assert.equal(b.requestedCents, 150000);
  assert.equal(b.paidCents, 100000);
  assert.equal(b.pendingCents, 150000);
  assert.equal(b.lifetimeEarnedCents, 300000, "earned never includes pending");
});

test("money history, newest first", () => {
  const m = moneyMovements(
    [{ status: "available", amountCents: 75000, availableAt: "2026-09-12", validatedAt: "2026-08-13", saleRef: "A184", kind: "new" },
     { status: "pending", amountCents: 75000, availableAt: null, validatedAt: "2026-10-01", saleRef: "A200", kind: "new" }],
    [{ ref: "PAY-1", amountCents: 75000, status: "paid", requestedAt: "2026-09-15", paidAt: "2026-09-18" },
     { ref: "PAY-2", amountCents: 300000, status: "processing", requestedAt: "2026-10-05", paidAt: null }],
  );
  assert.deepEqual(m.map((x) => x.kind), ["request", "payout", "request", "commission"]);
  assert.ok(!m.some((x) => x.kind === "commission" && x.saleRef === "A200"), "pending money is not a movement yet");
});
