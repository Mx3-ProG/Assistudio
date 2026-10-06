/* eslint-disable @typescript-eslint/no-explicit-any -- rows are untyped until `supabase gen types` is wired in */
import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { sha256 } from "@/lib/contracts/security";
import { isStaff } from "@/lib/auth";
import {
  PROOF_LIMITS, mediaFolder, mediaKindAccepts, mediaPath, toMonth,
  type AdminProofEvent, type AdminTestimonial, type MediaKind, type ProofEventCandidate, type PublicProofEvent,
  type PublicTestimonial, type TestimonialInput, type TestimonialInvite,
} from "@/lib/proof";
import type { ProofRepo } from "./repo";

/**
 * Social proof on Supabase. Partners write through SECURITY DEFINER functions
 * (their own client, RLS); clients through the invite functions (service
 * role, token hashed here); visitors read the whitelisted public functions.
 * Media: private bucket, uploads through signed URLs, reads through short
 * signed URLs issued by /api/proof-media after a status check.
 */
const BUCKET = "testimonial-media";
const SIGNED_URL_TTL = 5 * 60;

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? String(res.error));
  return res.data;
}

const MEDIA_COL: Record<MediaKind, string> = { video: "video_path", poster: "poster_path", photo: "photo_path", logo: "logo_path" };

const toPublic = (r: any): PublicTestimonial => ({
  id: r.id, type: r.testimonial_type, displayName: r.display_name ?? "", companyName: r.company_name ?? null,
  profession: r.profession ?? null, activity: r.activity ?? null, rating: r.rating ?? null, content: r.content,
  recommendation: r.recommendation ?? null, locale: r.locale, mediaType: r.media_type,
  video: r.media_type === "video" ? { width: r.video_width ?? null, height: r.video_height ?? null, durationMs: r.video_duration_ms ?? null } : null,
  hasPoster: !!r.has_poster, hasPhoto: !!r.has_photo, hasLogo: !!r.has_logo, service: r.service ?? null,
  caseStudyKey: r.case_study_key ?? null, verified: !!r.verified, featured: !!r.featured, publishedOn: String(r.published_on), proofType: "real",
});

const ADMIN_COLS = "*, profiles!testimonials_profile_id_fkey(email), customers(public_ref)";
const toAdmin = (r: any): AdminTestimonial => ({
  id: r.id, ref: r.public_ref, status: r.status, rating: r.rating ?? null, content: r.content, mediaType: r.media_type,
  verified: !!r.verified, consentWithdrawn: !!r.consent_withdrawn_at, placements: r.placements ?? [], createdAt: r.created_at,
  type: r.testimonial_type, authorName: r.author_name, authorDisplay: r.author_display, displayMode: r.display_mode,
  authorAccount: r.profiles?.email ?? r.customers?.public_ref ?? null,
  companyName: r.company_name ?? null, profession: r.profession ?? null, activity: r.activity ?? null,
  recommendation: r.recommendation ?? null, locale: r.locale,
  video: r.video_path ? { width: r.video_width ?? null, height: r.video_height ?? null, durationMs: r.video_duration_ms ?? null } : null,
  hasPoster: !!r.poster_path, hasPhoto: !!r.photo_path, hasLogo: !!r.logo_path, verifiedBasis: r.verified_basis ?? null,
  consentAt: r.consent_at, consentVersion: r.consent_version, consentText: r.consent_text, service: r.service ?? null,
  caseStudyKey: r.case_study_key ?? null, showCompany: !!r.show_company, featured: !!r.featured, sort: r.sort ?? 0,
  reviewNote: r.review_note ?? null, reviewedAt: r.reviewed_at ?? null,
});

/** The form, in the jsonb shape public.proof_insert_testimonial() reads. */
const toPayload = (i: TestimonialInput) => ({
  author_name: i.authorName, author_display: i.authorDisplay, profession: i.profession, company_name: i.companyName,
  activity: i.activity, rating: i.rating, content: i.content, recommendation: i.recommendation, locale: i.locale,
  consent: i.consent, consent_version: i.consentVersion, consent_text: i.consentText,
  video_path: i.video?.path ?? null, video_mime: i.video?.mime ?? null, video_width: i.video?.width ?? null,
  video_height: i.video?.height ?? null, video_duration_ms: i.video?.durationMs ?? null,
  poster_path: i.posterPath, photo_path: i.photoPath, logo_path: i.logoPath,
});

async function signedUpload(folder: string, kind: MediaKind, mime: string) {
  if (!mediaKindAccepts(kind, mime)) throw new Error("proof.invalid_media");
  const path = mediaPath(folder, randomUUID().replaceAll("-", ""), mime);
  const data = check(await supabaseService().storage.from(BUCKET).createSignedUploadUrl(path)) as { signedUrl: string };
  return { path, uploadUrl: data.signedUrl };
}

async function sign(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseService().storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

async function openInvite(token: string) {
  const rows = check(await supabaseService().rpc("testimonial_invite_lookup", { p_token_hash: sha256(token) })) as any[];
  const r = rows?.[0];
  if (!r || r.state !== "open") throw new Error("proof.invite_invalid");
  return r as { invite_id: string };
}

export const supabaseProof: ProofRepo = {
  async listPublicTestimonials({ placement, type, limit }) {
    const sb = supabaseService();
    const rows = check(await sb.rpc("public_testimonials", { p_placement: placement ?? null, p_type: type ?? null, p_limit: limit ?? 12 })) as any[];
    return (rows ?? []).map(toPublic);
  },

  async listPublicProofEvents(limit = 6) {
    const rows = check(await supabaseService().rpc("public_proof_events", { p_limit: limit })) as any[];
    return (rows ?? []).map((r): PublicProofEvent => ({
      id: r.id, type: r.type, label: r.label, valueCents: r.value_cents == null ? null : Number(r.value_cents),
      currency: r.currency ?? null, month: toMonth(String(r.occurred_month)), verified: true, proofType: "real",
    }));
  },

  async resolveProofMedia(viewer, id, kind) {
    const col = MEDIA_COL[kind];
    const pub = check(await supabaseService().rpc("public_testimonial_media", { p_id: id, p_kind: kind })) as any[];
    if (pub?.[0]?.path) return sign(pub[0].path);
    if (!viewer) return null;
    // Before moderation: staff, or the author through RLS.
    const sb = isStaff(viewer) ? supabaseService() : await supabaseServer();
    const { data } = await sb.from("testimonials").select(col).eq("id", id).maybeSingle();
    return sign((data as any)?.[col]);
  },

  async createProofUpload(s, kind, mime) {
    if (!s.affiliate) throw new Error("proof.not_allowed");
    return signedUpload(mediaFolder({ profileId: s.userId }), kind, mime);
  },

  async submitAmbassadorTestimonial(_s, input) {
    const sb = await supabaseServer();
    const rows = check(await sb.rpc("submit_ambassador_testimonial", { p: toPayload(input) })) as any[];
    return { id: rows[0].id, ref: rows[0].ref };
  },

  async listMyTestimonials(s) {
    const sb = await supabaseServer();
    const rows = check(await sb.from("testimonials")
      .select("id, public_ref, status, rating, content, media_type, verified, consent_withdrawn_at, placements, created_at")
      .eq("profile_id", s.userId).order("created_at", { ascending: false })) as any[];
    return rows.map((r) => ({
      id: r.id, ref: r.public_ref, status: r.status, rating: r.rating ?? null, content: r.content, mediaType: r.media_type,
      verified: !!r.verified, consentWithdrawn: !!r.consent_withdrawn_at, placements: r.placements ?? [], createdAt: r.created_at,
    }));
  },

  async withdrawTestimonial(_s, id) {
    const sb = await supabaseServer();
    check(await sb.rpc("withdraw_testimonial", { p_id: id }));
  },

  async lookupTestimonialInvite(token) {
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null;
    const rows = check(await supabaseService().rpc("testimonial_invite_lookup", { p_token_hash: sha256(token) })) as any[];
    const r = rows?.[0];
    return r ? { state: r.state, companyName: r.company_name ?? null, contactName: r.contact_name ?? null, locale: r.locale } : null;
  },

  async createInviteUpload(token, kind, mime) {
    const r = await openInvite(token);
    return signedUpload(mediaFolder({ inviteId: r.invite_id }), kind, mime);
  },

  async submitClientTestimonial(token, input) {
    const rows = check(await supabaseService().rpc("submit_client_testimonial", { p_token_hash: sha256(token), p: toPayload(input) })) as any[];
    return { id: rows[0].id, ref: rows[0].ref };
  },

  async adminListTestimonials(_s, status) {
    const sb = await supabaseServer();
    let q = sb.from("testimonials").select(ADMIN_COLS).order("created_at", { ascending: false }).limit(200);
    if (status?.length) q = q.in("status", status);
    return (check(await q) as any[]).map(toAdmin);
  },

  async adminReviewTestimonial(_s, id, status, note) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_review_testimonial", { p_id: id, p_status: status, p_note: note }));
  },

  async adminUpdateTestimonialPresentation(_s, id, i) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_update_testimonial_presentation", {
      p_id: id,
      p: {
        placements: i.placements, display_mode: i.displayMode, service: i.service, case_study_key: i.caseStudyKey,
        show_company: i.showCompany, featured: i.featured, sort: i.sort,
      },
    }));
  },

  async adminRemoveTestimonialMedia(_s, id, kind, reason) {
    const sb = await supabaseServer();
    // A video takes its poster with it.
    const paths = (check(await sb.rpc("staff_remove_testimonial_media", { p_id: id, p_kind: kind, p_reason: reason })) ?? []) as string[];
    if (paths.length) await supabaseService().storage.from(BUCKET).remove(paths);
  },

  async adminListTestimonialInvites() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("testimonial_invites").select("*, customers(public_ref, company_name)")
      .order("created_at", { ascending: false }).limit(100)) as any[];
    const now = Date.now();
    return rows.map((r): TestimonialInvite => ({
      id: r.id, customerRef: r.customers?.public_ref ?? "", companyName: r.customers?.company_name ?? null,
      state: r.revoked_at ? "revoked" : r.used_at ? "used" : new Date(r.expires_at).getTime() <= now ? "expired" : "open",
      expiresAt: r.expires_at, createdAt: r.created_at, note: r.note ?? null,
    }));
  },

  async adminListInviteCandidates() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("sales").select("paid_at, customers(id, public_ref, company_name, contact_name), offers(name)")
      .eq("status", "paid").order("paid_at", { ascending: false }).limit(300)) as any[];
    const seen = new Set<string>();
    return rows.filter((r) => r.customers && !seen.has(r.customers.id) && seen.add(r.customers.id)).map((r) => ({
      customerId: r.customers.id, customerRef: r.customers.public_ref, companyName: r.customers.company_name ?? null,
      contactName: r.customers.contact_name ?? null, offer: r.offers?.name ?? "Studio ATS", paidAt: r.paid_at,
    }));
  },

  async adminCreateTestimonialInvite(_s, customerId, locale, note) {
    const token = randomBytes(32).toString("base64url");
    const sb = await supabaseServer();
    check(await sb.rpc("staff_create_testimonial_invite", {
      p_customer: customerId, p_token_hash: sha256(token), p_days: PROOF_LIMITS.inviteDays, p_locale: locale, p_note: note,
    }));
    return { token, expiresAt: new Date(Date.now() + PROOF_LIMITS.inviteDays * 86_400_000).toISOString() };
  },

  async adminRevokeTestimonialInvite(_s, id) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_revoke_testimonial_invite", { p_id: id }));
  },

  async adminListProofEvents() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("social_proof_events").select("*").order("occurred_at", { ascending: false }).limit(100)) as any[];
    const valid = await Promise.all(rows.map((r) => sb.rpc("proof_event_source_valid", { p_type: r.type, p_source: r.source_id })));
    return rows.map((r, i): AdminProofEvent => ({
      id: r.id, type: r.type, label: r.anonymized_label, valueCents: r.value_cents == null ? null : Number(r.value_cents),
      currency: r.currency ?? null, occurredAt: r.occurred_at, verified: !!r.verified, published: !!r.published,
      sourceValid: !!valid[i].data, proofType: r.proof_type,
    }));
  },

  async adminListProofEventCandidates() {
    const sb = await supabaseServer();
    const [payouts, sales, testimonials, events] = await Promise.all([
      sb.from("payouts").select("id, public_ref, amount_cents, currency, paid_at").eq("status", "paid").order("paid_at", { ascending: false }).limit(50),
      sb.from("sales").select("id, public_ref, paid_at, offers(name)").eq("status", "paid").order("paid_at", { ascending: false }).limit(50),
      sb.from("testimonials").select("id, public_ref, reviewed_at").eq("status", "approved").is("consent_withdrawn_at", null).limit(50),
      sb.from("social_proof_events").select("type, source_id"),
    ]);
    const taken = new Set(((check(events) as any[]) ?? []).map((e) => `${e.type}:${e.source_id}`));
    const out: ProofEventCandidate[] = [
      ...(check(payouts) as any[]).map((r) => ({ type: "commission_paid" as const, sourceId: r.id, ref: r.public_ref, valueCents: Number(r.amount_cents), currency: r.currency, at: r.paid_at })),
      ...(check(sales) as any[]).map((r) => ({ type: "new_client" as const, sourceId: r.id, ref: `${r.public_ref} · ${r.offers?.name ?? ""}`, valueCents: null, currency: null, at: r.paid_at })),
      ...(check(testimonials) as any[]).map((r) => ({ type: "testimonial_published" as const, sourceId: r.id, ref: r.public_ref, valueCents: null, currency: null, at: r.reviewed_at })),
    ];
    return out.filter((c) => !taken.has(`${c.type}:${c.sourceId}`));
  },

  async adminCreateProofEvent(_s, type, sourceId) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_create_proof_event", { p_type: type, p_source: sourceId }));
  },

  async adminSetProofEventPublished(_s, id, published) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_set_proof_event_published", { p_id: id, p_published: published }));
  },
};
