import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { sha256 } from "@/lib/contracts/security";
import {
  PROOF_LIMITS, baseMime, canSetDisplay, displayName, isEventSourceValid, isMediaInFolder, mediaKindAccepts, mediaPath, toMonth,
  type AdminProofEvent, type AdminTestimonial, type DisplayMode, type MediaKind, type Placement, type ProofEventType,
  type PublicTestimonial, type TestimonialInput, type TestimonialStatus, type TestimonialType,
} from "@/lib/proof";
import type { ProofRepo } from "./repo";
import type { AffiliateStatus, Role, Session } from "./types";

/**
 * DEMO social proof — development only, in memory. Same rules as the SQL (via
 * src/lib/proof.ts). Every seeded testimonial is an "Exemple de fonctionnement"
 * (proofType "demo", labelled on screen); no proof event is seeded, so the
 * public money proof shows the labelled simulation until staff create one from
 * a demo payout. Uploaded files live in memory, served by /api/demo-proof-media.
 */
export interface DemoProofWorld {
  users: { userId: string; email: string; role: Role; fullName: string; affiliateId: string | null }[];
  affiliates: { id: string; userId: string; status: AffiliateStatus }[];
  customers: { id: string; ref: string; name: string; email: string }[];
  sales: { id: string; ref: string; customerId: string; status: string; paidAt: string | null; createdAt: string }[];
  payouts: { id: string; ref: string; amountCents: number; status: string; paidAt: string | null }[];
  offerName: string;
}

interface Row {
  id: string; ref: string; type: TestimonialType; profileId: string | null; customerId: string | null; inviteId: string | null;
  authorName: string; authorDisplay: DisplayMode; displayMode: DisplayMode; companyName: string | null; profession: string | null;
  activity: string | null; rating: number | null; content: string; recommendation: string | null; locale: string;
  videoPath: string | null; videoMime: string | null; videoWidth: number | null; videoHeight: number | null; videoDurationMs: number | null;
  posterPath: string | null; photoPath: string | null; logoPath: string | null;
  consentAt: string; consentVersion: string; consentText: string; consentWithdrawnAt: string | null;
  status: TestimonialStatus; verifiedBasis: AdminTestimonial["verifiedBasis"]; placements: Placement[];
  service: AdminTestimonial["service"]; caseStudyKey: string | null; showCompany: boolean; featured: boolean; sort: number;
  reviewNote: string | null; reviewedAt: string | null; createdAt: string;
}
interface Invite { id: string; customerId: string; tokenHash: string; locale: string; note: string | null; expiresAt: string; usedAt: string | null; revokedAt: string | null; createdAt: string }
interface Event { id: string; type: ProofEventType; sourceId: string; label: string; valueCents: number | null; currency: string | null; occurredAt: string; published: boolean }
interface ProofStore { v: number; rows: Row[]; invites: Invite[]; events: Event[]; consents: { testimonialId: string; action: "granted" | "withdrawn"; at: string }[]; media: Map<string, { mime: string; data: Buffer | null }> }

const STORE_VERSION = 1;
const MEDIA_BUDGET = 150 * 1024 * 1024;
const g = globalThis as unknown as { __studioDemoProof?: ProofStore };
const iso = (t = Date.now()) => new Date(t).toISOString();
const fail = (code: string): never => { throw new Error(`proof.${code}`); };
const ref = () => `AVI-${randomBytes(3).toString("hex").toUpperCase()}`;
const DEMO_CONSENT = "Exemple de fonctionnement — consentement simulé (données de démonstration).";

/** Seeded examples: clearly fictitious, labelled "Exemple de fonctionnement" on screen. */
function seed(): ProofStore {
  const base = { profileId: null, customerId: null, inviteId: null, recommendation: null, locale: "fr", videoPath: null, videoMime: null,
    videoWidth: null, videoHeight: null, videoDurationMs: null, posterPath: null, photoPath: null, logoPath: null,
    consentAt: iso(), consentVersion: "demo", consentText: DEMO_CONSENT, consentWithdrawnAt: null, caseStudyKey: null,
    showCompany: true, featured: false, sort: 0, reviewNote: null, reviewedAt: iso() } as const;
  const rows: Row[] = [
    { ...base, id: "demo-t-client", ref: "AVI-DEMO01", type: "client", authorName: "Exemple Client", authorDisplay: "first_name", displayMode: "first_name",
      companyName: "Entreprise de démonstration", profession: null, activity: "Artisanat (exemple)", rating: 5,
      content: "Exemple de fonctionnement : ici s'affiche, mot pour mot, ce qu'un client Studio ATS a écrit après la livraison de son projet.",
      recommendation: "Exemple : le conseil que ce client donnerait à quelqu'un qui hésite.", status: "approved", verifiedBasis: "paying_customer",
      placements: ["client", "offers", "home", "sales_center"], service: "website", featured: true, createdAt: iso(Date.now() - 6 * 86_400_000) },
    { ...base, id: "demo-t-video", ref: "AVI-DEMO02", type: "client", authorName: "Exemple Vidéo", authorDisplay: "first_name", displayMode: "first_name",
      companyName: null, profession: null, activity: "Démonstration vidéo", rating: null,
      content: "Exemple de fonctionnement : un avis vidéo s'affiche avec sa miniature, et ne se charge qu'au clic.",
      videoPath: "public:/demo/prospects.mp4", videoMime: "video/mp4", posterPath: "public:/demo/thumbs/prospects.webp",
      status: "approved", verifiedBasis: null, placements: ["client", "sales_center"], service: "crm", createdAt: iso(Date.now() - 4 * 86_400_000) },
    { ...base, id: "demo-t-partner", ref: "AVI-DEMO03", type: "ambassador", authorName: "Exemple Partenaire", authorDisplay: "first_name", displayMode: "first_name",
      companyName: null, profession: "Consultant (exemple)", activity: null, rating: 5,
      content: "Exemple de fonctionnement : le témoignage d'un partenaire enregistré apparaît ici, avec son profil et le badge vérifié.",
      recommendation: null, status: "approved", verifiedBasis: "approved_partner", placements: ["ambassador", "home", "app"], service: "support",
      createdAt: iso(Date.now() - 2 * 86_400_000) },
    { ...base, id: "demo-t-pending", ref: "AVI-DEMO04", type: "ambassador", authorName: "Exemple En attente", authorDisplay: "full", displayMode: "full",
      companyName: null, profession: "Freelance (exemple)", activity: null, rating: 4,
      content: "Exemple d'avis en attente de modération : il n'apparaît nulle part tant qu'un administrateur ne l'a pas approuvé.",
      recommendation: null, status: "pending", verifiedBasis: "approved_partner", placements: [], service: null, reviewedAt: null, createdAt: iso() },
  ];
  return { v: STORE_VERSION, rows, invites: [], events: [], consents: rows.map((r) => ({ testimonialId: r.id, action: "granted" as const, at: r.consentAt })), media: new Map() };
}

function db(): ProofStore {
  if (g.__studioDemoProof?.v !== STORE_VERSION) g.__studioDemoProof = seed();
  return g.__studioDemoProof;
}

/** Bytes of an uploaded demo file (dev-only route). */
export function demoProofMedia(path: string) {
  const m = db().media.get(path);
  return m?.data ? { mime: m.mime, data: m.data } : null;
}

/** Stores a demo upload if it was announced by create*Upload and fits. */
export function putDemoProofMedia(path: string, mime: string, data: Buffer): boolean {
  const st = db();
  const slot = st.media.get(path);
  if (!slot || slot.data) return false;
  if (baseMime(mime) !== slot.mime) return false;
  const kind = slot.mime.startsWith("video/") ? "video" : "photo";
  if (data.length > (kind === "video" ? PROOF_LIMITS.videoMaxBytes : PROOF_LIMITS.imageMaxBytes)) return false;
  const used = [...st.media.values()].reduce((a, x) => a + (x.data?.length ?? 0), 0);
  if (used + data.length > MEDIA_BUDGET) return false;
  st.media.set(path, { mime: slot.mime, data });
  return true;
}

const pathOf = (r: Row, kind: MediaKind) => ({ video: r.videoPath, poster: r.posterPath, photo: r.photoPath, logo: r.logoPath })[kind];
const urlOf = (p: string | null) => !p ? null : p.startsWith("public:") ? p.slice(7) : demoProofMedia(p) ? `/api/demo-proof-media/${p}` : null;

const toPublic = (r: Row): PublicTestimonial => ({
  id: r.id, type: r.type, displayName: displayName(r.authorName, r.displayMode), companyName: r.showCompany ? r.companyName : null,
  profession: r.profession, activity: r.activity, rating: r.rating, content: r.content, recommendation: r.recommendation, locale: r.locale,
  mediaType: r.videoPath ? "video" : "text",
  video: r.videoPath ? { width: r.videoWidth, height: r.videoHeight, durationMs: r.videoDurationMs } : null,
  hasPoster: !!r.posterPath, hasPhoto: !!r.photoPath, hasLogo: !!r.logoPath, service: r.service, caseStudyKey: r.caseStudyKey,
  verified: !!r.verifiedBasis, featured: r.featured, publishedOn: (r.reviewedAt ?? r.createdAt).slice(0, 10), proofType: "demo",
});

export function createDemoProof(world: () => DemoProofWorld, audit: (s: Session, action: string, entityId: string, reason: string | null) => void): ProofRepo {
  const staff = (s: Session | null) => !!s && (s.role === "admin" || s.role === "super_admin");
  const mustStaff = (s: Session) => { if (!staff(s)) throw new Error("Staff only"); };
  const row = (id: string) => db().rows.find((r) => r.id === id) ?? fail("not_found");
  const publicRow = (r: Row) => r.status === "approved" && !r.consentWithdrawnAt;

  function announce(folder: string, kind: MediaKind, mime: string) {
    if (!mediaKindAccepts(kind, mime)) fail("invalid_media");
    const path = mediaPath(folder, randomUUID().replaceAll("-", ""), mime);
    db().media.set(path, { mime: baseMime(mime), data: null });
    return { path, uploadUrl: `/api/demo-proof-media/${path}` };
  }

  function checkMedia(folder: string, i: TestimonialInput) {
    const ok = isMediaInFolder(i.video?.path, folder, "video") && isMediaInFolder(i.posterPath, folder, "poster")
      && isMediaInFolder(i.photoPath, folder, "photo") && isMediaInFolder(i.logoPath, folder, "logo");
    if (!ok) fail("invalid_media");
    for (const p of [i.video?.path, i.posterPath, i.photoPath, i.logoPath]) if (p && !demoProofMedia(p)) fail("media_missing");
  }

  function insert(type: TestimonialType, author: { profileId?: string; customerId?: string; inviteId?: string }, basis: Row["verifiedBasis"], i: TestimonialInput) {
    if (!i.consent) fail("consent_required");
    const r: Row = {
      id: randomUUID(), ref: ref(), type, profileId: author.profileId ?? null, customerId: author.customerId ?? null, inviteId: author.inviteId ?? null,
      authorName: i.authorName, authorDisplay: i.authorDisplay, displayMode: i.authorDisplay, companyName: i.companyName, profession: i.profession,
      activity: i.activity, rating: i.rating, content: i.content, recommendation: i.recommendation, locale: i.locale,
      videoPath: i.video?.path ?? null, videoMime: i.video?.mime ?? null, videoWidth: i.video?.width ?? null, videoHeight: i.video?.height ?? null,
      videoDurationMs: i.video?.durationMs ?? null, posterPath: i.posterPath, photoPath: i.photoPath, logoPath: i.logoPath,
      consentAt: iso(), consentVersion: i.consentVersion, consentText: i.consentText, consentWithdrawnAt: null, status: "pending",
      verifiedBasis: basis, placements: [], service: null, caseStudyKey: null, showCompany: true, featured: false, sort: 0,
      reviewNote: null, reviewedAt: null, createdAt: iso(),
    };
    db().rows.unshift(r);
    db().consents.push({ testimonialId: r.id, action: "granted", at: r.consentAt });
    return { id: r.id, ref: r.ref };
  }

  const openInvite = (token: string) => {
    const inv = db().invites.find((x) => x.tokenHash === sha256(token));
    if (!inv || inv.usedAt || inv.revokedAt || new Date(inv.expiresAt).getTime() <= Date.now()) fail("invite_invalid");
    return inv!;
  };
  const inviteFolder = (inv: Invite) => `c/${inv.id.replaceAll("-", "")}`;
  const sourceOf = (type: ProofEventType, id: string) => {
    const w = world();
    if (type === "commission_paid") return w.payouts.find((p) => p.id === id) ?? null;
    if (type === "new_client") return w.sales.find((x) => x.id === id) ?? null;
    const r = db().rows.find((x) => x.id === id);
    return r ? { status: r.status, consentWithdrawn: !!r.consentWithdrawnAt } : null;
  };
  const valid = (e: Pick<Event, "type" | "sourceId">) => isEventSourceValid(e.type, sourceOf(e.type, e.sourceId));

  return {
    async listPublicTestimonials({ placement, type, limit = 12 }) {
      return db().rows.filter((r) => publicRow(r) && (!placement || r.placements.includes(placement)) && (!type || r.type === type))
        .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort || (b.reviewedAt ?? b.createdAt).localeCompare(a.reviewedAt ?? a.createdAt))
        .slice(0, limit).map(toPublic);
    },

    async listPublicProofEvents(limit = 6) {
      return db().events.filter((e) => e.published && valid(e)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, limit)
        .map((e) => ({ id: e.id, type: e.type, label: e.label, valueCents: e.valueCents, currency: e.currency, month: toMonth(e.occurredAt), verified: true as const, proofType: "real" as const }));
    },

    async resolveProofMedia(viewer, id, kind) {
      const r = db().rows.find((x) => x.id === id);
      if (!r) return null;
      if (publicRow(r) || staff(viewer) || (viewer && r.profileId === viewer.userId)) return urlOf(pathOf(r, kind));
      return null;
    },

    async createProofUpload(s, kind, mime) {
      if (!s.affiliate) fail("not_allowed");
      return announce(`demo/${s.userId.replace(/[^A-Za-z0-9_-]/g, "")}`, kind, mime);
    },

    async submitAmbassadorTestimonial(s, i) {
      if (!s.affiliate) fail("not_allowed");
      const mine = db().rows.filter((r) => r.profileId === s.userId);
      if (mine.some((r) => r.status === "pending")) fail("already_pending");
      if (mine.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 30 * 86_400_000).length >= 3) fail("rate_limited");
      checkMedia(`demo/${s.userId.replace(/[^A-Za-z0-9_-]/g, "")}`, i);
      const out = insert("ambassador", { profileId: s.userId }, s.affiliate!.status === "approved" ? "approved_partner" : null, i);
      audit(s, "testimonial.submit", out.id, null);
      return out;
    },

    async listMyTestimonials(s) {
      return db().rows.filter((r) => r.profileId === s.userId).map((r) => ({
        id: r.id, ref: r.ref, status: r.status, rating: r.rating, content: r.content, mediaType: r.videoPath ? "video" as const : "text" as const,
        verified: !!r.verifiedBasis, consentWithdrawn: !!r.consentWithdrawnAt, placements: r.placements, createdAt: r.createdAt,
      }));
    },

    async withdrawTestimonial(s, id) {
      const r = row(id);
      if (r.profileId !== s.userId && !(r.type === "client" && staff(s))) fail("not_allowed");
      if (r.consentWithdrawnAt) return;
      Object.assign(r, { consentWithdrawnAt: iso(), status: "hidden", placements: [], featured: false });
      db().consents.push({ testimonialId: id, action: "withdrawn", at: iso() });
      for (const e of db().events) if (e.sourceId === id) e.published = false;
      audit(s, "testimonial.withdraw", id, null);
    },

    async lookupTestimonialInvite(token) {
      const inv = db().invites.find((x) => x.tokenHash === sha256(token));
      if (!inv) return null;
      const c = world().customers.find((x) => x.id === inv.customerId);
      const state = inv.revokedAt ? "revoked" : inv.usedAt ? "used" : new Date(inv.expiresAt).getTime() <= Date.now() ? "expired" : "open";
      return { state, companyName: c?.name ?? null, contactName: null, locale: inv.locale };
    },

    async createInviteUpload(token, kind, mime) {
      return announce(inviteFolder(openInvite(token)), kind, mime);
    },

    async submitClientTestimonial(token, i) {
      const inv = openInvite(token);
      checkMedia(inviteFolder(inv), i);
      const paid = world().sales.some((x) => x.customerId === inv.customerId && x.status === "paid");
      const out = insert("client", { customerId: inv.customerId, inviteId: inv.id }, paid ? "paying_customer" : null, i);
      inv.usedAt = iso();
      return out;
    },

    async adminListTestimonials(s, status) {
      mustStaff(s);
      const w = world();
      return db().rows.filter((r) => !status?.length || status.includes(r.status)).map((r): AdminTestimonial => ({
        id: r.id, ref: r.ref, status: r.status, rating: r.rating, content: r.content, mediaType: r.videoPath ? "video" : "text",
        verified: !!r.verifiedBasis, consentWithdrawn: !!r.consentWithdrawnAt, placements: r.placements, createdAt: r.createdAt,
        type: r.type, authorName: r.authorName, authorDisplay: r.authorDisplay, displayMode: r.displayMode,
        authorAccount: r.profileId ? w.users.find((u) => u.userId === r.profileId)?.email ?? null
          : r.customerId ? w.customers.find((c) => c.id === r.customerId)?.ref ?? null : "démo",
        companyName: r.companyName, profession: r.profession, activity: r.activity, recommendation: r.recommendation, locale: r.locale,
        video: r.videoPath ? { width: r.videoWidth, height: r.videoHeight, durationMs: r.videoDurationMs } : null,
        hasPoster: !!r.posterPath, hasPhoto: !!r.photoPath, hasLogo: !!r.logoPath, verifiedBasis: r.verifiedBasis,
        consentAt: r.consentAt, consentVersion: r.consentVersion, consentText: r.consentText, service: r.service,
        caseStudyKey: r.caseStudyKey, showCompany: r.showCompany, featured: r.featured, sort: r.sort, reviewNote: r.reviewNote, reviewedAt: r.reviewedAt,
      }));
    },

    async adminReviewTestimonial(s, id, status, note) {
      mustStaff(s);
      const r = row(id);
      if (status === "approved" && r.consentWithdrawnAt) fail("consent_withdrawn");
      if (status === "rejected" && !note?.trim()) fail("reason_required");
      if (r.status === status) return;
      Object.assign(r, { status, reviewNote: note?.trim() || null, reviewedAt: iso(),
        placements: status === "approved" ? r.placements : [], featured: status === "approved" ? r.featured : false });
      if (status !== "approved") for (const e of db().events) if (e.sourceId === id) e.published = false;
      audit(s, `testimonial.${status}`, id, note);
    },

    async adminUpdateTestimonialPresentation(s, id, i) {
      mustStaff(s);
      const r = row(id);
      if (!canSetDisplay(r.authorDisplay, i.displayMode)) fail("display_not_allowed");
      if (r.status !== "approved" && i.placements.length) fail("not_approved");
      Object.assign(r, { placements: i.placements, displayMode: i.displayMode, service: i.service, caseStudyKey: i.caseStudyKey,
        showCompany: i.showCompany, featured: i.featured, sort: i.sort });
      audit(s, "testimonial.presentation", id, null);
    },

    async adminRemoveTestimonialMedia(s, id, kind, reason) {
      mustStaff(s);
      const r = row(id);
      const paths = kind === "video" ? [r.videoPath, r.posterPath] : [pathOf(r, kind)];
      if (kind === "video") Object.assign(r, { videoPath: null, videoMime: null, posterPath: null });
      else Object.assign(r, { [`${kind}Path`]: null });
      for (const p of paths) if (p && !p.startsWith("public:")) db().media.delete(p);
      audit(s, "testimonial.remove_media", id, reason);
    },

    async adminListTestimonialInvites(s) {
      mustStaff(s);
      const w = world();
      return db().invites.map((inv) => {
        const c = w.customers.find((x) => x.id === inv.customerId);
        return {
          id: inv.id, customerRef: c?.ref ?? "", companyName: c?.name ?? null, note: inv.note, expiresAt: inv.expiresAt, createdAt: inv.createdAt,
          state: inv.revokedAt ? "revoked" as const : inv.usedAt ? "used" as const : new Date(inv.expiresAt).getTime() <= Date.now() ? "expired" as const : "open" as const,
        };
      });
    },

    async adminListInviteCandidates(s) {
      mustStaff(s);
      const w = world();
      const seen = new Set<string>();
      return w.sales.filter((x) => x.status === "paid").sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
        .filter((x) => !seen.has(x.customerId) && !!seen.add(x.customerId))
        .map((x) => {
          const c = w.customers.find((y) => y.id === x.customerId);
          return { customerId: x.customerId, customerRef: c?.ref ?? "", companyName: c?.name ?? null, contactName: null, offer: w.offerName, paidAt: x.paidAt ?? x.createdAt };
        }).slice(0, 100);
    },

    async adminCreateTestimonialInvite(s, customerId, locale, note) {
      mustStaff(s);
      if (!world().customers.some((c) => c.id === customerId)) fail("not_found");
      const token = randomBytes(32).toString("base64url");
      const expiresAt = iso(Date.now() + PROOF_LIMITS.inviteDays * 86_400_000);
      db().invites.unshift({ id: randomUUID(), customerId, tokenHash: sha256(token), locale, note, expiresAt, usedAt: null, revokedAt: null, createdAt: iso() });
      audit(s, "testimonial.invite", customerId, null);
      return { token, expiresAt };
    },

    async adminRevokeTestimonialInvite(s, id) {
      mustStaff(s);
      const inv = db().invites.find((x) => x.id === id);
      if (inv && !inv.usedAt && !inv.revokedAt) inv.revokedAt = iso();
    },

    async adminListProofEvents(s) {
      mustStaff(s);
      return db().events.map((e): AdminProofEvent => ({
        id: e.id, type: e.type, label: e.label, valueCents: e.valueCents, currency: e.currency, occurredAt: e.occurredAt,
        verified: true, published: e.published, sourceValid: valid(e), proofType: "real",
      }));
    },

    async adminListProofEventCandidates(s) {
      mustStaff(s);
      const w = world();
      const taken = new Set(db().events.map((e) => `${e.type}:${e.sourceId}`));
      return [
        ...w.payouts.filter((p) => p.status === "paid").map((p) => ({ type: "commission_paid" as const, sourceId: p.id, ref: p.ref, valueCents: p.amountCents, currency: "EUR", at: p.paidAt ?? iso() })),
        ...w.sales.filter((x) => x.status === "paid").slice(0, 20).map((x) => ({ type: "new_client" as const, sourceId: x.id, ref: `${x.ref} · ${w.offerName}`, valueCents: null, currency: null, at: x.paidAt ?? x.createdAt })),
        ...db().rows.filter(publicRow).map((r) => ({ type: "testimonial_published" as const, sourceId: r.id, ref: r.ref, valueCents: null, currency: null, at: r.reviewedAt ?? r.createdAt })),
      ].filter((c) => !taken.has(`${c.type}:${c.sourceId}`));
    },

    async adminCreateProofEvent(s, type, sourceId) {
      mustStaff(s);
      if (!valid({ type, sourceId })) fail("source_invalid");
      if (db().events.some((e) => e.type === type && e.sourceId === sourceId)) return;
      const w = world();
      const p = type === "commission_paid" ? w.payouts.find((x) => x.id === sourceId)! : null;
      const sale = type === "new_client" ? w.sales.find((x) => x.id === sourceId)! : null;
      const t = type === "testimonial_published" ? row(sourceId) : null;
      db().events.unshift({
        id: randomUUID(), type, sourceId, published: false,
        label: p ? "partner" : sale ? w.offerName : t!.type,
        valueCents: p ? p.amountCents : null, currency: p ? "EUR" : null,
        occurredAt: p ? (p.paidAt ?? iso()) : sale ? (sale.paidAt ?? sale.createdAt) : (t!.reviewedAt ?? t!.createdAt),
      });
      audit(s, "proof_event.create", sourceId, null);
    },

    async adminSetProofEventPublished(s, id, published) {
      mustStaff(s);
      const e = db().events.find((x) => x.id === id) ?? fail("not_found");
      if (published && !valid(e)) fail("source_invalid");
      e.published = published;
      audit(s, published ? "proof_event.publish" : "proof_event.unpublish", id, null);
    },
  };
}
