"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import { PROSPECT_STAGES, type ProspectStage, type Session } from "@/lib/data/types";
import { locales } from "@/i18n/config";

/**
 * Affiliate server actions. The affiliate id always comes from the server
 * session — never from the client payload.
 */
async function affiliateSession(): Promise<Session> {
  const s = await getSession();
  if (!s?.affiliate) throw new Error("Unauthorized");
  return s;
}
const refresh = () => revalidatePath("/[locale]/dashboard", "layout");
const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : null);

export type FormState = { ok?: boolean; error?: string };

export async function setGoal(form: FormData) {
  const s = await affiliateSession();
  const target = z.coerce.number().int().min(1).max(1000).parse(form.get("target"));
  await repo().setMonthlyGoal(s, target);
  refresh();
}

export async function createCampaign(_: FormState, form: FormData): Promise<FormState> {
  const s = await affiliateSession();
  const name = z.string().trim().min(1).max(120).safeParse(form.get("name"));
  if (!name.success) return { error: "name" };
  const messageKey = str(form.get("messageKey"));
  try {
    await repo().createCampaignLink(s, {
      name: name.data, source: str(form.get("source")), marketId: str(form.get("marketId")),
      pageId: str(form.get("pageId")), messageKey: messageKey && /^[a-z0-9][a-z0-9_.:-]{0,79}$/.test(messageKey) ? messageKey : null,
    });
  } catch {
    return { error: "invalid" };
  }
  refresh();
  return { ok: true };
}

export async function setSlug(_: FormState, form: FormData): Promise<FormState> {
  const s = await affiliateSession();
  const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/).safeParse(form.get("slug"));
  if (!slug.success) return { error: "format" };
  try {
    await repo().setSlug(s, slug.data);
  } catch (e) {
    return { error: e instanceof Error && e.message === "slug_taken" ? "taken" : "error" };
  }
  refresh();
  return { ok: true };
}

const pageSchema = z.object({
  marketId: z.string().optional().transform((v) => v || null),
  campaignId: z.string().optional().transform((v) => v || null),
  locale: z.enum(locales),
  pitchVariant: z.enum(["default", "premium", "automation"]),
  ctaVariant: z.enum(["request", "call"]),
  displayName: z.string().trim().max(60).optional().transform((v) => v || null),
  visibility: z.enum(["private", "unlisted"]),
});

export async function createPrivatePage(_: FormState, form: FormData): Promise<FormState> {
  const s = await affiliateSession();
  const d = pageSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return { error: "invalid" };
  await repo().createPrivatePage(s, d.data);
  refresh();
  return { ok: true };
}

const prospectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional(),
  profession: z.string().trim().max(120).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(5000).optional(),
  source: z.string().trim().max(120).optional(),
  campaignId: z.string().optional(),
  marketId: z.string().optional(),
  stage: z.enum(PROSPECT_STAGES as [ProspectStage, ...ProspectStage[]]).default("new"),
  nextAction: z.string().trim().max(200).optional(),
  nextActionAt: z.string().optional(),
  potentialValue: z.coerce.number().min(0).max(10_000_000).optional(),
});

function toProspectInput(d: z.infer<typeof prospectSchema>) {
  const n = (v?: string) => (v && v.length ? v : null);
  return {
    name: d.name, company: n(d.company), profession: n(d.profession), email: n(d.email), phone: n(d.phone),
    website: n(d.website), notes: n(d.notes), source: n(d.source), campaignId: n(d.campaignId), marketId: n(d.marketId),
    stage: d.stage, nextAction: n(d.nextAction),
    nextActionAt: d.nextActionAt ? new Date(d.nextActionAt).toISOString() : null,
    potentialValueCents: d.potentialValue !== undefined ? Math.round(d.potentialValue * 100) : null,
  };
}

export async function createProspect(_: FormState, form: FormData): Promise<FormState> {
  const s = await affiliateSession();
  const d = prospectSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return { error: d.error.issues.map((i) => i.path[0]).join(",") };
  await repo().createProspect(s, toProspectInput(d.data));
  refresh();
  return { ok: true };
}

export async function updateProspect(_: FormState, form: FormData): Promise<FormState> {
  const s = await affiliateSession();
  const id = z.string().min(1).parse(form.get("id"));
  const d = prospectSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return { error: d.error.issues.map((i) => i.path[0]).join(",") };
  await repo().updateProspect(s, id, toProspectInput(d.data));
  refresh();
  return { ok: true };
}

export async function moveProspect(id: string, stage: ProspectStage) {
  const s = await affiliateSession();
  if (!PROSPECT_STAGES.includes(stage)) throw new Error("invalid stage");
  await repo().updateProspect(s, id, { stage });
  refresh();
}

export async function deleteProspect(id: string) {
  const s = await affiliateSession();
  await repo().deleteProspect(s, id);
  refresh();
}

export async function markNotificationsRead() {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  await repo().markNotificationsRead(s);
  refresh();
}

/** Unread / read / archived. The row is always scoped to the session user (and RLS). */
export async function setNotificationStatus(form: FormData) {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  const id = z.string().min(1).max(64).parse(form.get("id"));
  const status = z.enum(["unread", "read", "archived"]).parse(form.get("status"));
  await repo().setNotificationStatus(s, id, status);
  refresh();
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  const fullName = z.string().trim().min(1).max(120).safeParse(form.get("fullName"));
  const displayName = z.string().trim().max(40).safeParse(form.get("displayName") ?? "");
  if (!fullName.success || !displayName.success) return { error: "invalid" };
  await repo().updateProfile(s, { fullName: fullName.data, displayName: displayName.data || null, leaderboardOptIn: form.get("leaderboardOptIn") === "on" });
  refresh();
  return { ok: true };
}

export async function setLeaderboardOptIn(optIn: boolean) {
  const s = await affiliateSession();
  await repo().updateProfile(s, { leaderboardOptIn: optIn });
  refresh();
}

export async function advanceOnboarding(step: number, completed = false) {
  const s = await affiliateSession();
  await repo().setOnboardingStep(s, step, completed);
  if (completed) refresh();
}

export async function exportMyData(): Promise<string> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return JSON.stringify(await repo().exportMyData(s), null, 2);
}

export async function requestErasure() {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  await repo().requestErasure(s);
}
