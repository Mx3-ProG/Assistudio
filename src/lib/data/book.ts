import type { RecurringBook, RecurringContract } from "./types";

const DAY = 86_400_000;

/** Recurring book totals. Projections stay projections: only `earnedCents` is validated money. */
export function summarizeBook(contracts: RecurringContract[], currency: string, earnedCents: number): RecurringBook {
  const live = contracts.filter((c) => c.status === "active" || c.status === "past_due");
  const renewing = live.filter((c) => !c.cancelling);
  const in60 = Date.now() + 60 * DAY;
  return {
    contracts: contracts.map((c) => ({ ...c, renewsSoon: !c.cancelling && Date.parse(c.renewalDate) <= in60 })),
    currency, earnedCents,
    activeCount: live.length,
    // Recurring = will renew: contracts with a scheduled cancellation are excluded.
    annualRevenueCents: renewing.filter((c) => c.currency === currency).reduce((a, c) => a + c.annualCents, 0),
    potentialRenewalCommissionsCents: renewing.filter((c) => c.currency === currency).reduce((a, c) => a + c.nextCommissionCents, 0),
    upcoming60dCount: renewing.filter((c) => Date.parse(c.renewalDate) <= in60).length,
    renewedCount: contracts.reduce((a, c) => a + c.renewalsCount, 0),
    cancelledCount: contracts.filter((c) => c.cancelling || c.status === "cancelled" || c.status === "expired").length,
  };
}
