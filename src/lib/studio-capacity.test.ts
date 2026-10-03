import assert from "node:assert/strict";
import test from "node:test";
import type { Settings } from "./data/types";
import { studioCapacityState } from "./studio-capacity.ts";

const settings = (patch: Partial<Settings> = {}): Settings => ({
  attributionWindowDays: 90,
  attributionModel: "last_click",
  commissionValidationDays: 30,
  payoutMinimumCents: 5000,
  leaderboardEnabled: true,
  refundPartialPolicy: "manual_review",
  billingEmailsOwner: "stripe",
  connectEnabled: false,
  checkoutEnabled: true,
  sponsorRate: 0.05,
  studioCapacityEnabled: true,
  studioMonthlyCapacity: 4,
  studioRemainingCapacity: 2,
  studioNextOnboardingWindow: "November 2026",
  ...patch,
});

test("Studio capacity is hidden when the message is disabled", () => {
  assert.deepEqual(studioCapacityState(settings({ studioCapacityEnabled: false })), { status: "hidden" });
});

test("Studio capacity exposes truthful available places", () => {
  assert.deepEqual(studioCapacityState(settings()), {
    status: "available", remaining: 2, total: 4, window: "November 2026",
  });
});

test("a full month announces the next window without changing checkout availability", () => {
  const full = settings({ studioRemainingCapacity: 0, checkoutEnabled: true });
  assert.deepEqual(studioCapacityState(full), { status: "full", window: "November 2026" });
  assert.equal(full.checkoutEnabled, true);
});
