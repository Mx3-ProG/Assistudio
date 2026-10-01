import { test } from "node:test";
import assert from "node:assert/strict";
import { locales } from "./config.ts";
import en from "./dictionaries/en.ts";
import fr from "./dictionaries/fr.ts";
import de from "./dictionaries/de.ts";
import es from "./dictionaries/es.ts";
import pt from "./dictionaries/pt.ts";
import it from "./dictionaries/it.ts";
import nl from "./dictionaries/nl.ts";
import ar from "./dictionaries/ar.ts";

const all = { en, fr, de, es, pt, it, nl, ar } as Record<string, unknown>;

/** Every string leaf, keyed by its path (arrays indexed). */
function leaves(value: unknown, path = "", out = new Map<string, string>()): Map<string, string> {
  if (typeof value === "string") out.set(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => leaves(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) leaves(v, path ? `${path}.${k}` : k, out);
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

test("every supported locale ships a dictionary", () => {
  assert.deepEqual(Object.keys(all).sort(), [...locales].sort());
});

test("every locale translates every key and keeps the same {placeholders}", () => {
  const ref = leaves(en);
  for (const locale of locales.filter((l) => l !== "en")) {
    const dict = leaves(all[locale]);
    for (const [path, text] of ref) {
      assert.ok(dict.has(path), `${locale}: missing ${path}`);
      assert.equal(placeholders(dict.get(path)!), placeholders(text), `${locale}: placeholders differ at ${path}`);
    }
  }
});

test("translated locales are not English copies", () => {
  const ref = leaves(en);
  for (const locale of locales.filter((l) => l !== "en")) {
    const dict = leaves(all[locale]);
    const long = [...ref].filter(([, text]) => text.split(" ").length >= 6);
    const same = long.filter(([path, text]) => dict.get(path) === text);
    assert.ok(same.length / long.length < 0.02, `${locale}: ${same.length} sentences left in English, e.g. ${same.slice(0, 3).map(([p]) => p).join(", ")}`);
  }
});
