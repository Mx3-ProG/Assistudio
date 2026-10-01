import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "../i18n/config.ts";
import { defaultMarkets } from "./markets.ts";

const vars = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(",");

test("every market and target card exists in every locale, with the same fields and {{variables}}", () => {
  for (const market of defaultMarkets) {
    const en = market.content.en;
    for (const locale of locales) {
      const c = market.content[locale];
      assert.ok(c, `${locale}: missing market ${market.slug}`);
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        assert.ok(c[key] !== undefined && c[key] !== "", `${locale}/${market.slug}: missing ${key}`);
        if (Array.isArray(en[key])) assert.equal((c[key] as string[]).length, (en[key] as string[]).length, `${locale}/${market.slug}: ${key} length`);
      }
      assert.equal(vars(c.message), vars(en.message), `${locale}/${market.slug}: message variables`);
    }
  }
});
