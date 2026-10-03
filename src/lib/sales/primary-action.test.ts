import { test } from "node:test";
import assert from "node:assert/strict";
import { primaryAction } from "./primary-action.ts";

const top = (stage: string, mode: "act" | "follow_up" | "wait" = "act") => ({ id: "p1", name: "Hôtel des Pins", stage, mode });

test("a brand-new ambassador is sent to the start-up checklist", () => {
  assert.equal(primaryAction({ onboardingDone: false, prospectCount: 0, top: null }).path, "/welcome");
});

test("no prospect yet → add the first one", () => {
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 0, top: null }).kind, "noProspect");
});

test("an added prospect leads to the first message, an interested one to a demo", () => {
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 1, top: top("new") }).kind, "message");
  assert.equal(primaryAction({ onboardingDone: false, prospectCount: 1, top: top("new") }).kind, "message");
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 1, top: top("interested") }).kind, "demo");
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 1, top: top("contacted", "follow_up") }).kind, "followUp");
});

test("a sent proposal leads to a follow-up, an appointment to the hand-over form", () => {
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 1, top: top("proposal") }).kind, "proposal");
  const a = primaryAction({ onboardingDone: true, prospectCount: 1, top: top("appointment") });
  assert.deepEqual([a.kind, a.path], ["handoff", "/prospects/p1#handoff"]);
});

test("after a sale, or while every prospect is waiting, add the next opportunity", () => {
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 3, top: null }).kind, "nextOpportunity");
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 3, top: top("contacted", "wait") }).kind, "nextOpportunity");
  assert.equal(primaryAction({ onboardingDone: true, prospectCount: 3, top: top("handed_off") }).kind, "nextOpportunity");
});

test("the start-up checklist counts items, not onboarding steps", async () => {
  const { checklistDone } = await import("./onboarding-checklist.ts");
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((s) => checklistDone(s)), [0, 1, 1, 2, 3, 4, 5]);
  assert.equal(checklistDone(2, true), 5);
});
