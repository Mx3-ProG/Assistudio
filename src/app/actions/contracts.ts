"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession, repo } from "@/lib/data";
import { isLocale, type Locale } from "@/i18n/config";
import { isOfferTier } from "@/lib/offers";
import {
  DOSSIER_COOKIE, acceptClient, affiliateReview, countersignDossier, createDossier,
  lockDossier, notifyDossierPayment, requestAdminChanges, requestClientOtp, saveClientBrief,
} from "@/lib/contracts/service";
import { createDossierCheckoutSession } from "@/lib/services/checkout";

const requiredSession = async () => { const s = await getSession(); if (!s) throw new Error("Unauthorized"); return s; };

export async function createDossierAction(form: FormData) {
  const parsed = z.object({ email: z.string().optional(), locale: z.string(), clientName: z.string().max(160).optional(), prospectId: z.string().uuid().optional().or(z.literal("")) }).parse(Object.fromEntries(form));
  if (!isLocale(parsed.locale)) throw new Error("Invalid locale");
  const session = await requiredSession();
  const prospect = parsed.prospectId ? (await repo().listProspects(session)).find((x) => x.id === parsed.prospectId) : null;
  const email = z.email().parse((parsed.email || prospect?.email || "").trim());
  const { dossier } = await createDossier(session, { email, locale: parsed.locale, clientName: parsed.clientName || prospect?.name || null, prospectId: prospect?.id || null });
  redirect(`/${session.locale}/dashboard/documents/${dossier.id}?created=1`);
}

export async function affiliateReviewAction(form: FormData) {
  const id = String(form.get("id") ?? ""); const action = String(form.get("action") ?? ""); const note = String(form.get("note") ?? "").trim();
  const tierRaw = String(form.get("tier") ?? "");
  if ((action !== "changes" && action !== "submit") || !id || note.length < 3 || (action === "submit" && !isOfferTier(tierRaw))) throw new Error("Invalid review");
  const session = await requiredSession();
  await affiliateReview(session, id, { action, note, tier: isOfferTier(tierRaw) ? tierRaw : undefined });
  revalidatePath(`/${session.locale}/dashboard/documents/${id}`);
}

export async function saveClientBriefAction(reference: string, json: string, submit = false) {
  const value = z.record(z.string(), z.unknown()).parse(JSON.parse(json));
  const jar = await cookies();
  await saveClientBrief(reference, jar.get(DOSSIER_COOKIE)?.value, value, submit);
  revalidatePath(`/dossier/${reference}`);
  return { savedAt: new Date().toISOString() };
}

export async function requestOtpAction(form: FormData) {
  const reference = String(form.get("reference") ?? ""); const jar = await cookies();
  await requestClientOtp(reference, jar.get(DOSSIER_COOKIE)?.value);
  revalidatePath(`/dossier/${reference}`);
}

export async function acceptClientAction(form: FormData) {
  const parsed = z.object({ reference: z.string().min(4), code: z.string().regex(/^\d{6}$/), name: z.string().min(2).max(160), title: z.string().min(2).max(160), mandatoryTerms: z.literal("on") }).parse(Object.fromEntries(form));
  const [jar, h] = await Promise.all([cookies(), headers()]);
  await acceptClient(parsed.reference, jar.get(DOSSIER_COOKIE)?.value, { code: parsed.code, name: parsed.name, title: parsed.title, mandatoryTerms: true, ip: h.get("x-forwarded-for")?.split(",")[0]?.trim(), userAgent: h.get("user-agent") ?? undefined });
  revalidatePath(`/dossier/${parsed.reference}`);
}

export async function lockDossierAction(form: FormData) {
  const values = Object.fromEntries(form); const tier = String(values.tier ?? ""); if (!isOfferTier(tier)) throw new Error("Invalid offer");
  const parsed = z.object({ id: z.string().uuid(), scope: z.string().min(10), promoCode: z.string().max(40).optional(), validDays: z.coerce.number().int().min(1).max(180), legalName: z.string().min(2), address: z.string().min(5), registration: z.string().min(2), representative: z.string().min(2), vatNumber: z.string().optional() }).parse(values);
  const session = await requiredSession();
  await lockDossier(session, parsed.id, { tier, scope: parsed.scope, promoCode: parsed.promoCode || null, validDays: parsed.validDays, legalIdentity: { legalName: parsed.legalName, address: parsed.address, registration: parsed.registration, representative: parsed.representative, vatNumber: parsed.vatNumber || null } });
  revalidatePath(`/${session.locale}/admin/contracts/${parsed.id}`);
}

export async function countersignDossierAction(form: FormData) {
  const parsed = z.object({ id: z.string().uuid(), signerName: z.string().min(2), signerTitle: z.string().min(2) }).parse(Object.fromEntries(form));
  const session = await requiredSession();
  await countersignDossier(session, parsed.id, parsed);
  const { url } = await createDossierCheckoutSession(parsed.id);
  await notifyDossierPayment(session, parsed.id, url);
  revalidatePath(`/${session.locale}/admin/contracts/${parsed.id}`);
}

export async function regenerateDossierCheckoutAction(form: FormData) {
  const id = z.string().uuid().parse(form.get("id")); const session = await requiredSession();
  const { url } = await createDossierCheckoutSession(id);
  await notifyDossierPayment(session, id, url);
  revalidatePath(`/${session.locale}/admin/contracts/${id}`);
}

export async function requestAdminChangesAction(form: FormData) {
  const parsed = z.object({ id: z.string().uuid(), note: z.string().min(3).max(2000) }).parse(Object.fromEntries(form));
  const session = await requiredSession(); await requestAdminChanges(session, parsed.id, parsed.note);
  revalidatePath(`/${session.locale}/admin/contracts/${parsed.id}`);
}

export async function localeFromForm(form: FormData): Promise<Locale> {
  const raw = String(form.get("locale") ?? "en"); return isLocale(raw) ? raw : "en";
}
