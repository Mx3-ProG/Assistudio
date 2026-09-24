/**
 * Commission domain logic — pure, framework-free, unit-tested.
 * Mirrors supabase/migrations/*_commission_engine.sql. The database is the
 * source of truth in production; this module powers the demo store, UI
 * derivations and tests. Keep both in sync.
 */

export type SaleStatus = "pending" | "paid" | "failed" | "refunded" | "chargeback" | "cancelled";
export type CommissionStatus = "pending" | "in_validation" | "on_hold" | "available" | "paid" | "reversed";
export type LedgerEntryType =
  | "accrual" | "validation" | "release" | "hold" | "unhold" | "payout" | "reversal" | "clawback" | "adjustment";

export interface CommissionState {
  status: CommissionStatus;
  amountCents: number;
  validatedAt: string | null;
  holdUntil: string | null;
  availableAt: string | null;
  paidAt: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
}

export interface LedgerMove {
  type: LedgerEntryType;
  from: CommissionStatus | null;
  to: CommissionStatus;
  amountCents: number;
  note?: string;
}

export type CommissionEvent =
  | { type: "sale_status"; status: SaleStatus; at: string; validationDays: number }
  | { type: "release"; at: string }
  | { type: "hold"; reason: string }
  | { type: "unhold"; at: string; reason: string }
  | { type: "payout_paid"; at: string }
  | { type: "reverse"; at: string; reason: string };

export class CommissionTransitionError extends Error {}

const DAY = 86_400_000;

/** Commission amount in cents. Rounds half away from zero like Postgres round(). */
export function computeCommissionCents(grossCents: number, rate: number): number {
  if (!Number.isInteger(grossCents) || grossCents < 0) throw new RangeError("grossCents must be a non-negative integer");
  if (rate < 0 || rate > 1) throw new RangeError("rate must be within [0, 1]");
  return Math.round(grossCents * rate);
}

export function newCommission(amountCents: number): { state: CommissionState; moves: LedgerMove[] } {
  const state: CommissionState = {
    status: "pending",
    amountCents,
    validatedAt: null,
    holdUntil: null,
    availableAt: null,
    paidAt: null,
    reversedAt: null,
    reversalReason: null,
  };
  return { state, moves: [{ type: "accrual", from: null, to: "pending", amountCents }] };
}

const REVERSING: SaleStatus[] = ["refunded", "chargeback", "cancelled", "failed"];

function reverse(s: CommissionState, at: string, reason: string) {
  if (s.status === "reversed") return { state: s, moves: [] as LedgerMove[] };
  const move: LedgerMove =
    s.status === "paid"
      ? { type: "clawback", from: "paid", to: "reversed", amountCents: -s.amountCents, note: reason }
      : { type: "reversal", from: s.status, to: "reversed", amountCents: s.amountCents, note: reason };
  return { state: { ...s, status: "reversed" as const, reversedAt: at, reversalReason: reason }, moves: [move] };
}

export function transition(s: CommissionState, e: CommissionEvent): { state: CommissionState; moves: LedgerMove[] } {
  switch (e.type) {
    case "sale_status": {
      if (e.status === "paid") {
        if (s.status !== "pending" && s.status !== "on_hold") return { state: s, moves: [] };
        const holdUntil = new Date(new Date(e.at).getTime() + e.validationDays * DAY).toISOString();
        if (s.status === "on_hold") return { state: { ...s, validatedAt: e.at, holdUntil }, moves: [] };
        return {
          state: { ...s, status: "in_validation", validatedAt: e.at, holdUntil },
          moves: [{ type: "validation", from: "pending", to: "in_validation", amountCents: s.amountCents }],
        };
      }
      if (REVERSING.includes(e.status)) return reverse(s, e.at, e.status);
      return { state: s, moves: [] };
    }
    case "release": {
      if (s.status !== "in_validation" || !s.holdUntil) return { state: s, moves: [] };
      if (new Date(s.holdUntil).getTime() > new Date(e.at).getTime()) return { state: s, moves: [] };
      return {
        state: { ...s, status: "available", availableAt: e.at },
        moves: [{ type: "release", from: "in_validation", to: "available", amountCents: s.amountCents }],
      };
    }
    case "hold": {
      if (!["pending", "in_validation", "available"].includes(s.status)) {
        throw new CommissionTransitionError(`cannot hold a ${s.status} commission`);
      }
      return {
        state: { ...s, status: "on_hold" },
        moves: [{ type: "hold", from: s.status, to: "on_hold", amountCents: s.amountCents, note: e.reason }],
      };
    }
    case "unhold": {
      if (s.status !== "on_hold") throw new CommissionTransitionError("commission is not on hold");
      const to: CommissionStatus = !s.validatedAt
        ? "pending"
        : s.holdUntil && new Date(s.holdUntil).getTime() > new Date(e.at).getTime()
          ? "in_validation"
          : "available";
      return {
        state: { ...s, status: to, availableAt: to === "available" ? e.at : s.availableAt },
        moves: [{ type: "unhold", from: "on_hold", to, amountCents: s.amountCents, note: e.reason }],
      };
    }
    case "payout_paid": {
      if (s.status !== "available") throw new CommissionTransitionError(`cannot pay a ${s.status} commission`);
      return {
        state: { ...s, status: "paid", paidAt: e.at },
        moves: [{ type: "payout", from: "available", to: "paid", amountCents: s.amountCents }],
      };
    }
    case "reverse":
      return reverse(s, e.at, e.reason);
  }
}

export interface Balances {
  pendingPaymentCents: number;
  inValidationCents: number;
  availableCents: number;
  paidCents: number;
  lifetimeEarnedCents: number;
  reversedCents: number;
}

/**
 * "Earned" only ever includes commissions whose payment has been collected
 * AND validated (available + paid). Pending money is never shown as earned.
 */
export function summarize(
  commissions: Pick<CommissionState, "status" | "amountCents">[],
  unsettledClawbackCents = 0,
): Balances {
  const sum = (...st: CommissionStatus[]) =>
    commissions.filter((c) => st.includes(c.status)).reduce((a, c) => a + c.amountCents, 0);
  return {
    pendingPaymentCents: sum("pending"),
    inValidationCents: sum("in_validation", "on_hold"),
    availableCents: sum("available") + unsettledClawbackCents,
    paidCents: sum("paid"),
    lifetimeEarnedCents: sum("available", "paid"),
    reversedCents: sum("reversed"),
  };
}

/**
 * Purely mathematical illustration — NOT a forecast and NOT a promise.
 * n active clients × annual price × rate × years.
 */
export function illustrate(clients: number, annualPriceCents: number, rate: number, years = 1): number {
  return clients * computeCommissionCents(annualPriceCents, rate) * years;
}
