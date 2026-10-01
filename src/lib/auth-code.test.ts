import { test } from "node:test";
import assert from "node:assert/strict";
import { CODE_LENGTH, generateCode, normalizeCode, normalizeEmail } from "./auth-code.ts";

test("demo codes are 6 digits, zero-padded and vary", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const c = generateCode();
    assert.match(c, /^\d{6}$/);
    seen.add(c);
  }
  assert.equal(CODE_LENGTH, 6);
  assert.ok(seen.size > 490, "codes are not predictable");
});

test("typed or pasted codes are normalised (6 to 10 digits, Supabase OTP length); anything else is rejected", () => {
  assert.equal(normalizeCode("123456"), "123456");
  assert.equal(normalizeCode(" 123 456 "), "123456");
  assert.equal(normalizeCode("123-456"), "123456");
  assert.equal(normalizeCode("12345678"), "12345678");
  assert.equal(normalizeCode("12345"), null);
  assert.equal(normalizeCode("12345678901"), null);
  assert.equal(normalizeCode("12a456"), null);
  assert.equal(normalizeCode(null), null);
});

test("email addresses are normalised", () => {
  assert.equal(normalizeEmail("  A@B.co "), "a@b.co");
});
