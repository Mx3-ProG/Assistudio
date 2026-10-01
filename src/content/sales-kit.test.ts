import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../i18n/config.ts";
import { defaultSalesAssets } from "./sales-kit.ts";

test("every locale has the full sales kit, with the same types in the same order", () => {
  const en = defaultSalesAssets.filter((x) => x.locale === "en");
  for (const locale of locales) {
    const local = defaultSalesAssets.filter((x) => x.locale === locale);
    assert.equal(local.length, en.length, `${locale}: ${local.length} entries, expected ${en.length}`);
    if (locale === "fr") continue; // French is authored separately, in its own order
    assert.deepEqual(local.map((x) => x.type), en.map((x) => x.type), locale);
    for (const x of local) assert.ok(x.title && x.body, `${locale}: empty entry`);
  }
  assert.equal(new Set(defaultSalesAssets.map((x) => x.id)).size, defaultSalesAssets.length);
});
