import { test } from "node:test";
import assert from "node:assert/strict";
import { renderEmail } from "./templates.ts";
import { TEMPLATE_IDS, copyFor } from "./copy.ts";
import { locales } from "../../i18n/config.ts";

const opts = { locale: "en", appUrl: "https://studio.test" };
const sale = { sale_ref: "SAL-ABC123", gross_cents: 300_000, commission_cents: 150_000, currency: "EUR", available_on: "2026-10-24" };

test("every template renders in every supported email locale, with a text alternative", () => {
  for (const id of TEMPLATE_IDS) {
    for (const locale of locales) {
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


test("every locale has its own copy for every template (no silent English fallback)", () => {
  const en = copyFor("en");
  for (const locale of locales.filter((l) => l !== "en")) {
    const c = copyFor(locale);
    assert.notEqual(c.common.signature, en.common.signature, `${locale} signature`);
    for (const id of TEMPLATE_IDS) assert.notEqual(c.templates[id].subject, en.templates[id].subject, `${id}/${locale} subject is still English`);
  }
});

test("sign-in code email shows the code and a warning in the recipient's language", () => {
  const r = renderEmail("auth.login_code", { code: "123 456" }, { ...opts, locale: "de" });
  assert.match(r.subject, /123 456/);
  assert.match(r.html, /123 456/);
  assert.match(r.text, /niemals/);
});
