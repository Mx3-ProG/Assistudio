import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseTransport, orDefault, DEFAULT_EMAIL_FROM } from "./transport.ts";

test("production without an API key never pretends to send", () => {
  assert.equal(chooseTransport(true, true), "resend");
  assert.equal(chooseTransport(true, false), "resend");
  assert.equal(chooseTransport(false, false), "log");
  assert.equal(chooseTransport(false, true), "missing");
});

test("sender defaults to contact@atonservice.org; env values win when set", () => {
  assert.match(DEFAULT_EMAIL_FROM, /<contact@atonservice\.org>$/);
  assert.equal(orDefault(undefined, DEFAULT_EMAIL_FROM), DEFAULT_EMAIL_FROM);
  assert.equal(orDefault("  ", DEFAULT_EMAIL_FROM), DEFAULT_EMAIL_FROM);
  assert.equal(orDefault("X <x@y.z>", DEFAULT_EMAIL_FROM), "X <x@y.z>");
});
