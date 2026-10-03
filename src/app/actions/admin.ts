"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import { isStaff } from "@/lib/auth";
import { locales } from "@/i18n/config";
import type { Session } from "@/lib/data/types";
import { kickEmailOutbox } from "@/lib/email/service";
import { email } from "@/lib/email";
import { renderEmail } from "@/lib/email/templates";
import { env } from "@/lib/env";

/**
 * Staff actions. Every financial or attribution change requires a reason and
 * is written to the audit log (SQL functions in production, demo store in dev).
 */
async function staff(): Promise<Session> {
  const s = await getSession();
  if (!isStaff(s)) throw new Error("Forbidden");
  return s!;
}
const reason = (f: FormData) => z.string().trim().min(3).max(500).parse(f.get("reason"));
const id = (f: FormData, k = "id") => z.string().min(1).max(100).parse(f.get(k));
const done = () => revalidatePath("/[locale]/admin", "layout");

export type AdminState = { ok?: boolean; error?: string };
async function run(fn: () => Promise<unknown>): Promise<AdminState> {
  try {
    await fn();
    done();
    kickEmailOutbox(); // approvals, payouts, releases… queue emails in the same transaction
    return { ok: true };
  } catch (e) {
    return { error: e instanceof z.ZodError ? "reason_required" : e instanceof Error ? e.message : "error" };
  }
}

export async function setAffiliateStatus(_: AdminState, f: FormData) {
  const s = await staff();
  const status = z.enum(["approved", "rejected", "suspended", "pending"]).parse(f.get("status"));
  return run(() => repo().adminSetAffiliateStatus(s, id(f), status, reason(f)));
}

export async function setSaleStatus(_: AdminState, f: FormData) {
  const s = await staff();
  const status = z.enum(["paid", "refunded", "chargeback", "cancelled", "failed"]).parse(f.get("status"));
  return run(() => repo().adminSetSaleStatus(s, id(f), status, reason(f)));
}

export async function correctAttribution(_: AdminState, f: FormData) {
  const s = await staff();
  return run(() => repo().adminCorrectAttribution(s, id(f), id(f, "affiliateId"), reason(f)));
}

export async function commissionAction(_: AdminState, f: FormData) {
  const s = await staff();
  const op = z.enum(["dispute", "undispute", "reverse", "validate"]).parse(f.get("op"));
  return run(() =>
    op === "reverse" ? repo().adminReverseCommission(s, id(f), reason(f))
      : op === "validate" ? repo().adminValidateCommission(s, id(f), reason(f))
      : repo().adminHoldCommission(s, id(f), op === "dispute", reason(f)),
  );
}

/** Manual ledger entry (bonus, correction, write-off). Never silent: reason + audit log. */
export async function adjustLedger(_: AdminState, f: FormData) {
  const s = await staff();
  const amount = z.coerce.number().int().refine((n) => n !== 0 && Math.abs(n) <= 100_000_000).parse(f.get("amountCents"));
  const currency = z.string().regex(/^[A-Z]{3}$/).parse(String(f.get("currency") ?? "EUR").toUpperCase());
  return run(() => repo().adminAdjustLedger(s, id(f, "affiliateId"), amount, currency, reason(f)));
}

export async function releaseDue() {
  const s = await staff();
  await repo().adminReleaseDue(s);
  done();
  kickEmailOutbox();
}

export async function createPayout(_: AdminState, f: FormData) {
  const s = await staff();
  return run(() => repo().adminCreatePayout(s, id(f, "affiliateId")));
}

export async function markPayoutPaid(_: AdminState, f: FormData) {
  const s = await staff();
  const ref = z.string().trim().min(3).max(120).parse(f.get("providerRef"));
  return run(() => repo().adminMarkPayoutPaid(s, id(f), ref));
}

export async function reviewFraud(_: AdminState, f: FormData) {
  const s = await staff();
  const status = z.enum(["reviewing", "dismissed", "confirmed"]).parse(f.get("status"));
  return run(() => repo().adminReviewFraudFlag(s, id(f), status, reason(f)));
}

export async function updateSettings(_: AdminState, f: FormData) {
  const s = await staff();
  const d = z.object({
    attributionWindowDays: z.coerce.number().int().min(1).max(730),
    attributionModel: z.enum(["first_click", "last_click", "manual"]),
    refundPartialPolicy: z.enum(["manual_review", "proportional", "full_reversal"]),
    billingEmailsOwner: z.enum(["stripe", "studio"]),
    commissionValidationDays: z.coerce.number().int().min(0).max(365),
    payoutMinimumEuros: z.coerce.number().min(0).max(100_000),
    studioMonthlyCapacity: z.coerce.number().int().min(0).max(100),
    studioRemainingCapacity: z.coerce.number().int().min(0).max(100),
    studioNextOnboardingWindow: z.string().trim().max(80),
  }).parse(Object.fromEntries(f));
  return run(() => repo().adminUpdateSettings(s, {
    attributionWindowDays: d.attributionWindowDays,
    attributionModel: d.attributionModel,
    commissionValidationDays: d.commissionValidationDays,
    payoutMinimumCents: Math.round(d.payoutMinimumEuros * 100),
    leaderboardEnabled: f.get("leaderboardEnabled") === "on",
    refundPartialPolicy: d.refundPartialPolicy,
    billingEmailsOwner: d.billingEmailsOwner,
    connectEnabled: f.get("connectEnabled") === "on",
    checkoutEnabled: f.get("checkoutEnabled") === "on",
    studioCapacityEnabled: f.get("studioCapacityEnabled") === "on",
    studioMonthlyCapacity: d.studioMonthlyCapacity,
    studioRemainingCapacity: Math.min(d.studioRemainingCapacity, d.studioMonthlyCapacity),
    studioNextOnboardingWindow: d.studioNextOnboardingWindow,
  }));
}

export async function updateMarket(_: AdminState, f: FormData) {
  const s = await staff();
  const locale = z.enum(locales).parse(f.get("locale"));
  const t = (k: string) => z.string().trim().min(1).max(2000).parse(f.get(k));
  const lines = (k: string, max = 12, sep: RegExp = /\n/) => String(f.get(k) ?? "").split(sep).map((x) => x.trim()).filter(Boolean).slice(0, max).map((x) => x.slice(0, 400));
  const opt = <T,>(xs: T[]) => (xs.length ? xs : undefined);
  const avoid = String(f.get("avoid") ?? "").trim().slice(0, 1000);
  const offer = z.enum(["one", "pro", "premium"]).optional().catch(undefined).parse(f.get("offer") || undefined);
  // Every field the editor shows is written back, so a save never drops the
  // Sales Center / copilot fields (pains, discovery, keywords…).
  const content = {
    name: t("name"), who: t("who"), why: t("why"), problem: t("problem"), angle: t("angle"), message: t("message"),
    searches: String(f.get("searches") ?? "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 10),
    pains: opt(lines("pains")), needs: opt(lines("needs")), outcomes: opt(lines("outcomes")), discovery: opt(lines("discovery")),
    avoid: avoid || undefined, keywords: opt(lines("keywords", 60, /[\n,]/)), offer,
  };
  return run(() => repo().adminUpdateMarket(s, id(f), locale, content, f.get("active") === "on"));
}

export async function createSaleFromLead(_: AdminState, f: FormData) {
  const s = await staff();
  return run(() => repo().adminCreateSaleFromLead(s, id(f), reason(f)));
}

export type EmailTestState = { status: "idle" | "sent" | "failed"; to?: string; id?: string | null; error?: string };

/** Sends a test email to the signed-in staff member and reports the provider's exact answer. */
export async function sendTestEmail(_: EmailTestState, f: FormData): Promise<EmailTestState> {
  const s = await staff();
  const locale = locales.find((l) => l === f.get("locale")) ?? "en";
  try {
    const rendered = renderEmail("system.test", {}, { locale, appUrl: env.siteUrl });
    const res = await email.send({ to: s.email, ...rendered, tags: [{ name: "template", value: "system_test" }] });
    return { status: "sent", to: s.email, id: res.id };
  } catch (e) {
    return { status: "failed", to: s.email, error: (e instanceof Error ? e.message : String(e)).slice(0, 400) };
  }
}
