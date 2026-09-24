import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBody, pickLocale, forTarget, contentText } from "./content.ts";
import { personalize, variablesIn } from "./personalize.ts";
import { buildIndex, search, normalize } from "./search.ts";
import { nextBestAction, DEFAULT_RULES } from "./next-action.ts";
import { composeLanding, resolveCta, cleanAdvisor } from "./landing.ts";
import type { PageTemplateBody } from "./content.ts";

const LABELS = { firstName: "First name", company: "Company", sector: "Sector", advisorName: "Your name", affiliateUrl: "Your link", campaign: "Campaign" };
const DAY = 86_400_000;

test("validateBody accepts a well-formed objection and prunes empty optionals", () => {
  const r = validateBody("objection", {
    objection: "I already have Instagram", meaning: "Social media feels enough", questions: ["Where do requests arrive?"],
    short: "Instagram shows, STUDIO converts.", long: "…", proof: "", nextStep: "Show the page",
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal("proof" in r.body, false);
});

test("validateBody rejects missing required fields and bad values", () => {
  const r = validateBody("objection", { objection: "x" });
  assert.equal(r.ok, false);
  assert.equal(validateBody("asset", { category: "pdf", url: "javascript:alert(1)" }).ok, false);
  assert.equal(validateBody("asset", { category: "pdf", url: "//evil.example" }).ok, false);
  assert.equal(validateBody("asset", { category: "pdf", url: "https://cdn.example/sheet.pdf" }).ok, true);
});

test("page templates must allow their default CTA and include hero + cta", () => {
  const base = tpl();
  assert.equal(validateBody("page_template", base).ok, true);
  assert.equal(validateBody("page_template", { ...base, defaultCta: "buy", ctaModes: ["lead"] }).ok, false);
  assert.equal(validateBody("page_template", { ...base, sections: ["problem", "cta"] }).ok, false);
});

test("pickLocale prefers the requested locale and flags English fallbacks", () => {
  const items = [
    { kind: "message", key: "a", locale: "en" }, { kind: "message", key: "a", locale: "fr" },
    { kind: "message", key: "b", locale: "en" }, { kind: "message", key: "c", locale: "de" },
  ];
  const fr = pickLocale(items, "fr");
  assert.deepEqual(fr.map((x) => [x.key, x.locale, x.fallback]).sort(), [["a", "fr", false], ["b", "en", true]]);
  assert.equal(pickLocale(items, "en").every((x) => !x.fallback), true);
});

test("forTarget keeps generic content and puts target-specific first", () => {
  const items = [
    { id: 1, targetKey: null, sort: 0 }, { id: 2, targetKey: "garages", sort: 0 }, { id: 3, targetKey: "artisans", sort: 5 },
  ];
  assert.deepEqual(forTarget(items, "artisans").map((x) => x.id), [3, 1]);
  assert.deepEqual(forTarget(items, null).map((x) => x.id), [1]);
});

test("personalize injects only known values and never invents prospect data", () => {
  const tpl = "Hi {{firstName}}, I work with {{company}}? Link: {{affiliateUrl}} {{unknownVar}}";
  const r = personalize(tpl, { firstName: "Paul", affiliateUrl: "https://x/a/me" }, LABELS);
  assert.equal(r.text, "Hi Paul, I work with [Company]? Link: https://x/a/me {{unknownVar}}");
  assert.deepEqual(r.missing, ["company"]);
  assert.deepEqual(variablesIn(tpl).sort(), ["affiliateUrl", "company", "firstName"]);
  assert.equal(personalize("See [your link]", { affiliateUrl: "https://s/x" }, LABELS).text, "See https://s/x");
  assert.equal(personalize("See [votre lien]", {}, LABELS).text, "See [votre lien]");
});

test("search is accent/case-insensitive, needs every word, ranks titles first", () => {
  const idx = buildIndex([
    { id: "1", kind: "objection", key: "social", title: "J’ai déjà les réseaux sociaux", tags: ["instagram"], text: "…", href: "/o" },
    { id: "2", kind: "email_template", key: "e", title: "Social presence isn't enough", tags: [], text: "Réseaux sociaux ne suffisent pas", href: "/e" },
    { id: "3", kind: "playbook", key: "p", title: "Artisan", tags: [], text: "bouche-à-oreille", href: "/p" },
  ]);
  assert.deepEqual(search(idx, "reseaux sociaux").map((d) => d.id), ["1", "2"]);
  assert.deepEqual(search(idx, "INSTA").map((d) => d.id), ["1"]);
  assert.deepEqual(search(idx, "bouche oreille").map((d) => d.id), ["3"]);
  assert.deepEqual(search(idx, "réseaux artisan"), []);
  assert.deepEqual(search(idx, "a"), []);
  assert.equal(normalize("Élan  Été"), "elan ete");
});

test("contentText flattens nested bodies for the search index", () => {
  const t = contentText({ title: "T", summary: null, tags: ["x"], body: { steps: [{ title: "Open", bullets: ["ask"] }] } as never });
  assert.match(t, /Open/);
  assert.match(t, /ask/);
});

test("next best action follows the stage rules and the configured thresholds", () => {
  const now = Date.parse("2026-09-24T12:00:00Z");
  const ago = (d: number) => new Date(now - d * DAY).toISOString();
  assert.equal(nextBestAction({ stage: "new", createdAt: ago(0) }, now)?.kind, "send_first_message");
  assert.equal(nextBestAction({ stage: "contacted", createdAt: ago(9), stageChangedAt: ago(1) }, now)?.kind, "wait_reply");
  const f = nextBestAction({ stage: "contacted", createdAt: ago(9), stageChangedAt: ago(4) }, now)!;
  assert.equal(f.kind, "follow_up");
  assert.equal(f.days, 4);
  assert.equal(f.resource?.stage, "no_response");
  assert.equal(nextBestAction({ stage: "contacted", createdAt: ago(9), stageChangedAt: ago(4) }, now, { ...DEFAULT_RULES, followUpDays: 7 })?.kind, "wait_reply");
  assert.equal(nextBestAction({ stage: "appointment", createdAt: ago(5), nextActionAt: ago(1) }, now)?.kind, "send_sales_page");
  assert.equal(nextBestAction({ stage: "appointment", createdAt: ago(5), nextActionAt: ago(-2) }, now)?.kind, "prepare_appointment");
  assert.equal(nextBestAction({ stage: "checkout", createdAt: ago(5), stageChangedAt: ago(1) }, now)?.kind, "checkout_wait");
  assert.equal(nextBestAction({ stage: "checkout", createdAt: ago(5), stageChangedAt: ago(3) }, now)?.kind, "checkout_check_in");
  assert.equal(nextBestAction({ stage: "lost", createdAt: ago(5), stageChangedAt: ago(5) }, now), null);
  // The affiliate's own plan wins while it is in the future.
  assert.equal(nextBestAction({ stage: "contacted", createdAt: ago(9), stageChangedAt: ago(8), nextAction: "Call Tuesday", nextActionAt: ago(-1) }, now)?.kind, "planned");
});

test("CTA resolution never offers a purchase that cannot happen", () => {
  assert.equal(resolveCta("buy", ["buy", "lead"], "lead", true), "buy");
  assert.equal(resolveCta("buy", ["buy", "lead"], "lead", false), "lead");
  assert.equal(resolveCta("call", ["buy", "lead"], "buy", false), "lead");
  assert.equal(resolveCta("buy", ["buy"], "buy", false), "lead");
});

test("landing composition: angle > variant > template, target pains, catalog price, no invented sections", () => {
  const m = composeLanding({
    template: tpl(), variant: { template: "t", heroTitle: "Variant hero" }, angle: null,
    target: { name: "Artisans", pains: ["Lost calls"], outcomes: ["More trust"] },
    offer: { productName: "STUDIO", priceCents: 300000, currency: "EUR", interval: "year" },
    included: [], faq: [], requestedCta: "buy", canBuy: true,
  });
  assert.equal(m.hero.title, "Variant hero");
  assert.equal(m.hero.eyebrow, "Artisans");
  assert.deepEqual((m.sections.find((s) => s.type === "problem") as { points: string[] }).points, ["Lost calls"]);
  assert.deepEqual((m.sections.find((s) => s.type === "value") as { items: string[] }).items, ["More trust"]);
  assert.equal(m.sections.some((s) => s.type === "faq"), false, "no FAQ without published objections");
  assert.equal((m.sections.find((s) => s.type === "offer") as { offer: { priceCents: number } }).offer.priceCents, 300000);
  assert.equal(m.cta, "buy");
  const withAngle = composeLanding({ template: tpl(), angle: { promise: "p", heroTitle: "Angle hero", heroSubtitle: "s" }, offer: null, included: [], faq: [], requestedCta: "buy", canBuy: true });
  assert.equal(withAngle.hero.title, "Angle hero");
  assert.equal(withAngle.cta, "lead", "no offer → no buy button");
});

test("advisor block keeps professional fields only and drops unsafe values", () => {
  assert.equal(cleanAdvisor({}), null);
  const a = cleanAdvisor({ name: " Mathieu ", email: "not-an-email", photoUrl: "http://insecure/x.png", phone: "+33 6 <b>12</b>", role: "admin" })!;
  assert.equal(a.name, "Mathieu");
  assert.equal(a.email, undefined);
  assert.equal(a.photoUrl, undefined);
  assert.equal(a.phone, "+33 6 12");
  assert.equal("role" in a, false);
});

function tpl(): PageTemplateBody {
  return {
    ctaModes: ["buy", "lead", "call"], defaultCta: "lead",
    sections: ["hero", "problem", "solution", "value", "how", "benefits", "included", "who", "faq", "offer", "cta"],
    heroTitle: "Template hero", heroSubtitle: "Sub", problemTitle: "Problem", problemBody: "Body",
    solutionTitle: "Solution", solutionBody: "Body", valueTitle: "Value", valueItems: ["A"],
    howTitle: "How", howSteps: [{ title: "1", body: "b" }], benefitsTitle: "Benefits", benefits: [{ title: "B", body: "b" }],
    includedTitle: "Included", whoTitle: "Who", whoBody: "Pros", faqTitle: "FAQ", offerTitle: "Offer",
    offerNote: "Excl. VAT", ctaTitle: "Ready?", ctaBody: "Go",
  };
}

test("every seeded Sales Center item passes the admin validation", async () => {
  const { defaultSalesContent } = await import("../../content/sales-center/content.ts");
  const { KEY_PATTERN } = await import("./content.ts");
  const seen = new Set<string>();
  for (const c of defaultSalesContent) {
    const id = `${c.kind}:${c.key}:${c.locale}`;
    assert.equal(seen.has(id), false, `duplicate ${id}`);
    seen.add(id);
    assert.match(c.key, KEY_PATTERN, id);
    const r = validateBody(c.kind, c.body);
    assert.equal(r.ok, true, `${id}: ${!r.ok ? r.errors.join(", ") : ""}`);
  }
  // Every item exists in both seeded languages.
  for (const id of seen) if (id.endsWith(":en")) assert.ok(seen.has(id.replace(/:en$/, ":fr")), `missing FR for ${id}`);
});

test("seeded targets have the Sales Center fields in EN and FR", async () => {
  const { salesTargets } = await import("../../content/sales-center/targets.ts");
  for (const m of salesTargets) {
    for (const l of ["en", "fr"] as const) {
      const c = m.content[l]!;
      assert.ok(c.pains?.length && c.outcomes?.length && c.discovery?.length && c.avoid, `${m.slug}/${l}`);
    }
  }
});
