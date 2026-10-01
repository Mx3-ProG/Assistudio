import { test } from "node:test";
import assert from "node:assert/strict";
import { guideFor, recommend, repliesFor, reachedCounts, firstSalePath } from "./guide.ts";
import { validateBody } from "./content.ts";
import { defaultSalesContent } from "../../content/sales-center/content.ts";

const DAY = 86_400_000;
const t0 = Date.parse("2026-10-01T09:00:00Z");
const at = (d: number) => new Date(t0 - d * DAY).toISOString();

test("every pipeline stage has a published generic guide, in EN and FR", () => {
  const guides = defaultSalesContent.filter((c) => c.kind === "stage_guide" && !c.targetKey && c.status === "active");
  for (const locale of ["en", "fr"]) {
    const stages = new Set(guides.filter((g) => g.locale === locale).map((g) => (g.body as { stage: string }).stage));
    for (const s of ["new", "contacted", "replied", "qualified", "interested", "proof_sent", "proposal", "appointment", "handed_off", "checkout", "won", "lost"]) {
      assert.ok(stages.has(s), `${locale}: guide for ${s}`);
    }
  }
});

test("guideFor prefers the sector override, falls back to the generic guide", () => {
  const guides = [
    { key: "g", targetKey: null, body: { stage: "new" } },
    { key: "h", targetKey: "hospitality", body: { stage: "new" } },
  ];
  assert.equal(guideFor(guides, "new", "hospitality")!.key, "h");
  assert.equal(guideFor(guides, "new", "garages")!.key, "g");
  assert.equal(guideFor(guides, "new", null)!.key, "g");
  assert.equal(guideFor(guides, "replied", null), null);
});

test("recommend: act now, wait, then follow up when the sequence step is due", () => {
  const seqs = [{ key: "no-reply", stage: "follow_up", steps: [{ day: 3 }, { day: 7 }] }];
  assert.equal(recommend({ stage: "new", createdAt: at(5) }, seqs, t0).mode, "act");
  const waiting = recommend({ stage: "contacted", createdAt: at(1), stageChangedAt: at(1) }, seqs, t0);
  assert.equal(waiting.mode, "wait");
  assert.equal(waiting.waitUntil, new Date(t0 + 2 * DAY).toISOString());
  const due = recommend({ stage: "contacted", createdAt: at(4), stageChangedAt: at(4) }, seqs, t0);
  assert.equal(due.mode, "follow_up");
  assert.equal(due.stepIndex, 0);
  assert.equal(due.daysSince, 4);
  // a date planned by the ambassador ("call me back later") is respected
  const planned = recommend({ stage: "contacted", createdAt: at(4), stageChangedAt: at(4), nextActionAt: new Date(t0 + DAY).toISOString() }, seqs, t0);
  assert.equal(planned.mode, "wait");
});

test("replies are offered only at their stages", () => {
  const rs = [{ key: "a", body: {} }, { key: "b", body: { stages: ["proposal"] } }];
  assert.deepEqual(repliesFor(rs, "replied").map((r) => r.key), ["a"]);
  assert.deepEqual(repliesFor(rs, "proposal").map((r) => r.key), ["a", "b"]);
});

test("progress counts what was reached, even by prospects lost later", () => {
  const prospects = [{ id: "1", stage: "lost" }, { id: "2", stage: "contacted" }, { id: "3", stage: "new" }];
  const events = [{ prospectId: "1", type: "reply_received" }, { prospectId: "1", type: "lost", stage: "lost" }];
  const r = reachedCounts(prospects, events);
  assert.equal(r.new, 3);
  assert.equal(r.contacted, 2);
  assert.equal(r.replied, 1);
  assert.equal(r.qualified, 0);
});

test("first sale path never counts a pending commission", () => {
  const reached = reachedCounts([{ id: "1", stage: "won" }], []);
  const path = firstSalePath({ profileDone: true, approved: true, reached, sales: 1, commissionAvailable: false });
  assert.equal(path.find((x) => x.key === "sale")!.done, true);
  assert.equal(path.find((x) => x.key === "commission")!.done, false);
});

test("guidance kinds validate: reply levels are 1, 2 or 3", () => {
  const reply = { said: "x", level: 2, answer: "a", show: "none", next: "n" };
  assert.equal(validateBody("reply", reply).ok, true);
  assert.equal(validateBody("reply", { ...reply, level: 4 }).ok, false);
  assert.equal(validateBody("fact", { category: "pricing", question: "q", answer: "a", level: 0 }).ok, false);
  assert.equal(validateBody("stage_guide", { stage: "new", goal: "g", why: "w", action: "a", show: "none", outcomes: [{ label: "l", to: "nowhere", event: "won" }] }).ok, false);
});
