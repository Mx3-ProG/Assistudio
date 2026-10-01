import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../../i18n/config.ts";
import { validateBody } from "../../lib/sales/content.ts";
import { defaultSalesContent } from "./content.ts";

const vars = (v: unknown) => [...JSON.stringify(v).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(",");

test("every Sales Center item exists in every locale, with a valid body and the same {{variables}}", () => {
  const en = defaultSalesContent.filter((c) => c.locale === "en");
  for (const locale of locales) {
    for (const source of en) {
      const item = defaultSalesContent.find((c) => c.locale === locale && c.kind === source.kind && c.key === source.key);
      assert.ok(item, `${locale}: missing ${source.kind}:${source.key}`);
      const res = validateBody(item.kind, item.body);
      assert.ok(res.ok, `${locale}: invalid ${item.kind}:${item.key} ${res.ok ? "" : res.errors.join(",")}`);
      assert.equal(vars(item.body), vars(source.body), `${locale}: variables differ in ${item.kind}:${item.key}`);
      assert.equal(item.status, source.status, `${locale}: status of ${item.kind}:${item.key}`);
    }
  }
});

test("translated bodies keep the English structure (step keys, script types, CTA modes)", () => {
  const en = new Map(defaultSalesContent.filter((c) => c.locale === "en").map((c) => [`${c.kind}:${c.key}`, c]));
  for (const item of defaultSalesContent.filter((c) => c.locale !== "en")) {
    const source = en.get(`${item.kind}:${item.key}`)!;
    const b = item.body as unknown as Record<string, unknown>, s = source.body as unknown as Record<string, unknown>;
    if (Array.isArray(s.steps)) {
      assert.equal((b.steps as unknown[]).length, (s.steps as unknown[]).length, `${item.locale}: steps of ${item.key}`);
      (s.steps as Record<string, unknown>[]).forEach((step, i) => {
        const t = (b.steps as Record<string, unknown>[])[i];
        assert.equal(t.key, step.key); assert.equal(t.type, step.type);
      });
    }
    if (s.ctaModes) assert.deepEqual(b.ctaModes, s.ctaModes);
    if (s.sections) assert.deepEqual(b.sections, s.sections);
  }
});
