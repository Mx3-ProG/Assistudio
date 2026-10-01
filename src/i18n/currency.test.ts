import assert from "node:assert/strict";
import test from "node:test";
import { convertCurrency, isCurrency } from "./currency.ts";

test("supported display currencies are validated", () => {
  assert.equal(isCurrency("EUR"), true);
  assert.equal(isCurrency("USD"), true);
  assert.equal(isCurrency("eur"), false);
  assert.equal(isCurrency("BTC"), false);
});

test("display conversion keeps cents integral and is reversible within rounding", () => {
  assert.equal(convertCurrency(6_000_00, "EUR", "USD"), 7_020_00);
  assert.equal(convertCurrency(7_020_00, "USD", "EUR"), 6_000_00);
  assert.equal(Number.isInteger(convertCurrency(999, "EUR", "CHF")), true);
});

test("unknown source currencies fall back to the EUR catalog base", () => {
  assert.equal(convertCurrency(500_00, "unknown", "GBP"), 43_500);
});
