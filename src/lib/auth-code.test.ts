import { test } from "node:test";
import assert from "node:assert/strict";
import { CODE_LENGTH, formatCode, generateCode, hashCode, normalizeCode, normalizeEmail } from "./auth-code.ts";

test("codes are 6 digits, zero-padded and vary", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const c = generateCode();
    assert.match(c, /^\d{6}$/);
    seen.add(c);
  }
  assert.equal(CODE_LENGTH, 6);
  assert.ok(seen.size > 490, "codes are not predictable");
});

test("typed or pasted codes are normalised; anything else is rejected", () => {
  assert.equal(normalizeCode("123456"), "123456");
  assert.equal(normalizeCode(" 123 456 "), "123456");
  assert.equal(normalizeCode("123-456"), "123456");
  assert.equal(normalizeCode("12345"), null);
  assert.equal(normalizeCode("1234567"), null);
  assert.equal(normalizeCode("12a456"), null);
  assert.equal(normalizeCode(null), null);
});

test("hash is keyed, bound to the address and case-insensitive on the email", () => {
  const h = hashCode("Me@Example.com ", "123456", "s1");
  assert.equal(h, hashCode("me@example.com", "123456", "s1"));
  assert.notEqual(h, hashCode("me@example.com", "123457", "s1"));
  assert.notEqual(h, hashCode("other@example.com", "123456", "s1"));
  assert.notEqual(h, hashCode("me@example.com", "123456", "s2"));
  assert.equal(normalizeEmail("  A@B.co "), "a@b.co");
});

test("codes are shown in two groups", () => {
  assert.equal(formatCode("004217"), "004 217");
});
