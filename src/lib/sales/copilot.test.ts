import { test } from "node:test";
import assert from "node:assert/strict";
import { matchSectors, relatedToSector } from "./sectors.ts";
import { followUpStatus, nextPlannedAt, followUpBoard } from "./follow-up.ts";
import { validateBody } from "./content.ts";
import { defaultMarkets } from "../../content/markets.ts";
import { withAmbassadorCode } from "../attribution.ts";

const DAY = 86_400_000;
const slugs = (q: string) => matchSectors(q, defaultMarkets).map((m) => m.market.slug);

test("sector search finds the sheet from a job name, synonym or plural, in FR or EN", () => {
  assert.equal(slugs("Hôtellerie")[0], "hospitality");
  assert.equal(slugs("hotels")[0], "hospitality");
  assert.equal(slugs("chambre d'hôtes")[0], "hospitality");
  assert.equal(slugs("pizzeria")[0], "restaurants");
  assert.equal(slugs("coach sportif")[0], "coaches");
  assert.equal(slugs("photographe")[0], "photographers");
  assert.equal(slugs("plombier")[0], "artisans");
  assert.equal(slugs("e-commerce")[0], "ecommerce");
  assert.equal(slugs("avocat")[0], "liberal-professions");
  assert.equal(slugs("industrie")[0], "industry");
  assert.ok(slugs("freelance").includes("independents"));
});

test("sector search ignores noise and too-short queries", () => {
  assert.deepEqual(slugs("x"), []);
  assert.deepEqual(slugs("zzzzqq"), []);
});

test("relatedToSector puts linked items first, then tag matches, never unrelated ones", () => {
  const hotel = defaultMarkets.find((m) => m.slug === "hospitality")!;
  const items = [
    { key: "generic", targetKey: null, tags: ["price"], sort: 1 },
    { key: "tagged", targetKey: "service-providers", tags: ["hôtellerie"], sort: 0 },
    { key: "linked", targetKey: "hospitality", tags: [], sort: 5 },
    { key: "other", targetKey: "garages", tags: ["garage"], sort: 0 },
  ];
  assert.deepEqual(relatedToSector(items, hotel).map((x) => x.key), ["linked", "tagged"]);
});

test("follow-up sequence: due step = latest passed day, planned actions are respected", () => {
  const steps = [{ day: 1 }, { day: 3 }, { day: 7 }, { day: 14 }, { day: 30 }];
  const t0 = Date.parse("2026-10-01T09:00:00Z");
  const p = { stage: "contacted", createdAt: new Date(t0).toISOString(), stageChangedAt: new Date(t0).toISOString() };
  assert.equal(followUpStatus(p, steps, t0)!.due, null);
  assert.equal(followUpStatus(p, steps, t0)!.next!.index, 0);
  assert.equal(followUpStatus(p, steps, t0 + 4 * DAY)!.due, 1);
  assert.equal(followUpStatus(p, steps, t0 + 40 * DAY)!.due, 4);
  assert.equal(followUpStatus(p, steps, t0 + 40 * DAY)!.next, null);
  // the ambassador planned the next touch in the future → nothing due
  const planned = { ...p, nextActionAt: new Date(t0 + 6 * DAY).toISOString() };
  assert.equal(followUpStatus(planned, steps, t0 + 4 * DAY)!.due, null);
  // stages without a sequence
  assert.equal(followUpStatus({ ...p, stage: "won" }, steps, t0), null);
  assert.equal(followUpStatus(p, [], t0), null);
});

test("mark as sent plans the next step, never in the past", () => {
  const steps = [{ day: 1 }, { day: 3 }, { day: 7 }];
  const t0 = Date.parse("2026-10-01T09:00:00Z");
  const p = { stage: "contacted", createdAt: new Date(t0).toISOString(), stageChangedAt: new Date(t0).toISOString() };
  assert.deepEqual(nextPlannedAt(p, steps, t0 + 1 * DAY), { index: 1, at: new Date(t0 + 3 * DAY).toISOString() });
  // J+7 is passed but J+3 was sent late: the next one is planned for tomorrow at the earliest
  const late = nextPlannedAt(p, steps, t0 + 3 * DAY + 6.5 * DAY);
  assert.equal(late, null);
  const r = nextPlannedAt(p, steps, t0 + 2 * DAY);
  assert.equal(r!.index, 1);
  assert.ok(Date.parse(r!.at) >= t0 + 3 * DAY);
});

test("new content kinds are validated (unsafe URLs, unordered sequences rejected)", () => {
  const cs = {
    type: "client", name: "X", sector: "Hotel", clientType: "Hotel", description: "d", problem: "p", solution: "s",
    features: ["a"], argument: "arg", offer: "pro", url: "https://x.example", image: "/portfolio/x.webp",
  };
  assert.equal(validateBody("case_study", cs).ok, true);
  assert.equal(validateBody("case_study", { ...cs, url: "javascript:alert(1)" }).ok, false);
  assert.equal(validateBody("case_study", { ...cs, type: "testimonial" }).ok, false);
  const seq = { steps: [{ day: 3, channel: "email", goal: "g", text: "t" }, { day: 1, channel: "email", goal: "g", text: "t" }] };
  assert.equal(validateBody("sequence", seq).ok, false);
  assert.equal(validateBody("sequence", { steps: [...seq.steps].reverse() }).ok, true);
});

test("a typed ambassador code only fills an empty attribution", () => {
  assert.deepEqual(withAmbassadorCode(null, "aff_b"), { affiliateId: "aff_b", byCode: true, conflict: false });
  assert.deepEqual(withAmbassadorCode("aff_a", "aff_b"), { affiliateId: "aff_a", byCode: false, conflict: true });
  assert.deepEqual(withAmbassadorCode("aff_a", "aff_a"), { affiliateId: "aff_a", byCode: false, conflict: false });
  assert.deepEqual(withAmbassadorCode(null, null), { affiliateId: null, byCode: false, conflict: false });
});

test("follow-up board: due prospects first, others by planned date, unrelated stages ignored", () => {
  const t0 = Date.parse("2026-10-01T09:00:00Z");
  const seqs = [{ key: "no-reply", stage: "follow_up", steps: [{ day: 1 }, { day: 3 }] }, { key: "after-proposal", stage: "proposal", steps: [{ day: 2 }] }];
  const at = (d: number) => new Date(t0 - d * DAY).toISOString();
  const ps = [
    { id: "a", stage: "contacted", createdAt: at(0), stageChangedAt: at(0) },
    { id: "b", stage: "contacted", createdAt: at(4), stageChangedAt: at(4) },
    { id: "c", stage: "proposal", createdAt: at(2), stageChangedAt: at(2) },
    { id: "d", stage: "won", createdAt: at(9), stageChangedAt: at(9) },
  ];
  const board = followUpBoard(ps, seqs, t0);
  assert.deepEqual(board.map((r) => r.prospect.id), ["b", "c", "a"]);
  assert.equal(board[0].sequenceKey, "no-reply");
  assert.equal(board[2].step, null);
});
