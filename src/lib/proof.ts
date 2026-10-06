/**
 * Social proof — pure rules shared by the UI, the demo store and the tests.
 * The database is the authority (supabase/migrations/20261013000001_social_proof.sql):
 *
 *   displayName()          ⇔ public.proof_display_name()
 *   canSetDisplay()        ⇔ staff_update_testimonial_presentation (rank check)
 *   mediaPath()            ⇔ public.proof_check_media() (folder + extension)
 *   isEventSourceValid()   ⇔ public.proof_event_source_valid()
 *   toPublicTestimonial()  ⇔ the column whitelist of public.public_testimonials()
 *
 * Keep both in sync. Nothing here invents a figure: simulations are built from
 * the real offers and are always typed `proofType: "demo"`.
 */

export const TESTIMONIAL_TYPES = ["client", "ambassador"] as const;
export type TestimonialType = (typeof TESTIMONIAL_TYPES)[number];
export const TESTIMONIAL_STATUSES = ["pending", "approved", "rejected", "hidden"] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];
export type MediaType = "text" | "video";
export const PLACEMENTS = ["home", "offers", "client", "ambassador", "sales_center", "app", "case_study"] as const;
export type Placement = (typeof PLACEMENTS)[number];
export const SERVICES = ["website", "crm", "automation", "maintenance", "support", "tools", "other"] as const;
export type StudioService = (typeof SERVICES)[number];
export const DISPLAY_MODES = ["full", "first_name", "initials"] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];
export const PROOF_EVENT_TYPES = ["commission_paid", "new_client", "testimonial_published"] as const;
export type ProofEventType = (typeof PROOF_EVENT_TYPES)[number];
export type MediaKind = "video" | "poster" | "photo" | "logo";
export const MEDIA_KINDS = ["video", "poster", "photo", "logo"] as const satisfies readonly MediaKind[];

/** Bump when the consent wording changes: every testimonial stores the version it was given under. */
export const CONSENT_VERSION = "2026-10-05";

export const PROOF_LIMITS = {
  contentMin: 10,
  contentMax: 2000,
  recommendationMax: 1000,
  nameMin: 2,
  nameMax: 80,
  videoMaxBytes: 50 * 1024 * 1024,
  imageMaxBytes: 8 * 1024 * 1024,
  /** Recording cap in the browser. */
  recordMaxMs: 90_000,
  /** Client-side image resize (posters, photos, logos). */
  imageMaxSide: 960,
  inviteDays: 30,
} as const;

export const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const EXT: Record<string, string> = {
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

export const baseMime = (mime: string) => mime.split(";")[0].trim().toLowerCase();

export function mediaKindAccepts(kind: MediaKind, mime: string): boolean {
  const m = baseMime(mime);
  return kind === "video" ? (VIDEO_MIMES as readonly string[]).includes(m) : (IMAGE_MIMES as readonly string[]).includes(m);
}

/** Storage folder of an author: `a/{profileId}` (partner) or `c/{inviteId without dashes}` (client). */
export function mediaFolder(author: { profileId: string } | { inviteId: string }): string {
  return "profileId" in author ? `a/${author.profileId}` : `c/${author.inviteId.replaceAll("-", "")}`;
}

/** `{folder}/{32 hex}.{ext}` — the only shape the database accepts. */
export function mediaPath(folder: string, fileId: string, mime: string): string {
  const ext = EXT[baseMime(mime)];
  if (!ext) throw new Error("proof.invalid_media");
  if (!/^[a-f0-9]{32}$/.test(fileId)) throw new Error("proof.invalid_media");
  if (!/^(a\/[0-9a-f-]{36}|c\/[0-9a-f]{32}|demo\/[A-Za-z0-9_-]{1,64})$/.test(folder)) throw new Error("proof.invalid_media");
  return `${folder}/${fileId}.${ext}`;
}

export function isMediaInFolder(path: string | null | undefined, folder: string, kind: MediaKind): boolean {
  if (!path) return true;
  if (!path.startsWith(`${folder}/`)) return false;
  const rest = path.slice(folder.length + 1);
  const m = /^[a-f0-9]{32}\.(mp4|webm|mov|jpg|png|webp)$/.exec(rest);
  if (!m) return false;
  return kind === "video" ? ["mp4", "webm", "mov"].includes(m[1]) : ["jpg", "png", "webp"].includes(m[1]);
}

const RANK: Record<DisplayMode, number> = { full: 3, first_name: 2, initials: 1 };

export function displayName(name: string, mode: DisplayMode): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (mode === "full") return words.join(" ");
  if (mode === "first_name") return words[0] ?? "";
  return words.map((w) => `${w[0]}.`).join(" ");
}

/** Staff may only show LESS of a name than its author allowed. */
export const canSetDisplay = (authorChoice: DisplayMode, next: DisplayMode) => RANK[next] <= RANK[authorChoice];

/** Which moderation buttons make sense from a status (the SQL refuses `pending` as a target). */
export function nextStatuses(status: TestimonialStatus, consentWithdrawn: boolean): Exclude<TestimonialStatus, "pending">[] {
  const all = (["approved", "rejected", "hidden"] as const).filter((s) => s !== status);
  return consentWithdrawn ? all.filter((s) => s !== "approved") : all;
}

/** Badge rule: computed by the database from the author's account, never set by hand. */
export function verifiedBasis(input: { type: "ambassador"; affiliateApproved: boolean } | { type: "client"; hasPaidSale: boolean }) {
  if (input.type === "ambassador") return input.affiliateApproved ? "approved_partner" as const : null;
  return input.hasPaidSale ? "paying_customer" as const : null;
}

export function isEventSourceValid(type: ProofEventType, source: { status: string; consentWithdrawn?: boolean } | null): boolean {
  if (!source) return false;
  if (type === "commission_paid" || type === "new_client") return source.status === "paid";
  return source.status === "approved" && !source.consentWithdrawn;
}

/** Month precision for public money proofs: an exact date could identify a partner. */
export const toMonth = (iso: string) => `${iso.slice(0, 7)}-01`;

// ----------------------------------------------------------------------------- public shapes

/**
 * What a visitor may receive about one testimonial. No email, no account ids,
 * no storage paths: media are served by /api/proof-media/{id}/{kind}, which
 * re-checks the status on every request.
 */
export interface PublicTestimonial {
  id: string;
  type: TestimonialType;
  displayName: string;
  companyName: string | null;
  profession: string | null;
  activity: string | null;
  rating: number | null;
  content: string;
  recommendation: string | null;
  locale: string;
  mediaType: MediaType;
  video: { width: number | null; height: number | null; durationMs: number | null } | null;
  hasPoster: boolean;
  hasPhoto: boolean;
  hasLogo: boolean;
  service: StudioService | null;
  caseStudyKey: string | null;
  verified: boolean;
  featured: boolean;
  publishedOn: string;
  /** "real" from the database; "demo" only in the in-memory demo store (always labelled on screen). */
  proofType: "real" | "demo";
}

const PUBLIC_KEYS = [
  "id", "type", "displayName", "companyName", "profession", "activity", "rating", "content", "recommendation", "locale",
  "mediaType", "video", "hasPoster", "hasPhoto", "hasLogo", "service", "caseStudyKey", "verified", "featured", "publishedOn", "proofType",
] as const satisfies readonly (keyof PublicTestimonial)[];

/** Copies the whitelisted fields only — anything else on `row` is dropped. */
export function toPublicTestimonial(row: PublicTestimonial): PublicTestimonial {
  const out = {} as Record<string, unknown>;
  for (const k of PUBLIC_KEYS) out[k] = row[k];
  return out as unknown as PublicTestimonial;
}

export interface PublicProofEvent {
  id: string;
  type: ProofEventType;
  /** Anonymised: "partner", "client", "ambassador" or an offer name. */
  label: string;
  valueCents: number | null;
  currency: string | null;
  /** YYYY-MM-01 */
  month: string;
  verified: true;
  proofType: "real";
}

export const mediaUrl = (id: string, kind: MediaKind) => `/api/proof-media/${id}/${kind}`;

/** Portrait (9:16-ish) videos get a vertical card. */
export const isPortrait = (v: { width: number | null; height: number | null } | null) =>
  !!v && !!v.width && !!v.height && v.height > v.width * 1.1;

// ----------------------------------------------------------------------------- simulation

export interface FlowStep { key: "shared" | "followed" | "sold" | "generated" | "available" | "requested" | "paid"; amountCents: number | null }

/**
 * "How a recommendation becomes a payment", for ONE illustrative sale of the
 * given offer. Amounts come from the real price and rate; the result is a
 * simulation and must be rendered with the Simulation badge.
 */
export function simulateFlow(offer: { priceCents: number; commissionRate: number }): { proofType: "demo"; commissionCents: number; steps: FlowStep[] } {
  const commission = Math.round(offer.priceCents * offer.commissionRate);
  return {
    proofType: "demo",
    commissionCents: commission,
    steps: [
      { key: "shared", amountCents: null },
      { key: "followed", amountCents: null },
      { key: "sold", amountCents: offer.priceCents },
      { key: "generated", amountCents: commission },
      { key: "available", amountCents: commission },
      { key: "requested", amountCents: commission },
      { key: "paid", amountCents: commission },
    ],
  };
}

// ----------------------------------------------------------------------------- "Give my review" moments

export type ReviewMoment = "first_payout" | "first_commission" | "first_sale";

/** The most meaningful milestone reached, or null (then the prompt stays discreet). */
export function reviewMoment(m: { sales: number; commissions: number; payoutsPaid: number }): ReviewMoment | null {
  if (m.payoutsPaid > 0) return "first_payout";
  if (m.commissions > 0) return "first_commission";
  if (m.sales > 0) return "first_sale";
  return null;
}

/** Maps a database error to a stable code (`proof.<code>`). */
export function proofErrorCode(message: string): string {
  const m = /proof\.([a-z_]+)/.exec(message);
  return m ? m[1] : "generic";
}

// ----------------------------------------------------------------------------- author / staff shapes

/** The validated "Give my review" form (server actions build it with zod). */
export interface TestimonialInput {
  authorName: string;
  authorDisplay: DisplayMode;
  profession: string | null;
  companyName: string | null;
  activity: string | null;
  rating: number | null;
  content: string;
  recommendation: string | null;
  locale: string;
  consent: true;
  consentVersion: string;
  consentText: string;
  video: { path: string; mime: string; width: number | null; height: number | null; durationMs: number | null } | null;
  posterPath: string | null;
  photoPath: string | null;
  logoPath: string | null;
}

export interface MyTestimonial {
  id: string;
  ref: string;
  status: TestimonialStatus;
  rating: number | null;
  content: string;
  mediaType: MediaType;
  verified: boolean;
  consentWithdrawn: boolean;
  placements: Placement[];
  createdAt: string;
}

export interface AdminTestimonial extends MyTestimonial {
  type: TestimonialType;
  authorName: string;
  authorDisplay: DisplayMode;
  displayMode: DisplayMode;
  /** Account behind the review (partner email or customer ref) — staff only. */
  authorAccount: string | null;
  companyName: string | null;
  profession: string | null;
  activity: string | null;
  recommendation: string | null;
  locale: string;
  video: { width: number | null; height: number | null; durationMs: number | null } | null;
  hasPoster: boolean;
  hasPhoto: boolean;
  hasLogo: boolean;
  verifiedBasis: "approved_partner" | "paying_customer" | null;
  consentAt: string;
  consentVersion: string;
  consentText: string;
  service: StudioService | null;
  caseStudyKey: string | null;
  showCompany: boolean;
  featured: boolean;
  sort: number;
  reviewNote: string | null;
  reviewedAt: string | null;
}

export interface PresentationInput {
  placements: Placement[];
  displayMode: DisplayMode;
  service: StudioService | null;
  caseStudyKey: string | null;
  showCompany: boolean;
  featured: boolean;
  sort: number;
}

export interface TestimonialInvite {
  id: string;
  customerRef: string;
  companyName: string | null;
  state: "open" | "used" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
  note: string | null;
}

export interface InviteCandidate { customerId: string; customerRef: string; companyName: string | null; contactName: string | null; offer: string; paidAt: string }

export interface InviteLookup { state: TestimonialInvite["state"]; companyName: string | null; contactName: string | null; locale: string }

export interface AdminProofEvent {
  id: string;
  type: ProofEventType;
  label: string;
  valueCents: number | null;
  currency: string | null;
  occurredAt: string;
  verified: boolean;
  published: boolean;
  sourceValid: boolean;
  proofType: "real" | "demo";
}

export interface ProofEventCandidate { type: ProofEventType; sourceId: string; ref: string; valueCents: number | null; currency: string | null; at: string }
