/**
 * Commission engine — pure decision function.
 *
 *   input : payment + product/offer + affiliate + attribution + rules
 *   output: eligibility, rule, rate, amount, initial status, validation date
 *
 * Mirrors public.evaluate_commission_for() (supabase/migrations/*_v02_engine.sql),
 * which is what production executes inside the payment transaction. This copy
 * powers demo mode, UI projections and unit tests. Keep both in sync.
 *
 * Nothing here knows "50%": rates, recurrence, duration and validation delay
 * all come from `CommissionRule` rows (or the offer as a V0.1 fallback).
 */
import { computeCommissionCents, type CommissionStatus } from "./commission.ts";

export type CommissionType = "percentage" | "fixed";
export type SaleKind = "new" | "renewal" | "upgrade" | "downgrade";

export interface CommissionRule {
  id: string;
  name: string;
  productId: string | null;
  offerId: string | null;
  affiliateId: string | null;
  commissionType: CommissionType;
  rate: number | null;
  fixedAmountCents: number | null;
  currency: string | null;
  appliesToNew: boolean;
  appliesToRenewals: boolean;
  /** null = lifetime */
  durationMonths: number | null;
  /** null = unlimited */
  maxPayments: number | null;
  /** null = settings default */
  validationDays: number | null;
  base: "net_excluding_tax" | "amount_paid";
  priority: number;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  createdAt: string;
}

export interface EngineOffer {
  id: string;
  productId: string;
  commissionRate: number;
  commissionRecurring: boolean;
}

export interface EngineAffiliate {
  id: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  deleted: boolean;
  rateOverride: number | null;
  email: string | null;
}

export interface EnginePayment {
  kind: SaleKind;
  currency: string;
  grossCents: number;
  /** Amount excluding tax, when Stripe reports it. */
  netCents: number | null;
  paidAt: string;
  customerEmail: string | null;
  /** Subscription start, for duration-limited rules. */
  subscriptionStartedAt: string | null;
  /** Commissions already created (not reversed) for this subscription + affiliate. */
  priorCommissionCount: number;
}

export type IneligibleReason =
  | "no_affiliate" | "affiliate_not_found" | "billing_reason_requires_review" | "rule_excludes_new"
  | "rule_excludes_renewals" | "rule_duration_elapsed" | "rule_max_payments_reached" | "currency_mismatch" | "zero_amount";

export type Evaluation =
  | { eligible: false; reason: IneligibleReason }
  | {
      eligible: true;
      ruleId: string | null;
      rate: number;
      baseCents: number;
      amountCents: number;
      validationDays: number;
      status: Extract<CommissionStatus, "pending" | "disputed">;
      availableOn: string;
      reviewReason: string | null;
    };

const DAY = 86_400_000;

function addMonths(iso: string, months: number): number {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.getTime();
}

/** Most specific active rule wins: affiliate > offer > product > priority > newest. */
export function resolveRule(rules: CommissionRule[], affiliateId: string, offer: EngineOffer, at: string): CommissionRule | null {
  const t = Date.parse(at);
  const candidates = rules.filter(
    (r) =>
      r.isActive &&
      Date.parse(r.validFrom) <= t &&
      (!r.validTo || Date.parse(r.validTo) > t) &&
      (!r.productId || r.productId === offer.productId) &&
      (!r.offerId || r.offerId === offer.id) &&
      (!r.affiliateId || r.affiliateId === affiliateId),
  );
  const score = (r: CommissionRule) => [r.affiliateId ? 1 : 0, r.offerId ? 1 : 0, r.productId ? 1 : 0, r.priority, Date.parse(r.createdAt)];
  candidates.sort((a, b) => {
    const sa = score(a), sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sb[i] - sa[i];
    return 0;
  });
  return candidates[0] ?? null;
}

export function evaluateCommission(input: {
  affiliate: EngineAffiliate | null;
  offer: EngineOffer;
  payment: EnginePayment;
  rules: CommissionRule[];
  defaultValidationDays: number;
}): Evaluation {
  const { affiliate, offer, payment } = input;
  if (!affiliate) return { eligible: false, reason: "no_affiliate" };
  if (affiliate.deleted) return { eligible: false, reason: "affiliate_not_found" };
  if (payment.kind !== "new" && payment.kind !== "renewal") return { eligible: false, reason: "billing_reason_requires_review" };

  const rule = resolveRule(input.rules, affiliate.id, offer, payment.paidAt);
  const r = rule ?? {
    id: null, commissionType: "percentage" as const, rate: offer.commissionRate, fixedAmountCents: null, currency: null,
    appliesToNew: true, appliesToRenewals: offer.commissionRecurring, durationMonths: null, maxPayments: null,
    validationDays: null, base: "net_excluding_tax" as const,
  };

  if (payment.kind === "new" && !r.appliesToNew) return { eligible: false, reason: "rule_excludes_new" };
  if (payment.kind === "renewal" && !r.appliesToRenewals) return { eligible: false, reason: "rule_excludes_renewals" };
  if (payment.subscriptionStartedAt && r.durationMonths != null
      && Date.parse(payment.paidAt) >= addMonths(payment.subscriptionStartedAt, r.durationMonths)) {
    return { eligible: false, reason: "rule_duration_elapsed" };
  }
  if (r.maxPayments != null && payment.priorCommissionCount >= r.maxPayments) {
    return { eligible: false, reason: "rule_max_payments_reached" };
  }

  const baseCents = r.base === "net_excluding_tax" ? (payment.netCents ?? payment.grossCents) : payment.grossCents;
  let rate: number;
  let amountCents: number;
  if (r.commissionType === "percentage") {
    rate = affiliate.rateOverride ?? r.rate ?? 0;
    amountCents = computeCommissionCents(baseCents, rate);
  } else {
    if (r.currency !== payment.currency) return { eligible: false, reason: "currency_mismatch" };
    amountCents = Math.min(r.fixedAmountCents ?? 0, baseCents);
    rate = baseCents > 0 ? Math.min(Math.round((amountCents / baseCents) * 10_000) / 10_000, 1) : 0;
  }
  if (amountCents <= 0) return { eligible: false, reason: "zero_amount" };

  const validationDays = r.validationDays ?? input.defaultValidationDays;
  const selfReferral = !!payment.customerEmail && !!affiliate.email
    && payment.customerEmail.toLowerCase() === affiliate.email.toLowerCase();
  const reviewReason = affiliate.status !== "approved" ? `affiliate_${affiliate.status}` : selfReferral ? "self_referral" : null;

  return {
    eligible: true,
    ruleId: rule?.id ?? null,
    rate,
    baseCents,
    amountCents,
    validationDays,
    status: reviewReason ? "disputed" : "pending",
    availableOn: new Date(Date.parse(payment.paidAt) + validationDays * DAY).toISOString(),
    reviewReason,
  };
}
