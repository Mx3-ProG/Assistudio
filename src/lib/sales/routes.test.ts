import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const app = join(process.cwd(), "src/app/[locale]");

const affiliatePages = [
  "dashboard",
  "dashboard/messages",
  "dashboard/prospects",
  "dashboard/link",
  "dashboard/promo-codes",
  "dashboard/documents",
  "dashboard/sales",
  "dashboard/commissions",
  "dashboard/recurring",
  "dashboard/payouts",
  "dashboard/analytics",
  "dashboard/referrals",
  "dashboard/leaderboard",
  "dashboard/notifications",
  "dashboard/settings",
  // Secondary destinations linked from the overview or Sales Center toolbox.
  "dashboard/find",
  "dashboard/campaigns",
  "dashboard/product",
  "dashboard/sales-kit",
  "dashboard/welcome",
  "dashboard/prospects/start",
  "dashboard/payouts/settings",
] as const;

const salesCenterPages = [
  "dashboard/sales-center",
  "dashboard/sales-center/start",
  "dashboard/sales-center/targets",
  "dashboard/sales-center/playbooks",
  "dashboard/sales-center/messages",
  "dashboard/sales-center/emails",
  "dashboard/sales-center/calls",
  "dashboard/sales-center/objections",
  "dashboard/sales-center/product",
  "dashboard/sales-center/facts",
  "dashboard/sales-center/signals",
  "dashboard/sales-center/assets",
  "dashboard/sales-center/pages",
  "dashboard/sales-center/performance",
  "dashboard/sales-center/favorites",
  "dashboard/sales-center/first-week",
  "dashboard/sales-center/follow-ups",
  "dashboard/sales-center/pitch",
  "dashboard/sales-center/sector",
] as const;

test("every affiliate navigation destination has a page", () => {
  for (const route of affiliatePages) {
    assert.ok(existsSync(join(app, route, "page.tsx")), `missing /${route}`);
  }
});

test("every Sales Center destination has a page", () => {
  for (const route of salesCenterPages) {
    assert.ok(existsSync(join(app, route, "page.tsx")), `missing /${route}`);
  }
  assert.ok(existsSync(join(app, "dashboard/sales-center/calls/[key]/page.tsx")), "missing call detail route");
  assert.ok(existsSync(join(app, "dashboard/sales-center/playbooks/[key]/page.tsx")), "missing playbook detail route");
  assert.ok(existsSync(join(app, "dashboard/sales-center/targets/[target]/page.tsx")), "missing target detail route");
});

test("public affiliate pages have both personalized and legacy entry points", () => {
  assert.ok(existsSync(join(app, "a/[affiliate]/[[...target]]/page.tsx")));
  assert.ok(existsSync(join(app, "p/[slug]/page.tsx")));
});
