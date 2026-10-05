/**
 * Partner payout requests — pure, framework-free, unit-tested.
 * Mirrors supabase/migrations/20261012000002_payout_requests.sql
 * (affiliate_request_payout, payout_allocate, payout_problem). The database is
 * the source of truth in production; this module powers the demo store, the
 * UI derivations and the tests. Keep both in sync.
 *
 *   available → requested ─▶ processing ─▶ paid
 *                        ↘ rejected / failed (cents released, available again)
 *   scheduled: legacy staff-initiated payout.
 */
import type { CommissionStatus } from "./commission";

export type PayoutStatus = "requested" | "scheduled" | "processing" | "paid" | "failed" | "cancelled" | "rejected";
export type PayoutMethod = "manual" | "stripe_connect";

/** Statuses during which the payout's cents are reserved and the partner cannot ask again. */
export const OPEN_PAYOUT_STATUSES: readonly PayoutStatus[] = ["requested", "scheduled", "processing"];
export const isOpenPayout = (s: PayoutStatus) => OPEN_PAYOUT_STATUSES.includes(s);

/** Error codes raised by the database functions (`payout.<code>`), translated in the UI. */
export const PAYOUT_ERRORS = [
  "unauthenticated", "no_affiliate", "not_approved", "invalid_amount", "below_minimum", "already_open",
  "insufficient_balance", "amount_below_adjustments", "ineligible", "reference_required", "reason_required",
  "invalid_status", "not_found",
] as const;
export type PayoutErrorCode = (typeof PAYOUT_ERRORS)[number];

export class PayoutError extends Error {
  code: PayoutErrorCode;
  detail?: string;
  constructor(code: PayoutErrorCode, detail?: string) {
    super(`payout.${code}${detail ? `:${detail}` : ""}`);
    this.code = code;
    this.detail = detail;
  }
}

/** "payout.below_minimum" / "… payout.ineligible:SAL-1: commission reversed" → code. */
export function payoutErrorCode(message: string): PayoutErrorCode | null {
  const m = /payout\.([a-z_]+)/.exec(message);
  return m && (PAYOUT_ERRORS as readonly string[]).includes(m[1]) ? (m[1] as PayoutErrorCode) : null;
}

/** A commission as the allocator sees it. `allocatedCents` = live allocations (open + paid). */
export interface AllocatableCommission {
  id: string;
  status: CommissionStatus;
  amountCents: number;
  availableAt: string | null;
  createdAt: string;
  allocatedCents: number;
}

/** Free cents of available commissions, net of unsettled clawbacks / adjustments. */
export function payableCents(commissions: AllocatableCommission[], unsettledLedgerCents = 0): number {
  return commissions
    .filter((c) => c.status === "available")
    .reduce((a, c) => a + Math.max(c.amountCents - c.allocatedCents, 0), 0) + unsettledLedgerCents;
}

/** Server-side checks of a request, in the database's order. */
export function checkRequest(input: {
  amountCents: number; minimumCents: number; availableCents: number; approved: boolean; hasOpenPayout: boolean;
}): PayoutErrorCode | null {
  if (!input.approved) return "not_approved";
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) return "invalid_amount";
  if (input.amountCents < input.minimumCents) return "below_minimum";
  if (input.hasOpenPayout) return "already_open";
  if (input.amountCents > input.availableCents) return "insufficient_balance";
  return null;
}

/**
 * Which cents of which commissions a payout of `amountCents` takes: open
 * clawbacks / adjustments are settled into it first, then the oldest
 * available commissions (FIFO), splitting the last one if needed.
 */
export function allocate(
  commissions: AllocatableCommission[], amountCents: number, unsettledLedgerCents = 0,
): { commissionId: string; amountCents: number }[] {
  if (unsettledLedgerCents > 0 && amountCents < unsettledLedgerCents) throw new PayoutError("amount_below_adjustments");
  let need = amountCents - unsettledLedgerCents;
  const out: { commissionId: string; amountCents: number }[] = [];
  const queue = commissions
    .filter((c) => c.status === "available")
    .sort((a, b) => (a.availableAt ?? a.createdAt).localeCompare(b.availableAt ?? b.createdAt) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const c of queue) {
    if (need <= 0) break;
    const free = c.amountCents - c.allocatedCents;
    if (free <= 0) continue;
    const take = Math.min(free, need);
    out.push({ commissionId: c.id, amountCents: take });
    need -= take;
  }
  if (need > 0) throw new PayoutError("insufficient_balance");
  return out;
}

/** Before money moves: allocated commissions must still be payable and never over-allocated. */
export function payoutProblem(allocated: { status: CommissionStatus; amountCents: number; allocatedCents: number; ref: string }[]): string | null {
  const bad = allocated
    .filter((c) => (c.status !== "available" && c.status !== "paid") || c.allocatedCents > c.amountCents)
    .map((c) => `${c.ref}: ${c.status !== "available" && c.status !== "paid" ? `commission ${c.status}` : "over-allocated"}`);
  return bad.length ? bad.join("; ") : null;
}

/** Money movements of a partner, newest first, for the payouts history. */
export type MoneyMovement =
  | { kind: "commission"; at: string; amountCents: number; saleRef: string; renewal: boolean }
  | { kind: "request"; at: string; amountCents: number; ref: string; status: PayoutStatus }
  | { kind: "payout"; at: string; amountCents: number; ref: string };

export function moneyMovements(
  commissions: { status: CommissionStatus; amountCents: number; availableAt?: string | null; validatedAt: string | null; saleRef: string; kind: "new" | "renewal" }[],
  payouts: { ref: string; amountCents: number; status: PayoutStatus; requestedAt: string; paidAt: string | null }[],
): MoneyMovement[] {
  const out: MoneyMovement[] = [];
  for (const c of commissions) {
    if (c.status !== "available" && c.status !== "paid") continue;
    const at = c.availableAt ?? c.validatedAt;
    if (at) out.push({ kind: "commission", at, amountCents: c.amountCents, saleRef: c.saleRef, renewal: c.kind === "renewal" });
  }
  for (const p of payouts) {
    out.push({ kind: "request", at: p.requestedAt, amountCents: p.amountCents, ref: p.ref, status: p.status });
    if (p.status === "paid" && p.paidAt) out.push({ kind: "payout", at: p.paidAt, amountCents: p.amountCents, ref: p.ref });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
