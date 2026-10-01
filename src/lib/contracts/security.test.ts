import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { manifestHash, randomOtp, randomToken, safeHashEqual, sha256 } from "./security.ts";

describe("dossier evidence security", () => {
  it("generates opaque tokens and six-digit OTP values", () => {
    assert.match(randomToken(), /^[A-Za-z0-9_-]{40,}$/);
    assert.match(randomOtp(), /^\d{6}$/);
  });

  it("compares only valid SHA-256 digests", () => {
    const value = sha256("accepted");
    assert.equal(safeHashEqual(value, value), true);
    assert.equal(safeHashEqual(value, sha256("changed")), false);
    assert.equal(safeHashEqual("invalid", "invalid"), false);
  });

  it("binds documents, revision, template and locked price into the manifest", () => {
    const base = { dossierId: "d1", revision: 1, briefHash: sha256("brief"), quoteHash: sha256("quote"), locale: "fr", templateId: "t1", templateVersion: 2, offerSnapshot: { totalCents: 300000 } };
    const first = manifestHash(base);
    assert.equal(first, manifestHash(base));
    assert.notEqual(first, manifestHash({ ...base, revision: 2 }));
    assert.notEqual(first, manifestHash({ ...base, offerSnapshot: { totalCents: 300001 } }));
  });
});
