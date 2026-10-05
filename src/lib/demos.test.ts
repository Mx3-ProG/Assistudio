import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { studioDemos, studioDemoTiers } from "./demos.ts";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function filesUnder(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(path, entry.name);
    return entry.isDirectory() ? filesUnder(entryPath) : [entryPath];
  });
}

test("every Studio offer has usable demos", () => {
  for (const tier of studioDemoTiers) {
    const demos = studioDemos.filter((demo) => demo.tier === tier);
    assert.ok(demos.length > 0, `missing demos for ${tier}`);
    assert.ok(demos.every((demo) => demo.href.startsWith("/demo-sites/")));
  }
});

test("demo slugs and destinations are unique", () => {
  assert.equal(new Set(studioDemos.map((demo) => demo.slug)).size, studioDemos.length);
  assert.equal(new Set(studioDemos.map((demo) => demo.href)).size, studioDemos.length);
});

test("every Pro demo exposes its native admin dashboard", () => {
  const proDemos = studioDemos.filter((demo) => demo.tier === "pro");
  assert.ok(proDemos.length > 0);
  assert.ok(proDemos.every((demo) => demo.adminHref?.startsWith("/demo-sites/")));
});

test("Premium demos open their real application entry points", () => {
  const premiumDemos = studioDemos.filter((demo) => demo.tier === "premium");
  assert.deepEqual(
    premiumDemos.map((demo) => demo.slug),
    ["cadence-mada", "customer-mada", "mada-supply"],
  );
  assert.deepEqual(
    premiumDemos.map((demo) => demo.href),
    [
      "/demo-sites/cadence-mada/index.html#/fr/dashboard",
      "/demo-sites/customer-mada/index.html#/dashboard",
      "/demo-sites/mada-supply/index.html#/",
    ],
  );
});

test("Premium demo builds are self-contained and contain no live credentials", () => {
  const premiumDemos = studioDemos.filter((demo) => demo.tier === "premium");

  for (const demo of premiumDemos) {
    const demoRoot = join(projectRoot, "public", "demo-sites", demo.slug);
    const indexPath = join(demoRoot, "index.html");
    assert.ok(existsSync(indexPath), `missing entry point for ${demo.slug}`);

    const indexHtml = readFileSync(indexPath, "utf8");
    const assetPaths = [
      ...indexHtml.matchAll(/(?:src|href)="(?:\.\/|\/demo-sites\/[^/]+\/)(assets\/[^"]+)"/g),
    ].map(
      ([, assetPath]) => join(demoRoot, assetPath),
    );
    assert.ok(assetPaths.length >= 2, `missing JS or CSS assets for ${demo.slug}`);
    assert.ok(assetPaths.every(existsSync), `broken asset reference for ${demo.slug}`);

    const builtSource = filesUnder(demoRoot)
      .filter((path) => /\.(?:html|js|css)$/.test(path))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    assert.doesNotMatch(builtSource, /https:\/\/[a-z0-9-]+\.supabase\.co/i);
    assert.doesNotMatch(builtSource, /\b(?:sk|pk)_live_[A-Za-z0-9]+\b/);
    assert.doesNotMatch(builtSource, /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/);
  }
});
