import assert from "node:assert/strict";
import test from "node:test";
import { legalDocuments } from "./legal.ts";

test("every legal page is versioned, substantial and has unique anchors", () => {
  assert.equal(Object.keys(legalDocuments).length, 5);
  for (const document of Object.values(legalDocuments)) {
    assert.match(document.version, /^\d+\.\d+$/);
    assert.ok(document.updatedAt.length > 8);
    assert.ok(document.sections.length >= 6);
    assert.equal(new Set(document.sections.map((section) => section.id)).size, document.sections.length);
  }
});

test("published legal identity matches the supplied Kbis", () => {
  const text = JSON.stringify(legalDocuments);
  for (const expected of ["Wayne-web", "108 884 032", "3 allée du Dr Lejzer Ludwik", "50,00 euros"]) {
    assert.match(text, new RegExp(expected));
  }
});

test("affiliate terms cover the core commission and independence safeguards", () => {
  const text = JSON.stringify(legalDocuments.affiliateTerms);
  for (const expected of [
    "absence de mandat",
    "ne peut ni négocier",
    "Paiement éligible",
    "Remboursements, rétrofacturations",
    "Données personnelles et prospects",
    "Fraudes et pratiques interdites",
  ]) assert.ok(text.includes(expected), `missing: ${expected}`);
});

