import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("pricing waits for a request before loading database-backed offers", async () => {
  const source = await readFile(
    path.join(process.cwd(), "src/app/[locale]/(marketing)/pricing/page.tsx"),
    "utf8",
  );

  assert.match(source, /export const dynamic = ["']force-dynamic["'];/);
});
