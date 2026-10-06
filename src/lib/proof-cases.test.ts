import { test } from "node:test";
import assert from "node:assert/strict";
import { publicClientCaseStudies } from "./proof-cases.ts";

const body = (extra: Record<string, unknown>) => ({ type: "client", name: "Atelier", sector: "Food", clientType: "Restaurant", problem: "p", solution: "s", features: [], argument: "a", description: "d", ...extra });

test("a client project is public only with a documented public consent", () => {
  const items = [
    { kind: "case_study", key: "a", locale: "en", body: body({}) },
    { kind: "case_study", key: "b", locale: "en", body: body({ publicConsentAt: "2026-10-05", publicConsentBy: "Studio staff" }) },
    { kind: "case_study", key: "c", locale: "en", body: body({ type: "demo", publicConsentAt: "2026-10-05", publicConsentBy: "Studio staff" }) },
    { kind: "case_study", key: "d", locale: "en", body: body({ publicConsentAt: "yesterday", publicConsentBy: "x y" }) },
  ];
  assert.deepEqual(publicClientCaseStudies(items, "en").map((c) => c.key), ["b"]);
});

test("a result needs to be written; its source is kept", () => {
  const [c] = publicClientCaseStudies([{ kind: "case_study", key: "b", locale: "fr", body: body({ publicConsentAt: "2026-10-05", publicConsentBy: "Staff", result: " ", resultSource: "CRM" }) }], "fr");
  assert.equal(c.result, null);
  assert.equal(c.resultSource, null, "no source without a result");
});
