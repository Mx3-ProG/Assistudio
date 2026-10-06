import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canSetDisplay, displayName, isEventSourceValid, isMediaInFolder, isPortrait, mediaFolder, mediaKindAccepts, mediaPath,
  nextStatuses, proofErrorCode, reviewMoment, simulateFlow, toMonth, toPublicTestimonial, verifiedBasis, type PublicTestimonial,
} from "./proof.ts";

const HEX = "0123456789abcdef0123456789abcdef";
const PROFILE = "00000000-0000-0000-0000-0000000b0002";

test("names: shown as the author allowed, staff can only reduce", () => {
  assert.equal(displayName("  Lucia  Rossi ", "full"), "Lucia Rossi");
  assert.equal(displayName("Lucia Rossi", "first_name"), "Lucia");
  assert.equal(displayName("Lucia Rossi", "initials"), "L. R.");
  assert.ok(canSetDisplay("full", "first_name"));
  assert.ok(canSetDisplay("first_name", "initials"));
  assert.ok(!canSetDisplay("first_name", "full"), "never more than the author allowed");
  assert.ok(!canSetDisplay("initials", "first_name"));
});

test("media: only the author's folder, only accepted types", () => {
  const folder = mediaFolder({ profileId: PROFILE });
  assert.equal(folder, `a/${PROFILE}`);
  assert.equal(mediaFolder({ inviteId: PROFILE }), `c/${PROFILE.replaceAll("-", "")}`);
  assert.equal(mediaPath(folder, HEX, "video/webm;codecs=vp9"), `${folder}/${HEX}.webm`);
  assert.throws(() => mediaPath(folder, HEX, "application/pdf"));
  assert.throws(() => mediaPath("a/../etc", HEX, "video/mp4"));
  assert.throws(() => mediaPath(folder, "not-hex", "video/mp4"));
  assert.ok(isMediaInFolder(`${folder}/${HEX}.mp4`, folder, "video"));
  assert.ok(!isMediaInFolder(`${folder}/${HEX}.jpg`, folder, "video"), "an image is not a video");
  assert.ok(!isMediaInFolder(`a/other/${HEX}.mp4`, folder, "video"), "someone else's folder");
  assert.ok(isMediaInFolder(null, folder, "photo"), "no media is fine");
  assert.ok(mediaKindAccepts("video", "video/quicktime"));
  assert.ok(!mediaKindAccepts("photo", "video/mp4"));
});

test("moderation: no republication after consent withdrawal", () => {
  assert.deepEqual(nextStatuses("pending", false), ["approved", "rejected", "hidden"]);
  assert.deepEqual(nextStatuses("hidden", true), ["rejected"]);
  assert.ok(!nextStatuses("approved", false).includes("approved"));
});

test("verified badge: only from the account, never typed", () => {
  assert.equal(verifiedBasis({ type: "ambassador", affiliateApproved: true }), "approved_partner");
  assert.equal(verifiedBasis({ type: "ambassador", affiliateApproved: false }), null);
  assert.equal(verifiedBasis({ type: "client", hasPaidSale: true }), "paying_customer");
  assert.equal(verifiedBasis({ type: "client", hasPaidSale: false }), null);
});

test("proof events: a real source that is still valid", () => {
  assert.ok(isEventSourceValid("commission_paid", { status: "paid" }));
  assert.ok(!isEventSourceValid("commission_paid", { status: "failed" }));
  assert.ok(!isEventSourceValid("new_client", { status: "refunded" }));
  assert.ok(!isEventSourceValid("testimonial_published", { status: "approved", consentWithdrawn: true }));
  assert.ok(!isEventSourceValid("commission_paid", null));
  assert.equal(toMonth("2026-10-05T12:00:00Z"), "2026-10-01");
});

test("public testimonial: private fields never leave the server", () => {
  const row = {
    id: "t1", type: "client", displayName: "Lucia", companyName: "Atelier", profession: null, activity: null, rating: 5,
    content: "Great", recommendation: null, locale: "fr", mediaType: "text", video: null, hasPoster: false, hasPhoto: false,
    hasLogo: false, service: null, caseStudyKey: null, verified: true, featured: false, publishedOn: "2026-10-05", proofType: "real",
    // must be dropped
    email: "lucia@example.com", authorName: "Lucia Rossi", profileId: PROFILE, videoPath: "a/x.mp4", consentText: "…",
  } as unknown as PublicTestimonial & Record<string, unknown>;
  const pub = toPublicTestimonial(row) as unknown as Record<string, unknown>;
  for (const k of ["email", "authorName", "profileId", "videoPath", "consentText"]) assert.ok(!(k in pub), `${k} dropped`);
  assert.equal(pub.displayName, "Lucia");
});

test("simulation: computed from the real offer, typed demo", () => {
  const sim = simulateFlow({ priceCents: 600_000, commissionRate: 0.25 });
  assert.equal(sim.proofType, "demo");
  assert.equal(sim.commissionCents, 150_000);
  assert.equal(sim.steps.length, 7);
  assert.equal(sim.steps.at(-1)!.amountCents, 150_000);
  assert.equal(sim.steps[0].amountCents, null, "sharing a contact earns nothing by itself");
});

test("review moments and helpers", () => {
  assert.equal(reviewMoment({ sales: 0, commissions: 0, payoutsPaid: 0 }), null);
  assert.equal(reviewMoment({ sales: 1, commissions: 0, payoutsPaid: 0 }), "first_sale");
  assert.equal(reviewMoment({ sales: 1, commissions: 1, payoutsPaid: 1 }), "first_payout");
  assert.ok(isPortrait({ width: 1080, height: 1920 }));
  assert.ok(!isPortrait({ width: 1920, height: 1080 }));
  assert.equal(proofErrorCode("ERROR: proof.already_pending"), "already_pending");
  assert.equal(proofErrorCode("boom"), "generic");
});
