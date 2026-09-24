/**
 * Commission domain logic — pure, framework-free, unit-tested.
 * Mirrors supabase/migrations/*_v02_engine.sql. The database is the source of
 * truth in production; this module powers the demo store, UI derivations and
 * tests. Keep both in sync.
 *
 * Lifecycle (V0.2):
 *   payment confirmed → pending (validation period) → available → paid
 *                        ↘ disputed (needs a human) ↗
 *   refund / chargeback → reversed (a `clawback` when already paid out)
 *   awaiting_payment: legacy V0.1 manual sales only — never created in V0.2.
 */

export type SaleStatus =
  | "pending" | "paid" | "failed" | "refunded" | "chargeback" | "cancelled" | "disputed" | "partially_refunded";
export type CommissionStatus = "awaiting_payment" | "pending" | "disputed" | "available" | "paid" | "reversed";
export type LedgerEntryType =
  | "commission" | "renewal_commission" | "accrual" | "validation" | "release" | "hold" | "unhold"
  | "payout" | "reversal" | "clawback" | "adjustment";

export interface CommissionState {
  status: CommissionStatus;
  amountCents: number;
  validatedAt: string | null;
  holdUntil: string | null;
  availableAt: string | null;
  paidAt: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
  recoveryRequired: boolean;
}

export interface LedgerMove {
  type: LedgerEntryType;
  from: CommissionStatus | null;
  to: CommissionStatus | null;
  amountCents: number;
  note?: string;
}

export type CommissionEvent =
  | { type: "sale_status"; status: SaleStatus; at: string; validationDays: number }
  | { type: "release"; at: string }
  | { type: "dispute"; reason: string }
  | { type: "restore"; at: string; reason: string }
  | { type: "payout_paid"; at: string }
  | { type: "reverse"; at: string; reason: string; amountCents?: number };

export class CommissionTransitionError extends Error {}

const DAY = 86_400_000;

/** Rate (0–1, 4 decimals like numeric(5,4)) → basis points of a basis point (0–10 000). */
export function rateToBps(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new RangeError("rate must be within [0, 1]");
  return Math.round(rate * 10_000);
}

/**
 * Commission in cents, exact integer arithmetic (no float on money).
 * Rounds half away from zero, like Postgres round(numeric).
 */
export function computeCommissionCents(grossCents: number, rate: number): number {
  if (!Number.isSafeInteger(grossCents) || grossCents < 0) throw new RangeError("grossCents must be a non-negative integer");
  const TEN_K = BigInt(10_000);
  const num = BigInt(grossCents) * BigInt(rateToBps(rate));
  const q = num / TEN_K;
  const r = num % TEN_K;
  return Number(r * BigInt(2) >= TEN_K ? q + BigInt(1) : q);
}

/** A commission is created when its payment is confirmed: it starts `pending`. */
export function newCommission(
  amountCents: number,
  paidAt: string,
  validationDays: number,
  opts: { renewal?: boolean; needsReview?: boolean } = {},
): { state: CommissionState; moves: LedgerMove[] } {
  const status: CommissionStatus = opts.needsReview ? "disputed" : "pending";
  const state: CommissionState = {
    status,
    amountCents,
    validatedAt: paidAt,
    holdUntil: new Date(Date.parse(paidAt) + validationDays * DAY).toISOString(),
    availableAt: null,
    paidAt: null,
    reversedAt: null,
    reversalReason: null,
    recoveryRequired: false,
  };
  return { state, moves: [{ type: opts.renewal ? "renewal_commission" : "commission", from: null, to: status, amountCents }] };
}

const REVERSING: SaleStatus[] = ["refunded", "chargeback", "cancelled", "failed"];

function reverse(s: CommissionState, at: string, reason: string, amount?: number) {
  if (s.status === "reversed") return { state: s, moves: [] as LedgerMove[] };
  const delta = Math.min(amount ?? s.amountCents, s.amountCents);
  if (delta <= 0) return { state: s, moves: [] as LedgerMove[] };
  const full = delta === s.amountCents;
  if (s.status === "paid") {
    return {
      state: {
        ...s, recoveryRequired: true, reversalReason: reason,
        ...(full ? { status: "reversed" as const, reversedAt: at } : {}),
      },
      moves: [{ type: "clawback" as const, from: "paid" as const, to: "reversed" as const, amountCents: -delta, note: reason }],
    };
  }
  const move: LedgerMove = { type: "reversal", from: s.status, to: "reversed", amountCents: delta, note: reason };
  return {
    state: full
      ? { ...s, status: "reversed" as const, reversedAt: at, reversalReason: reason }
      : { ...s, amountCents: s.amountCents - delta, reversalReason: reason },
    moves: [move],
  };
}

function restoreTarget(s: CommissionState, at: string): CommissionStatus {
  if (!s.validatedAt) return "awaiting_payment";
  return s.holdUntil && Date.parse(s.holdUntil) > Date.parse(at) ? "pending" : "available";
}

export function transition(s: CommissionState, e: CommissionEvent): { state: CommissionState; moves: LedgerMove[] } {
  switch (e.type) {
    case "sale_status": {
      if (e.status === "paid") {
        if (s.status !== "awaiting_payment") return { state: s, moves: [] };
        const holdUntil = new Date(Date.parse(e.at) + e.validationDays * DAY).toISOString();
        return {
          state: { ...s, status: "pending", validatedAt: e.at, holdUntil },
          moves: [{ type: "validation", from: "awaiting_payment", to: "pending", amountCents: s.amountCents }],
        };
      }
      if (e.status === "disputed") return transition(s, { type: "dispute", reason: "payment_dispute" });
      if (REVERSING.includes(e.status)) return reverse(s, e.at, e.status);
      return { state: s, moves: [] };
    }
    case "release": {
      if (s.status !== "pending" || !s.holdUntil) return { state: s, moves: [] };
      if (Date.parse(s.holdUntil) > Date.parse(e.at)) return { state: s, moves: [] };
      return {
        state: { ...s, status: "available", availableAt: e.at },
        moves: [{ type: "release", from: "pending", to: "available", amountCents: s.amountCents }],
      };
    }
    case "dispute": {
      if (s.status === "disputed" || s.status === "paid" || s.status === "reversed") return { state: s, moves: [] };
      return {
        state: { ...s, status: "disputed" },
        moves: [{ type: "hold", from: s.status, to: "disputed", amountCents: s.amountCents, note: e.reason }],
      };
    }
    case "restore": {
      if (s.status !== "disputed") throw new CommissionTransitionError("commission is not disputed");
      const to = restoreTarget(s, e.at);
      return {
        state: { ...s, status: to, availableAt: to === "available" ? e.at : s.availableAt },
        moves: [{ type: "unhold", from: "disputed", to, amountCents: s.amountCents, note: e.reason }],
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
      return reverse(s, e.at, e.reason, e.amountCents);
  }
}

export interface Balances {
  /** Legacy V0.1 only: sale recorded, payment not collected. Not money. */
  awaitingPaymentCents: number;
  /** Payment confirmed, inside the validation period. NOT earned yet. */
  pendingCents: number;
  /** Frozen until an administrative decision. NOT earned. */
  disputedCents: number;
  /** Validated, payable. Net of clawbacks and adjustments not yet settled. */
  availableCents: number;
  paidCents: number;
  /** Validated history: available + paid. Never includes pending money. */
  lifetimeEarnedCents: number;
  reversedCents: number;
}

/**
 * "Earned" only ever includes commissions whose payment has been collected
 * AND validated (available + paid). Pending money is never shown as earned.
 * `unsettledLedgerCents`: clawbacks (negative) + manual adjustments not yet
 * settled by a payout.
 */
export function summarize(
  commissions: Pick<CommissionState, "status" | "amountCents">[],
  unsettledLedgerCents = 0,
): Balances {
  const sum = (...st: CommissionStatus[]) =>
    commissions.filter((c) => st.includes(c.status)).reduce((a, c) => a + c.amountCents, 0);
  return {
    awaitingPaymentCents: sum("awaiting_payment"),
    pendingCents: sum("pending"),
    disputedCents: sum("disputed"),
    availableCents: sum("available") + unsettledLedgerCents,
    paidCents: sum("paid"),
    lifetimeEarnedCents: sum("available", "paid"),
    reversedCents: sum("reversed"),
  };
}

/**
 * Purely mathematical illustration — NOT a forecast and NOT a promise.
 * n active clients × commission per payment × years.
 */
export function illustrate(clients: number, annualPriceCents: number, rate: number, years = 1): number {
  return clients * computeCommissionCents(annualPriceCents, rate) * years;
}
