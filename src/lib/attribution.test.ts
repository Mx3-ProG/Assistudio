import { test } from "node:test";
import assert from "node:assert/strict";
import { recordTouch, resolveAttribution, encodeRefCookie, decodeRefCookie, isValidCode } from "./attribution.ts";

const now = new Date("2026-03-01T00:00:00Z");

test("first vs last click", () => {
  let c = recordTouch(null, { ref: "AAA111", at: "2026-02-01T00:00:00Z" });
  c = recordTouch(c, { ref: "BBB222", at: "2026-02-20T00:00:00Z" });
  assert.equal(resolveAttribution(c, "first_click", 90, now)?.ref, "AAA111");
  assert.equal(resolveAttribution(c, "last_click", 90, now)?.ref, "BBB222");
});

test("window is enforced at conversion time", () => {
  const c = recordTouch(null, { ref: "AAA111", at: "2026-02-01T00:00:00Z" });
  assert.equal(resolveAttribution(c, "last_click", 7, now), null);
  assert.ok(resolveAttribution(c, "last_click", 30, now));
});

test("cookie round-trip and tamper resistance", () => {
  const c = recordTouch(null, { ref: "AAA111", link: "LNK12345", at: now.toISOString() });
  assert.deepEqual(decodeRefCookie(encodeRefCookie(c)), c);
  assert.equal(decodeRefCookie("garbage"), null);
  assert.equal(decodeRefCookie(encodeURIComponent(JSON.stringify({ v: 1, first: { ref: "<script>" }, last: { ref: "x" } }))), null);
  assert.equal(isValidCode("mathieu"), true);
  assert.equal(isValidCode("a b"), false);
});

test("manual model: no automatic attribution, whatever the cookie says", () => {
  const c = recordTouch(null, { ref: "ALICE1", at: new Date().toISOString() });
  assert.equal(resolveAttribution(c, "manual", 90), null);
  assert.equal(resolveAttribution(c, "last_click", 90)?.ref, "ALICE1");
});

test("expired attribution: the configured window decides (scenario 9)", () => {
  const old = new Date(Date.now() - 100 * 86_400_000).toISOString();
  const c = recordTouch(null, { ref: "BOB", at: old });
  assert.equal(resolveAttribution(c, "last_click", 90), null);
  assert.equal(resolveAttribution(c, "last_click", 120)?.ref, "BOB");
});
