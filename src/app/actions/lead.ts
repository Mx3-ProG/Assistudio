"use server";
import { cookies } from "next/headers";
import { z } from "zod";
import { repo } from "@/lib/data";
import { REF_COOKIE, VISITOR_COOKIE, decodeRefCookie, resolveAttribution, isValidCode } from "@/lib/attribution";
import { isLocale } from "@/i18n/config";
import type { ReferralTarget } from "@/lib/data/types";
import { isDemoMode } from "@/lib/env";
import { resolveForConversion } from "@/lib/services/attribution";
import { kickEmailOutbox } from "@/lib/email/service";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional().default(""),
  profession: z.string().trim().max(120).optional().default(""),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  website: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().max(3000).optional().default(""),
  consent: z.literal("on"),
  locale: z.string(),
  page: z.string().optional().default(""),
  referral: z.string().trim().max(64).optional().default(""),
  requestType: z.enum(["info", "call", "question", "quote"]).optional(),
  advisorConsent: z.string().optional().transform((v) => v === "on"),
  // Honeypot: real users never fill it.
  company_url: z.string().max(0).optional().default(""),
});

export type LeadState = { status: "idle" | "success" | "error"; fields?: string[] };

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    // Honeypot hit → pretend success, store nothing.
    if (form.get("company_url")) return { status: "success" };
    return { status: "error", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  }
  const d = parsed.data;
  const locale = isLocale(d.locale) ? d.locale : "en";
  const r = repo();
  const jar = await cookies();
  const settings = await r.getSettings();

  // 1. Explicit context (private sales page) wins.
  let target: ReferralTarget | null = null;
  let privatePageId: string | null = null;
  if (d.page && isValidCode(d.page)) {
    const page = await r.getPrivatePage(d.page);
    if (page?.referral.active) {
      target = page.referral;
      privatePageId = page.id;
    }
  }

  // 2. Otherwise the server-side touches of this visitor, under the admin-configured
  //    model and window. The cookie only carries the visitor id; the demo store
  //    (no database) falls back to the signed-less cookie touches.
  const cookie = decodeRefCookie(jar.get(REF_COOKIE)?.value);
  const touch = resolveAttribution(cookie, settings.attributionModel, settings.attributionWindowDays);
  if (!target && !isDemoMode) {
    const a = await resolveForConversion({ sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null });
    if (a.affiliateId) {
      target = { affiliateId: a.affiliateId, affiliateCode: "", linkId: a.linkId, linkCode: null, campaignId: a.campaignId, displayName: null, active: true };
    }
  } else if (!target && touch) {
    const t = await r.resolveReferral(touch.link ?? touch.ref);
    if (t?.active) target = t;
  }

  // 3. The affiliate page carries its verified code as a deterministic fallback.
  //    It never overrides a private page or a tracked touch selected above.
  if (!target && d.referral && isValidCode(d.referral)) {
    const referral = await r.resolveReferral(d.referral);
    if (referral?.active) target = referral;
  }

  // TODO(security): add rate limiting / bot scoring (e.g. Vercel BotID) before launch.
  await r.createLead({
    fullName: d.fullName,
    company: d.company || null,
    profession: d.profession || null,
    email: d.email.toLowerCase(),
    phone: d.phone || null,
    website: d.website || null,
    message: d.message || null,
    locale,
    affiliateId: target?.affiliateId ?? null,
    linkId: target?.linkId ?? null,
    campaignId: target?.campaignId ?? null,
    privatePageId,
    visitorId: jar.get(VISITOR_COOKIE)?.value ?? null,
    attributionModel: target ? settings.attributionModel : null,
    firstClickAt: cookie?.first.at ?? null,
    lastClickAt: cookie?.last.at ?? null,
    utm: (touch?.utm ?? {}) as Record<string, string>,
    requestType: d.requestType ?? null,
    advisorConsent: d.advisorConsent,
  });
  await r.recordFunnelEvent({ event: "studio_lead_submitted", affiliateId: target?.affiliateId ?? null, locale, placement: "lead_form", meta: {} });
  kickEmailOutbox(); // lead.confirmation + affiliate.new_lead, queued by the leads trigger
  return { status: "success" };
}
