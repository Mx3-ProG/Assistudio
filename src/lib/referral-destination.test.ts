import { test } from "node:test";
import assert from "node:assert/strict";
import { referralDestination } from "./referral-destination.ts";

test("a bare active referral opens the affiliate public page", () => {
  assert.equal(referralDestination("fr", { affiliateCode: "ABC123", active: true }, null), "/fr/a/ABC123");
});

test("explicit same-origin destinations keep priority", () => {
  assert.equal(referralDestination("en", { affiliateCode: "ABC123", active: true }, "/en/buy?via=link"), "/en/buy?via=link");
});

test("unsafe and inactive referrals fall back to the Studio page", () => {
  assert.equal(referralDestination("fr", { affiliateCode: "ABC123", active: false }, "https://evil.invalid"), "/fr/studio");
  assert.equal(referralDestination("fr", { affiliateCode: "ABC123", active: true }, "//evil.invalid"), "/fr/a/ABC123");
  assert.equal(referralDestination("fr", null, "/\\evil.invalid"), "/fr/studio");
});
