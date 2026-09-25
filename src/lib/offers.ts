/**
 * The three Studio ATS offers — pure, framework-free, unit-tested.
 * Prices and rates are never written here: they come from `public.offers`
 * (see supabase/migrations/20260928000001_offers_v3.sql). This module only
 * maps each offer's stable Stripe lookup key to its tier and derives the
 * commission figures the UI shows.
 */
import { computeCommissionCents } from "./commission.ts";

export const OFFER_TIERS = ["one", "pro", "premium"] as const;
export type OfferTier = (typeof OFFER_TIERS)[number];

export const OFFER_LOOKUP_KEYS: Record<OfferTier, string> = {
  one: "studio_one_eur",
  pro: "studio_pro_yearly_eur",
  premium: "studio_yearly_eur",
};

export function isOfferTier(x: unknown): x is OfferTier {
  return typeof x === "string" && (OFFER_TIERS as readonly string[]).includes(x);
}

export function tierOfLookupKey(lookupKey: string | null | undefined): OfferTier | null {
  return OFFER_TIERS.find((t) => OFFER_LOOKUP_KEYS[t] === lookupKey) ?? null;
}

export interface PricedOffer {
  tier: OfferTier;
  priceCents: number;
  commissionRate: number;
  interval: "month" | "year" | "one_time";
}

/** Commission on the offer's first payment, at the given direct rate. */
export function firstSaleCommissionCents(offer: PricedOffer, rate = offer.commissionRate): number {
  return computeCommissionCents(offer.priceCents, rate);
}

/** Renewals pay the same commission again; a one-time offer never renews. */
export function renews(offer: PricedOffer): boolean {
  return offer.interval !== "one_time";
}

/** Offers in tier order (One → Pro → Premium), unknown tiers dropped. */
export function sortOffers<T extends PricedOffer>(offers: T[]): T[] {
  return [...offers].sort((a, b) => OFFER_TIERS.indexOf(a.tier) - OFFER_TIERS.indexOf(b.tier));
}

/** The offer whose first sale pays the most — what the partner home headlines. */
export function maxEarningOffer<T extends PricedOffer>(offers: T[]): T {
  if (!offers.length) throw new RangeError("no offer");
  return offers.reduce((best, o) => (firstSaleCommissionCents(o) > firstSaleCommissionCents(best) ? o : best));
}
