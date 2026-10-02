import { test } from "node:test";
import assert from "node:assert/strict";
import { renderEmail } from "./templates.ts";
import { TEMPLATE_IDS } from "./copy.ts";

const opts = { locale: "en", appUrl: "https://studio.test" };
const sale = { sale_ref: "SAL-ABC123", gross_cents: 300_000, commission_cents: 150_000, currency: "EUR", available_on: "2026-10-24" };

test("every template renders in every supported email locale, with a text alternative", () => {
  for (const id of TEMPLATE_IDS) {
    for (const locale of ["en", "fr", "de", "ar"]) {
      const r = renderEmail(id, sale, { ...opts, locale });
      assert.ok(r.subject.length > 3, `${id}/${locale} subject`);
      assert.ok(r.html.includes("<html"), `${id}/${locale} html`);
      assert.ok(r.text.includes("Studio ATS"), `${id}/${locale} text`);
      assert.ok(!/\{\w+\}/.test(r.subject + r.text), `${id}/${locale} has no unfilled placeholder`);
    }
  }
});

test("sale detected: says pending, never earned; shows amounts formatted", () => {
  const r = renderEmail("affiliate.sale_detected", sale, opts);
  assert.match(r.subject, /€1,500 commission pending/);
  assert.match(r.text, /status: pending/);
  assert.doesNotMatch(r.text, /earned|acquired\b(?!:)/i);
  assert.match(r.text, /not yet acquired/);
  const fr = renderEmail("affiliate.sale_detected", sale, { ...opts, locale: "fr" });
  assert.match(fr.text, /en attente/);
  assert.match(fr.text, /1\s500\s€/);
});

test("user-provided values are HTML-escaped", () => {
  const r = renderEmail("affiliate.new_lead", { company: `<img src=x onerror=alert(1)>` }, opts);
  assert.ok(!r.html.includes("<img src=x"));
  assert.ok(r.html.includes("&lt;img"));
});

test("links point to the locale-prefixed dashboard", () => {
  const r = renderEmail("affiliate.commission_available", { commission_cents: 150_000 }, { ...opts, locale: "fr" });
  assert.ok(r.html.includes("https://studio.test/fr/dashboard/payouts"));
});

test("RTL locale sets dir=rtl", () => {
  assert.ok(renderEmail("affiliate.welcome", { code: "X" }, { ...opts, locale: "ar" }).html.includes('dir="rtl"'));
});


test("staff help request: full context, labels, escaped multi-line message, admin link", () => {
  const params = {
    ref: "HLP-ABC123", category: "prospect", urgency: "high", subject: "Closing help", message: "Line one\n<b>Line two</b>",
    affiliate_name: "Ana", affiliate_email: "ana@test.invalid", code: "ANA123", affiliate_status: "approved", sponsor: "Bob",
    recruits: 2, prospects: 9, leads: 1, paid_sales: 3, open_dossiers: 1, related: "Prospect: Rossi · interested",
    revenue_cents: 1_800_000, available_cents: 45_000, paid_cents: 90_000, pending_cents: 150_000, page: "/fr/dashboard", admin_path: "/admin/network/aff_1",
  };
  const fr = renderEmail("staff.help_request", params, { ...opts, locale: "fr" });
  assert.match(fr.subject, /^\[Urgent\] Demande d’aide HLP-ABC123 — Ana : Closing help$/);
  assert.match(fr.text, /Sujet : Prospect/);
  assert.match(fr.text, /En validation \(pas encore acquises\) : 1\s500\s€/);
  assert.ok(fr.html.includes("Line one<br>&lt;b&gt;Line two"));
  assert.ok(fr.html.includes("https://studio.test/fr/admin/network/aff_1"));
  const noRelated = renderEmail("staff.help_request", { ...params, related: "" }, opts);
  assert.equal(noRelated.text.includes("Prospect: Rossi"), false);
  assert.match(noRelated.text, /Commissions available \(owed\): €450/);
});
