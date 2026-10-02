import { test } from "node:test";
import assert from "node:assert/strict";
import { firstSaleCommissionCents, maxEarningOffer, renews, sortOffers, tierOfLookupKey, type PricedOffer } from "./offers.ts";

const RATE = 0.25; // the existing direct rate — the offers change prices, not rates
const offers: PricedOffer[] = [
  { tier: "premium", priceCents: 600_000, commissionRate: RATE, interval: "year" },
  { tier: "one", priceCents: 50_000, commissionRate: RATE, interval: "one_time" },
  { tier: "pro", priceCents: 300_000, commissionRate: RATE, interval: "year" },
];

test("each offer pays the existing rate on its own price", () => {
  const [one, pro, premium] = sortOffers(offers);
  assert.deepEqual([one.tier, pro.tier, premium.tier], ["one", "pro", "premium"]);
  assert.equal(firstSaleCommissionCents(one), 12_500);
  assert.equal(firstSaleCommissionCents(pro), 75_000);
  assert.equal(firstSaleCommissionCents(premium), 150_000);
  assert.equal(firstSaleCommissionCents(premium, 0.05), 30_000); // direct sponsor share
});

test("only annual offers renew", () => {
  assert.deepEqual(sortOffers(offers).map(renews), [false, true, true]);
});

test("the headline is the maximum possible commission", () => {
  assert.equal(maxEarningOffer(offers).tier, "premium");
  assert.throws(() => maxEarningOffer([]));
});

test("lookup keys map to tiers", () => {
  assert.equal(tierOfLookupKey("assistudio_premium_yearly_eur"), "premium");
  assert.equal(tierOfLookupKey("assistudio_one_eur"), "one");
  assert.equal(tierOfLookupKey("other"), null);
});
