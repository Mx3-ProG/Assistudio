import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CLIENT_EVENTS, FUNNEL_EVENTS, parseFunnelPayload } from "./events.ts";

test("funnel events match the SQL check constraint", () => {
  const sql = readFileSync(new URL("../../../supabase/migrations/20261010000001_funnel_events.sql", import.meta.url), "utf8");
  const listed = [...sql.slice(sql.indexOf("event in ("), sql.indexOf("affiliate_id uuid")).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...listed].sort(), [...FUNNEL_EVENTS].sort());
});

test("server-only events cannot be sent by a browser", () => {
  for (const e of ["signup_completed", "prospect_added", "prospect_submitted", "onboarding_completed"]) {
    assert.equal(parseFunnelPayload({ event: e }), null, e);
    assert.ok(!(CLIENT_EVENTS as readonly string[]).includes(e));
  }
});

test("beacon payloads are sanitised", () => {
  assert.equal(parseFunnelPayload(null), null);
  assert.equal(parseFunnelPayload({ event: "drop table" }), null);
  const p = parseFunnelPayload({
    event: "commission_simulator_interaction", placement: "Simulator!", locale: "fr",
    meta: { tier: "premium", clients: 5, ok: true, email: "x@y.z", "Bad Key": 1, long: "a".repeat(80) },
  });
  assert.deepEqual(p, { event: "commission_simulator_interaction", placement: null, locale: "fr", meta: { tier: "premium", clients: 5, ok: true } });
});
