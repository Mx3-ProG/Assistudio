import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELD_PROOF, publicFieldProof, type FieldProof } from "./field-proof.ts";

const base: FieldProof = {
  slug: "x", name: "X", sector: { en: "s", fr: "s" }, problem: { en: "p", fr: "p" }, solution: { en: "s", fr: "s" },
  features: { en: [], fr: [] }, consent: null,
};

test("a reference without a recorded agreement is never public", () => {
  assert.deepEqual(publicFieldProof([base]), []);
  assert.deepEqual(publicFieldProof([{ ...base, consent: { verifiedAt: "soon", by: "x" } }]), []);
  assert.deepEqual(publicFieldProof([{ ...base, consent: { verifiedAt: "2026-10-03", by: " " } }]), []);
  assert.equal(publicFieldProof([{ ...base, consent: { verifiedAt: "2026-10-03", by: "Studio" } }]).length, 1);
});

test("every shipped reference has a recorded agreement", () => {
  assert.equal(publicFieldProof(FIELD_PROOF).length, FIELD_PROOF.length);
});
