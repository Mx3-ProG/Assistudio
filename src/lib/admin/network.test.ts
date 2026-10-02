import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNetwork, rankBy, networkTotals, sortMembers, filterMembers } from "./network.ts";
import type { AdminNetworkStats } from "../data/types.ts";

const NOW = Date.parse("2026-10-02T12:00:00.000Z");
const ago = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

function row(id: string, patch: Partial<AdminNetworkStats> = {}): AdminNetworkStats {
  return {
    id, profileId: `p_${id}`, name: id, email: `${id}@test.invalid`, role: "affiliate", code: id.toUpperCase(),
    status: "approved", country: "FR", sponsorId: null, createdAt: ago(90), onboardingCompleted: true,
    recruits: 0, prospects: 0, prospectsWon: 0, leads: 0, clicks30d: 0, paidSales: 0, renewals: 0, revenueCents: 0,
    pendingCents: 0, disputedCents: 0, availableCents: 0, paidCents: 0, sponsorEarnedCents: 0,
    openHelp: 0, openFraud: 0, lastActivityAt: ago(1), ...patch,
  };
}

const opts = { payoutMinimumCents: 5_000, now: NOW };

test("sponsor tree: sponsor name, direct recruits and whole network size", () => {
  const m = buildNetwork([row("a"), row("b", { sponsorId: "a" }), row("c", { sponsorId: "b" }), row("d", { sponsorId: "a" })], opts);
  const a = m.find((x) => x.id === "a")!;
  assert.deepEqual(a.recruitIds.sort(), ["b", "d"]);
  assert.equal(a.networkSize, 3);
  assert.equal(m.find((x) => x.id === "c")!.sponsorName, "b");
});

test("conversion = paid first sales ÷ (prospects + inbound leads)", () => {
  const [m] = buildNetwork([row("a", { prospects: 6, leads: 2, paidSales: 2 })], opts);
  assert.equal(m.totalProspects, 8);
  assert.equal(m.conversionRate, 0.25);
  assert.equal(buildNetwork([row("z")], opts)[0].conversionRate, null);
  // Sales straight from a link (no CRM prospect) never push conversion above 100%.
  const direct = buildNetwork([row("d", { paidSales: 4, prospects: 1 }), row("e", { paidSales: 1, prospects: 3 })], opts);
  assert.equal(direct[0].conversionRate, 1);
  assert.equal(networkTotals(direct, NOW).conversionRate, 5 / 7);
});

test("needs: help first, payout only from the minimum, pending money never triggers a payout", () => {
  const m = buildNetwork([
    row("h", { openHelp: 1, availableCents: 10_000 }),
    row("low", { availableCents: 4_999 }),
    row("pend", { pendingCents: 900_000 }),
    row("app", { status: "pending", onboardingCompleted: false }),
    row("idle", { lastActivityAt: ago(45) }),
    row("new", { createdAt: ago(3), lastActivityAt: null }),
  ], { ...opts, dossiersToAct: { h: 1 } });
  const n = Object.fromEntries(m.map((x) => [x.id, x.needs]));
  assert.deepEqual(n.h, ["help", "contract", "payout_due"]);
  assert.deepEqual(n.low, []);
  assert.deepEqual(n.pend, []);
  assert.deepEqual(n.app, ["application"]);
  assert.deepEqual(n.idle, ["inactive"]);
  assert.deepEqual(n.new, []);
});

test("rankings skip zeroes and need 3 prospects to rank conversion", () => {
  const m = buildNetwork([
    row("lucky", { prospects: 1, paidSales: 1 }),
    row("solid", { prospects: 10, paidSales: 3, revenueCents: 1_800_000 }),
    row("none"),
  ], opts);
  assert.deepEqual(rankBy(m, "conversion").map((x) => x.member.id), ["solid"]);
  assert.deepEqual(rankBy(m, "revenue").map((x) => x.member.id), ["solid"]);
  assert.deepEqual(rankBy(m, "prospects").map((x) => x.member.id), ["solid", "lucky"]);
});

test("earned ranking and totals exclude pending commissions", () => {
  const m = buildNetwork([row("a", { pendingCents: 500_000, availableCents: 1_000, paidCents: 2_000 })], opts);
  assert.equal(rankBy(m, "earned")[0].value, 3_000);
  const t = networkTotals(m, NOW);
  assert.equal(t.availableCents, 1_000);
  assert.equal(t.pendingCents, 500_000);
  assert.equal(t.active30d, 1);
});

test("sort and filter", () => {
  const m = buildNetwork([row("bob", { availableCents: 10 }), row("amy", { availableCents: 50, country: "IT" }), row("cid", { status: "pending" })], opts);
  assert.deepEqual(sortMembers(m, "owed").map((x) => x.id), ["amy", "bob", "cid"]);
  assert.deepEqual(filterMembers(m, "it", "all").map((x) => x.id), ["amy"]);
  assert.deepEqual(filterMembers(m, "", "pending").map((x) => x.id), ["cid"]);
});
