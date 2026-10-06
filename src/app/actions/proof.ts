"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { getSession, repo } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import {
  CONSENT_VERSION, DISPLAY_MODES, MEDIA_KINDS, PLACEMENTS, PROOF_EVENT_TYPES, PROOF_LIMITS, SERVICES, TESTIMONIAL_STATUSES,
  mediaKindAccepts, proofErrorCode, type TestimonialInput,
} from "@/lib/proof";

export type ReviewState = { ok?: boolean; ref?: string; error?: string };
export type ProofAdminState = { ok?: boolean; error?: string; link?: string };
type UploadResult = { path: string; uploadUrl: string } | { error: string };

const opt = (max: number) => z.string().trim().max(max).transform((v) => v || null).nullable().optional().transform((v) => v ?? null);
const mediaPathField = z.string().trim().max(200).regex(/^[a-z]+\/[A-Za-z0-9_-]{1,64}\/[a-f0-9]{32}\.(mp4|webm|mov|jpg|png|webp)$/)
  .nullable().optional().catch(null).transform((v) => v ?? null);
const intField = (max: number) => z.coerce.number().int().min(1).max(max).nullable().optional().catch(null).transform((v) => v ?? null);

const reviewSchema = z.object({
  authorName: z.string().trim().min(PROOF_LIMITS.nameMin).max(PROOF_LIMITS.nameMax),
  authorDisplay: z.enum(DISPLAY_MODES).catch("first_name"),
  profession: opt(80),
  companyName: opt(120),
  activity: opt(120),
  rating: z.coerce.number().int().min(1).max(5).nullable().optional().catch(null).transform((v) => v ?? null),
  content: z.string().trim().min(PROOF_LIMITS.contentMin).max(PROOF_LIMITS.contentMax),
  recommendation: opt(PROOF_LIMITS.recommendationMax),
  consent: z.literal("on"),
  locale: z.string().refine(isLocale),
  videoPath: mediaPathField,
  videoMime: opt(60),
  videoWidth: intField(8000),
  videoHeight: intField(8000),
  videoDurationMs: intField(600_000),
  posterPath: mediaPathField,
  photoPath: mediaPathField,
  logoPath: mediaPathField,
});

/** Builds the stored input. The consent wording is taken from the dictionary, never from the browser. */
async function parseReview(f: FormData): Promise<TestimonialInput | "invalid" | "consent_required"> {
  const raw = Object.fromEntries([...f.entries()].filter(([, v]) => typeof v === "string"));
  if (raw.consent !== "on") return "consent_required";
  const p = reviewSchema.safeParse({ ...raw, rating: raw.rating || null });
  if (!p.success) return "invalid";
  const d = p.data;
  const t = await getDictionary(d.locale as Locale);
  return {
    authorName: d.authorName, authorDisplay: d.authorDisplay, profession: d.profession, companyName: d.companyName, activity: d.activity,
    rating: d.rating, content: d.content, recommendation: d.recommendation, locale: d.locale, consent: true,
    consentVersion: CONSENT_VERSION, consentText: t.pf.form.consent,
    video: d.videoPath ? { path: d.videoPath, mime: d.videoMime ?? "video/mp4", width: d.videoWidth, height: d.videoHeight, durationMs: d.videoDurationMs } : null,
    posterPath: d.videoPath ? d.posterPath : null, photoPath: d.photoPath, logoPath: d.logoPath,
  };
}

const uploadInput = z.object({
  kind: z.enum(MEDIA_KINDS),
  mime: z.string().max(80),
  size: z.number().int().positive(),
  token: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/).nullable(),
});

/** A signed upload URL in the author's own folder (partner session, or a valid client invite). */
export async function createReviewUpload(input: z.input<typeof uploadInput>): Promise<UploadResult> {
  const p = uploadInput.safeParse(input);
  if (!p.success) return { error: "unsupported" };
  const { kind, mime, size, token } = p.data;
  if (!mediaKindAccepts(kind, mime)) return { error: "unsupported" };
  if (size > (kind === "video" ? PROOF_LIMITS.videoMaxBytes : PROOF_LIMITS.imageMaxBytes)) return { error: "too_large" };
  try {
    if (token) return await repo().createInviteUpload(token, kind, mime);
    const s = await getSession();
    if (!s?.affiliate) return { error: "generic" };
    return await repo().createProofUpload(s, kind, mime);
  } catch (e) {
    return { error: proofErrorCode(e instanceof Error ? e.message : String(e)) };
  }
}

/** "Give my review" — partner (from the dashboard) or client (with the invite token). Always `pending`. */
export async function submitReview(_: ReviewState, f: FormData): Promise<ReviewState> {
  const input = await parseReview(f);
  if (input === "invalid" || input === "consent_required") return { error: input };
  const token = typeof f.get("token") === "string" && f.get("token") ? String(f.get("token")) : null;
  try {
    if (token) {
      if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return { error: "invite_invalid" };
      const { ref } = await repo().submitClientTestimonial(token, input);
      return { ok: true, ref };
    }
    const s = await getSession();
    if (!s?.affiliate) return { error: "generic" };
    const { ref } = await repo().submitAmbassadorTestimonial(s, input);
    revalidatePath("/[locale]/dashboard/review", "page");
    revalidatePath("/[locale]/admin", "layout");
    return { ok: true, ref };
  } catch (e) {
    const code = proofErrorCode(e instanceof Error ? e.message : String(e));
    if (code === "generic") log.error("proof", "submit failed", { error: e instanceof Error ? e.message : String(e) });
    return { error: code };
  }
}

export async function withdrawMyReview(f: FormData): Promise<void> {
  const s = await getSession();
  if (!s) return;
  const id = z.string().min(1).max(100).parse(f.get("id"));
  await repo().withdrawTestimonial(s, id);
  revalidatePath("/[locale]/dashboard/review", "page");
  revalidatePath("/[locale]", "layout");
}

// ----------------------------------------------------------------------------- staff

async function staff() {
  const s = await getSession();
  if (!isStaff(s)) throw new Error("Forbidden");
  return s!;
}

async function run(fn: () => Promise<void | Partial<ProofAdminState>>): Promise<ProofAdminState> {
  try {
    const extra = await fn();
    revalidatePath("/[locale]/admin/proof", "page");
    revalidatePath("/[locale]", "layout");
    return { ok: true, ...(extra ?? {}) };
  } catch (e) {
    return { error: proofErrorCode(e instanceof Error ? e.message : String(e)) };
  }
}

const id = (f: FormData, key = "id") => z.string().min(1).max(100).parse(f.get(key));

export async function reviewTestimonial(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => {
    const status = z.enum(TESTIMONIAL_STATUSES).exclude(["pending"]).parse(f.get("status"));
    const note = z.string().trim().max(1000).parse(f.get("note") ?? "");
    await repo().adminReviewTestimonial(s, id(f), status, note || null);
  });
}

export async function saveTestimonialPresentation(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => {
    const placements = f.getAll("placements").map((p) => z.enum(PLACEMENTS).parse(p));
    const service = z.enum(SERVICES).nullable().catch(null).parse(f.get("service") || null);
    const caseStudyKey = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,60}$/).nullable().catch(null).parse(f.get("caseStudyKey") || null);
    await repo().adminUpdateTestimonialPresentation(s, id(f), {
      placements, service, caseStudyKey,
      displayMode: z.enum(DISPLAY_MODES).parse(f.get("displayMode")),
      showCompany: f.get("showCompany") === "on", featured: f.get("featured") === "on",
      sort: z.coerce.number().int().min(-1000).max(1000).catch(0).parse(f.get("sort")),
    });
  });
}

export async function removeTestimonialMedia(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => {
    await repo().adminRemoveTestimonialMedia(s, id(f), z.enum(MEDIA_KINDS).parse(f.get("kind")), null);
  });
}

export async function recordClientWithdrawal(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => { await repo().withdrawTestimonial(s, id(f)); });
}

export async function createTestimonialInvite(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => {
    const locale = z.string().refine(isLocale).catch("fr").parse(f.get("locale"));
    const note = z.string().trim().max(300).parse(f.get("note") ?? "");
    const { token } = await repo().adminCreateTestimonialInvite(s, id(f, "customerId"), locale, note || null);
    return { link: `${env.siteUrl}/${locale}/review/${token}` };
  });
}

export async function revokeTestimonialInvite(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => { await repo().adminRevokeTestimonialInvite(s, id(f)); });
}

export async function createProofEvent(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => { await repo().adminCreateProofEvent(s, z.enum(PROOF_EVENT_TYPES).parse(f.get("type")), id(f, "sourceId")); });
}

export async function setProofEventPublished(_: ProofAdminState, f: FormData): Promise<ProofAdminState> {
  const s = await staff();
  return run(async () => { await repo().adminSetProofEventPublished(s, id(f), f.get("published") === "true"); });
}
