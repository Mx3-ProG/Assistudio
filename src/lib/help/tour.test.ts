import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TOUR_STEPS, topicFor } from "./tour.ts";

/** Every `data-tour="…"` value written in the app (literal attributes and `tour: "…"` nav entries). */
function anchorsInSource(): Set<string> {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".tsx")) {
        const src = readFileSync(p, "utf8");
        for (const m of src.matchAll(/data-tour="([a-z-]+)"/g)) found.add(m[1]);
        for (const m of src.matchAll(/\btour: "([a-z-]+)"/g)) found.add(m[1]);
      }
    }
  };
  walk(join(import.meta.dirname, "../.."));
  return found;
}

test("the tour has 6 to 10 steps with unique ids", () => {
  assert.ok(TOUR_STEPS.length >= 6 && TOUR_STEPS.length <= 10);
  assert.equal(new Set(TOUR_STEPS.map((s) => s.id)).size, TOUR_STEPS.length);
});

test("every tour target exists as a data-tour anchor in the app", () => {
  const anchors = anchorsInSource();
  for (const s of TOUR_STEPS) assert.ok(anchors.has(s.target), `missing data-tour="${s.target}" (step ${s.id})`);
});

test("tour routes stay inside the partner space", () => {
  for (const s of TOUR_STEPS) if (s.route) assert.match(s.route, /^\/dashboard(\/|$)/);
});

test("contextual help topic follows the current page", () => {
  assert.equal(topicFor("/fr/dashboard"), "home");
  assert.equal(topicFor("/en/dashboard/prospects/abc"), "prospects");
  assert.equal(topicFor("/fr/dashboard/sales-center/objections"), "salesCenter");
  assert.equal(topicFor("/fr/dashboard/payouts"), "commissions");
  assert.equal(topicFor("/fr/dashboard/documents/videos/tour"), "documents");
  assert.equal(topicFor("/fr/dashboard/settings"), "other");
});
