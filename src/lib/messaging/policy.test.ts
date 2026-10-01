import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attachmentPath, canEdit, canMessage, checkAttachment, isValidAttachmentPath, kindForMime, messagingErrorCode,
  type Party,
} from "./policy.ts";

const aff = (id: string, approved = true): Party => ({ id, staff: false, approvedAffiliate: approved });
const admin: Party = { id: "admin", staff: true, approvedAffiliate: false };

test("sponsor and recruit talk automatically; strangers do not", () => {
  assert.equal(canMessage(aff("s"), aff("r"), { blocked: false, relationship: "recruit" }), true);
  assert.equal(canMessage(aff("r"), aff("s"), { blocked: false, relationship: "sponsor" }), true);
  assert.equal(canMessage(aff("a"), aff("b"), { blocked: false, relationship: null }), false);
});

test("an accepted friendship opens messaging; a block cancels any link", () => {
  assert.equal(canMessage(aff("a"), aff("b"), { blocked: false, relationship: "friend" }), true);
  assert.equal(canMessage(aff("a"), aff("b"), { blocked: true, relationship: "friend" }), false);
  assert.equal(canMessage(aff("s"), aff("r"), { blocked: true, relationship: "recruit" }), false);
});

test("staff talk to anyone, even pending affiliates; nobody talks to themselves", () => {
  assert.equal(canMessage(aff("p", false), admin, { blocked: false, relationship: null }), true);
  assert.equal(canMessage(admin, aff("p", false), { blocked: true, relationship: null }), true);
  assert.equal(canMessage(admin, admin, { blocked: false, relationship: null }), false);
});

test("non-approved affiliates have no direct messages with other affiliates", () => {
  assert.equal(canMessage(aff("p", false), aff("s"), { blocked: false, relationship: "sponsor" }), false);
});

test("attachments are typed by MIME and capped by kind", () => {
  assert.equal(kindForMime("audio/webm;codecs=opus"), "audio");
  assert.equal(kindForMime("application/x-msdownload"), null);
  assert.deepEqual(checkAttachment({ mime: "image/png", size: 1000 }), { ok: true, kind: "image" });
  assert.deepEqual(checkAttachment({ mime: "image/png", size: 11 * 1024 * 1024 }), { ok: false, error: "too_large" });
  assert.deepEqual(checkAttachment({ mime: "audio/webm", size: 1000, durationMs: 6 * 60_000 }), { ok: false, error: "too_long" });
  assert.deepEqual(checkAttachment({ mime: "text/html", size: 10 }), { ok: false, error: "unsupported" });
});

test("attachment paths are confined to the sender's folder in the conversation", () => {
  const conv = "11111111-1111-1111-1111-111111111111";
  const me = "22222222-2222-2222-2222-222222222222";
  const p = attachmentPath(conv, me, "abc_123", "audio/webm;codecs=opus");
  assert.equal(p, `${conv}/${me}/abc_123.webm`);
  assert.equal(isValidAttachmentPath(p, conv, me), true);
  assert.equal(isValidAttachmentPath(`${conv}/${me}/../x.png`, conv, me), false);
  assert.equal(isValidAttachmentPath(`${conv}/someone-else/x.png`, conv, me), false);
  assert.throws(() => attachmentPath(conv, me, "../evil", "image/png"));
});

test("only the author edits their own text message within 15 minutes", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  const msg = { senderId: "me", kind: "text" as const, createdAt: "2026-10-01T11:50:00Z", deletedAt: null };
  assert.equal(canEdit(msg, "me", now), true);
  assert.equal(canEdit(msg, "other", now), false);
  assert.equal(canEdit({ ...msg, createdAt: "2026-10-01T11:40:00Z" }, "me", now), false);
  assert.equal(canEdit({ ...msg, kind: "audio" }, "me", now), false);
});

test("SQL error codes are recognised", () => {
  assert.equal(messagingErrorCode("messaging.rate_limited"), "rate_limited");
  assert.equal(messagingErrorCode("permission denied"), null);
});
