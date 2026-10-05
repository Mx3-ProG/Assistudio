import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { INTERACTIVE_DEMOS } from "./interactive-demos.ts";

const pub = (p: string) => join(import.meta.dirname, "../../public", p);

test("demos have unique url-safe slugs and en + fr texts", () => {
  assert.equal(new Set(INTERACTIVE_DEMOS.map((d) => d.slug)).size, INTERACTIVE_DEMOS.length);
  for (const d of INTERACTIVE_DEMOS) {
    assert.match(d.slug, /^[a-z0-9-]+$/, `${d.slug}: slug must be lowercase letters, digits and dashes`);
    for (const x of [d.title, d.description, ...(d.sector ? [d.sector] : [])]) assert.ok(x.en && x.fr, `${d.slug}: missing en or fr text`);
  }
});

test("demos point at real files or an https URL", () => {
  for (const d of INTERACTIVE_DEMOS) {
    if (d.src.startsWith("https://")) continue;
    assert.ok(d.src.startsWith("/interactive-demos/"), `${d.slug}: local demos live in public/interactive-demos/`);
    assert.ok(existsSync(pub(d.src)), `${d.slug}: missing ${d.src}`);
    if (d.thumb) assert.ok(existsSync(pub(d.thumb)), `${d.slug}: missing ${d.thumb}`);
  }
});
