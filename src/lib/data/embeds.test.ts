import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// affiliates has two foreign keys to profiles (profile_id, approved_by): PostgREST
// refuses an unhinted embed ("more than one relationship was found") and the page
// crashes. Every affiliate → profile embed must name affiliates_profile_id_fkey.
const files = [
  join(import.meta.dirname, "supabase.ts"),
  ...readdirSync(join(import.meta.dirname, "../services")).filter((f) => f.endsWith(".ts")).map((f) => join(import.meta.dirname, "../services", f)),
];

test("ambiguous affiliate embeds (profiles, commissions) name their foreign key", () => {
  const offenders: string[] = [];
  for (const file of files) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (line.includes("audit_logs")) return; // single relationship to profiles
      const nested = /affiliates\([^)]*\bprofiles\(/.test(line);
      const direct = /from\("affiliates"\)\.select\("[^"]*\bprofiles\(/.test(line);
      // commissions → affiliates is ambiguous too (affiliate_id, source_affiliate_id).
      const commissionSide = /from\("affiliates"\)\.select\("[^"]*\bcommissions\(/.test(line)
        || ((/from\("commissions"\)/.test(line) || /COMMISSION_COLS = /.test(line)) && /\baffiliates\(/.test(line));
      if (nested || direct || commissionSide) offenders.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});
