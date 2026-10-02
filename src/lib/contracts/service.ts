import "server-only";
import { randomUUID } from "node:crypto";
import type { Locale } from "@/i18n/config";
import type { CommercialDossier, DossierAcceptance, DossierDocument, DossierOfferSnapshot, DossierStatus, Session } from "@/lib/data/types";
import { OFFER_LOOKUP_KEYS, offerLookupKey, type BillingCadence, type OfferTier } from "@/lib/offers";
import { isDemoMode } from "@/lib/env";
import { queueDirectEmail } from "@/lib/email/service";
import { supabaseService } from "@/lib/supabase/server";
import { briefHtml, proofHtml, quoteHtml, renderPdf } from "./pdf";
import { DOSSIER_COOKIE, evidenceHash, randomOtp, randomToken, manifestHash, safeHashEqual, sha256 } from "./security";
import { briefSections, contractCopy } from "@/content/contracts";

type Json = Record<string, unknown>;
type LegalIdentity = DossierOfferSnapshot["legalIdentity"];

export class DossierError extends Error {
  constructor(public code: string) { super(code); }
}

const now = () => new Date().toISOString();
const addMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const addDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

function documentFrom(row: Json): DossierDocument {
  return { id: String(row.id), kind: row.kind as DossierDocument["kind"], revision: Number(row.revision), sha256: String(row.sha256), byteSize: Number(row.byte_size), createdAt: String(row.created_at) };
}

function acceptanceFrom(row: Json): DossierAcceptance {
  return { party: row.party as "client" | "studio", signerName: String(row.signer_name), signerEmail: String(row.signer_email), signerTitle: row.signer_title ? String(row.signer_title) : null, acceptedAt: String(row.accepted_at), manifestSha256: String(row.manifest_sha256), otpVerified: Boolean(row.otp_verified) };
}

async function hydrate(row: Json): Promise<CommercialDossier> {
  if (isDemoMode) return mapDossier(row, [], [], row.answers as Json ?? {});
  const sb = supabaseService();
  const revision = Number(row.current_revision ?? 0);
  const [{ data: brief }, { data: docs }, { data: acceptances }] = await Promise.all([
    revision ? sb.from("dossier_brief_revisions").select("answers").eq("dossier_id", row.id).eq("revision", revision).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("dossier_documents").select("id,kind,revision,sha256,byte_size,created_at").eq("dossier_id", row.id).order("created_at"),
    sb.from("dossier_acceptances").select("party,signer_name,signer_email,signer_title,accepted_at,manifest_sha256,otp_verified").eq("dossier_id", row.id).order("accepted_at"),
  ]);
  return mapDossier(row, (docs ?? []).map((x) => documentFrom(x as Json)), (acceptances ?? []).map((x) => acceptanceFrom(x as Json)), (brief?.answers as Json) ?? {});
}

function mapDossier(row: Json, documents: DossierDocument[], acceptances: DossierAcceptance[], answers: Json): CommercialDossier {
  return {
    id: String(row.id), ref: String(row.public_ref), affiliateId: String(row.affiliate_id), affiliateName: row.affiliate_name ? String(row.affiliate_name) : null,
    prospectId: row.prospect_id ? String(row.prospect_id) : null, leadId: row.lead_id ? String(row.lead_id) : null,
    clientEmail: String(row.client_email), clientName: row.client_name ? String(row.client_name) : null,
    clientCompany: row.client_company ? String(row.client_company) : null, clientJobTitle: row.client_job_title ? String(row.client_job_title) : null,
    locale: row.locale as Locale, status: row.status as DossierStatus, currentRevision: Number(row.current_revision ?? 0), answers,
    sharedWithAffiliateAt: row.shared_with_affiliate_at ? String(row.shared_with_affiliate_at) : null,
    recommendedTier: (row.recommended_tier as OfferTier | null) ?? null, affiliateNote: row.affiliate_note ? String(row.affiliate_note) : null,
    adminScope: row.admin_scope ? String(row.admin_scope) : null, offerSnapshot: (row.offer_snapshot as DossierOfferSnapshot | null) ?? null,
    validUntil: row.valid_until ? String(row.valid_until) : null, manifestSha256: row.manifest_sha256 ? String(row.manifest_sha256) : null,
    stripeCheckoutUrl: row.stripe_checkout_url ? String(row.stripe_checkout_url) : null, paidAt: row.paid_at ? String(row.paid_at) : null,
    documents, acceptances, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

const demoRows: Json[] = [];
const demoTokens = new Map<string, { dossierId: string; purpose: "access" | "session" | "otp"; expires: number; otp?: string; used?: boolean; attempts: number }>();

function ensureAffiliate(session: Session): string {
  if (!session.affiliate) throw new DossierError("affiliate_required");
  return session.affiliate.id;
}

function ensureStaff(session: Session): void {
  if (session.role !== "admin" && session.role !== "super_admin") throw new DossierError("staff_required");
}

async function event(dossierId: string, name: string, actor: "client" | "affiliate" | "staff" | "system", actorId: string | null, payload: Json = {}) {
  if (!isDemoMode) await supabaseService().from("dossier_events").insert({ dossier_id: dossierId, event: name, actor_type: actor, actor_id: actorId, payload });
}

async function issueAccess(dossier: CommercialDossier, template: "dossier.invite" | "dossier.changes_requested" | "dossier.ready_to_accept" | "dossier.payment" | "dossier.active", extra: Json = {}) {
  const token = randomToken();
  if (isDemoMode) demoTokens.set(token, { dossierId: dossier.id, purpose: "access", expires: Date.now() + 48 * 3_600_000, attempts: 0 });
  else await supabaseService().from("dossier_access_tokens").insert({ dossier_id: dossier.id, purpose: "access", token_hash: sha256(token), expires_at: addMinutes(48 * 60) });
  const accessPath = `/${dossier.locale}/dossier/${dossier.ref}?token=${encodeURIComponent(token)}`;
  await queueDirectEmail({ to: dossier.clientEmail, locale: dossier.locale, template, key: `${template}:${dossier.id}:${dossier.currentRevision}:${dossier.status}`, dossierId: dossier.id, params: { client_name: dossier.clientName ?? "", reference: dossier.ref, dossier_ref: dossier.ref, access_path: accessPath, ...extra } });
  return accessPath;
}

export async function listAffiliateDossiers(session: Session): Promise<CommercialDossier[]> {
  const affiliateId = ensureAffiliate(session);
  if (isDemoMode) return (await Promise.all(demoRows.filter((x) => x.affiliate_id === affiliateId).map(hydrate))).map((d) => d.sharedWithAffiliateAt ? d : { ...d, answers: {} });
  const { data, error } = await supabaseService().from("commercial_dossiers").select("*").eq("affiliate_id", affiliateId).is("deleted_at", null).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (await Promise.all((data ?? []).map((x) => hydrate(x as Json)))).map((d) => d.sharedWithAffiliateAt ? d : { ...d, answers: {} });
}

export async function listAdminDossiers(session: Session): Promise<CommercialDossier[]> {
  ensureStaff(session);
  if (isDemoMode) return Promise.all(demoRows.map(hydrate));
  const { data, error } = await supabaseService().from("commercial_dossiers").select("*").is("deleted_at", null).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Promise.all((data ?? []).map((x) => hydrate(x as Json)));
}

/** Staff: dossiers without documents/answers (cheap), optionally for one affiliate. Used by the network pages. */
export async function listAdminDossierSummaries(session: Session, affiliateId?: string): Promise<CommercialDossier[]> {
  ensureStaff(session);
  if (isDemoMode) return demoRows.filter((x) => !affiliateId || x.affiliate_id === affiliateId).map((x) => mapDossier(x, [], [], {}));
  let q = supabaseService().from("commercial_dossiers").select("*").is("deleted_at", null).order("updated_at", { ascending: false });
  if (affiliateId) q = q.eq("affiliate_id", affiliateId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((x) => mapDossier(x as Json, [], [], {}));
}

/** Statuses where Studio ATS staff must act on a dossier. */
export const STAFF_DOSSIER_STATUSES: DossierStatus[] = ["admin_review", "awaiting_studio_acceptance"];

export async function getDossierForUser(session: Session, id: string): Promise<CommercialDossier | null> {
  const rows = session.role === "admin" || session.role === "super_admin" ? await listAdminDossiers(session) : await listAffiliateDossiers(session);
  return rows.find((x) => x.id === id) ?? null;
}

export async function getStudioLegalIdentity(session: Session): Promise<LegalIdentity> {
  ensureStaff(session);
  if (isDemoMode) return { legalName: "", address: "", registration: "", representative: "", vatNumber: "" };
  const { data } = await supabaseService().from("settings").select("value").eq("key", "studio.legal_identity").maybeSingle();
  const value = (data?.value as Partial<LegalIdentity> | null) ?? {};
  return { legalName: value.legalName ?? "", address: value.address ?? "", registration: value.registration ?? "", representative: value.representative ?? "", vatNumber: value.vatNumber ?? "" };
}

export async function createDossier(session: Session, input: { email: string; locale: Locale; prospectId?: string | null; clientName?: string | null }) {
  const affiliateId = ensureAffiliate(session);
  let dossier: CommercialDossier;
  if (isDemoMode) {
    const stamp = now();
    const row: Json = { id: randomUUID(), public_ref: `DOS-${randomToken().slice(0, 8).toUpperCase()}`, affiliate_id: affiliateId, prospect_id: input.prospectId ?? null, lead_id: null, client_email: input.email.toLowerCase(), client_name: input.clientName ?? null, client_company: null, client_job_title: null, locale: input.locale, status: "awaiting_client", current_revision: 0, created_by: session.userId, created_at: stamp, updated_at: stamp, answers: {} };
    demoRows.unshift(row); dossier = await hydrate(row);
  } else {
    const { data, error } = await supabaseService().from("commercial_dossiers").insert({ affiliate_id: affiliateId, prospect_id: input.prospectId ?? null, client_email: input.email.toLowerCase(), client_name: input.clientName ?? null, locale: input.locale, status: "awaiting_client", created_by: session.userId }).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "dossier_create_failed");
    dossier = await hydrate(data as Json);
  }
  const accessPath = await issueAccess(dossier, "dossier.invite");
  await event(dossier.id, "invitation_sent", "affiliate", session.userId);
  return { dossier, accessPath };
}

export async function exchangeAccessToken(reference: string, raw: string): Promise<{ sessionToken: string; dossier: CommercialDossier } | null> {
  if (isDemoMode) {
    const token = demoTokens.get(raw); const row = demoRows.find((x) => x.id === token?.dossierId && x.public_ref === reference);
    if (!token || token.used || token.purpose !== "access" || token.expires < Date.now() || !row) return null;
    token.used = true; const sessionToken = randomToken(); demoTokens.set(sessionToken, { dossierId: String(row.id), purpose: "session", expires: Date.now() + 7 * 86_400_000, attempts: 0 });
    return { sessionToken, dossier: await hydrate(row) };
  }
  const sb = supabaseService();
  const { data: access } = await sb.from("dossier_access_tokens").select("id,dossier_id,expires_at,used_at,commercial_dossiers!inner(*)").eq("token_hash", sha256(raw)).eq("purpose", "access").maybeSingle();
  const nested = access?.commercial_dossiers as unknown as Json | undefined;
  if (!access || access.used_at || new Date(access.expires_at).getTime() < Date.now() || nested?.public_ref !== reference) return null;
  const { data: used } = await sb.from("dossier_access_tokens").update({ used_at: now() }).eq("id", access.id).is("used_at", null).select("id").maybeSingle();
  if (!used) return null;
  const sessionToken = randomToken();
  await sb.from("dossier_access_tokens").insert({ dossier_id: access.dossier_id, purpose: "session", token_hash: sha256(sessionToken), expires_at: addMinutes(7 * 24 * 60) });
  return { sessionToken, dossier: await hydrate(nested) };
}

export async function getClientDossier(reference: string, rawSession: string | undefined): Promise<CommercialDossier | null> {
  if (!rawSession) return null;
  if (isDemoMode) {
    const token = demoTokens.get(rawSession); const row = demoRows.find((x) => x.id === token?.dossierId && x.public_ref === reference);
    return token?.purpose === "session" && !token.used && token.expires > Date.now() && row ? hydrate(row) : null;
  }
  const { data: token } = await supabaseService().from("dossier_access_tokens").select("dossier_id,expires_at,used_at").eq("token_hash", sha256(rawSession)).eq("purpose", "session").maybeSingle();
  if (!token || token.used_at || new Date(token.expires_at).getTime() < Date.now()) return null;
  const { data } = await supabaseService().from("commercial_dossiers").select("*").eq("id", token.dossier_id).eq("public_ref", reference).maybeSingle();
  return data ? hydrate(data as Json) : null;
}

async function clientDossierOrThrow(reference: string, rawSession: string | undefined) {
  const dossier = await getClientDossier(reference, rawSession);
  if (!dossier) throw new DossierError("client_session_invalid");
  return dossier;
}

export async function saveClientBrief(reference: string, rawSession: string | undefined, answers: Json, submit: boolean) {
  const dossier = await clientDossierOrThrow(reference, rawSession);
  if (!["awaiting_client", "changes_requested"].includes(dossier.status)) throw new DossierError("stale_dossier_state");
  if (submit) {
    const missing = briefSections(dossier.locale).flatMap((section) => section.fields)
      .filter((field) => field.required && (answers[field.key] === undefined || answers[field.key] === "" || (Array.isArray(answers[field.key]) && !(answers[field.key] as unknown[]).length)));
    const confirmations = Array.isArray(answers["validation.confirmations"]) ? answers["validation.confirmations"] as string[] : [];
    if (missing.length || !["reviewed", "priorities_correct", "out_of_scope_quote", "provide_content", "share_with_affiliate"].every((x) => confirmations.includes(x))) {
      throw new DossierError("brief_incomplete");
    }
  }
  const revision = dossier.currentRevision || 1;
  if (isDemoMode) {
    const row = demoRows.find((x) => x.id === dossier.id)!; row.answers = answers; row.current_revision = revision; row.updated_at = now();
    if (submit) { row.status = "affiliate_review"; row.shared_with_affiliate_at = now(); }
  } else {
    const sb = supabaseService();
    await sb.from("dossier_brief_revisions").upsert({ dossier_id: dossier.id, revision, answers, submitted_at: submit ? now() : null }, { onConflict: "dossier_id,revision" });
    const client = answers.identity as Json | undefined;
    const patch: Json = { current_revision: revision, ...(client ? { client_name: client.contactName ?? dossier.clientName, client_company: client.companyName ?? dossier.clientCompany, client_job_title: client.jobTitle ?? dossier.clientJobTitle } : {}) };
    if (submit) Object.assign(patch, { status: "affiliate_review", shared_with_affiliate_at: now() });
    const { data } = await sb.from("commercial_dossiers").update(patch).eq("id", dossier.id).in("status", ["awaiting_client", "changes_requested"]).select("id").maybeSingle();
    if (!data) throw new DossierError("stale_dossier_state");
  }
  await event(dossier.id, submit ? "brief_submitted" : "brief_autosaved", "client", null, { revision });
}

export async function affiliateReview(session: Session, id: string, input: { action: "changes" | "submit"; note: string; tier?: OfferTier }) {
  const dossier = await getDossierForUser(session, id); if (!dossier) throw new DossierError("not_found");
  if (dossier.status !== "affiliate_review") throw new DossierError("stale_dossier_state");
  const status = input.action === "changes" ? "changes_requested" : "admin_review";
  if (input.action === "submit" && !input.tier) throw new DossierError("tier_required");
  if (isDemoMode) { const row = demoRows.find((x) => x.id === id)!; Object.assign(row, { status, affiliate_note: input.note, recommended_tier: input.tier ?? null, updated_at: now() }); }
  else {
    const { data } = await supabaseService().from("commercial_dossiers").update({ status, affiliate_note: input.note, recommended_tier: input.tier ?? null }).eq("id", id).eq("status", "affiliate_review").select("id").maybeSingle();
    if (!data) throw new DossierError("stale_dossier_state");
  }
  if (input.action === "changes") await issueAccess({ ...dossier, status }, "dossier.changes_requested", { comment: input.note });
  await event(id, input.action === "changes" ? "changes_requested" : "sent_to_admin", "affiliate", session.userId, { note: input.note, tier: input.tier });
}

async function publishedTemplate(locale: Locale) {
  const { data } = await supabaseService().from("contract_templates").select("*").eq("kind", "quote_terms").eq("locale", locale).eq("status", "published").maybeSingle();
  if (!data) throw new DossierError("legal_template_not_published");
  return data as unknown as Json;
}

async function insertPdf(dossier: CommercialDossier, kind: DossierDocument["kind"], buffer: Buffer) {
  const path = `${dossier.id}/r${dossier.currentRevision}/${kind}-${sha256(buffer).slice(0, 16)}.pdf`;
  const sb = supabaseService();
  const uploaded = await sb.storage.from("commercial-dossiers").upload(path, buffer, { contentType: "application/pdf", upsert: false });
  if (uploaded.error) throw new Error(`pdf_upload_failed:${uploaded.error.message}`);
  const { data, error } = await sb.from("dossier_documents").insert({ dossier_id: dossier.id, kind, revision: dossier.currentRevision, storage_path: path, sha256: sha256(buffer), byte_size: buffer.byteLength }).select("*").single();
  if (error) throw new Error(error.message);
  return data as unknown as Json;
}

export async function lockDossier(session: Session, id: string, input: { tier: OfferTier; cadence: BillingCadence; scope: string; promoCode?: string | null; validDays?: number; legalIdentity: LegalIdentity }) {
  ensureStaff(session);
  if (isDemoMode) throw new DossierError("requires_supabase");
  const dossier = await getDossierForUser(session, id); if (!dossier || dossier.status !== "admin_review") throw new DossierError("stale_dossier_state");
  for (const value of [input.legalIdentity.legalName, input.legalIdentity.address, input.legalIdentity.registration, input.legalIdentity.representative]) if (!value.trim()) throw new DossierError("legal_identity_incomplete");
  const sb = supabaseService();
  await sb.from("settings").upsert({ key: "studio.legal_identity", value: input.legalIdentity, is_public: false, description: "Required legal identity printed on contract documents", updated_by: session.userId });
  const [{ data: offer }, template, { data: briefTemplate }] = await Promise.all([
    sb.from("offers").select("id,name,product_id,price_cents,currency,price_type,billing_interval,interval_count,stripe_price_id,stripe_lookup_key").eq("is_active", true).eq("stripe_lookup_key", offerLookupKey(input.tier, input.cadence)).maybeSingle(),
    publishedTemplate(dossier.locale),
    sb.from("contract_templates").select("id,version").eq("kind", "brief").eq("locale", dossier.locale).eq("status", "published").maybeSingle(),
  ]);
  if (!briefTemplate) throw new DossierError("legal_template_not_published");
  if (!offer || !offer.stripe_price_id || !offer.stripe_lookup_key) throw new DossierError("active_offer_missing");
  let discountRate = 0; let promoId: string | null = null;
  if (input.promoCode) {
    const { data: promo } = await sb.from("affiliate_promo_codes").select("id,discount_rate").eq("code", input.promoCode.toUpperCase()).eq("affiliate_id", dossier.affiliateId).eq("is_active", true).maybeSingle();
    if (!promo) throw new DossierError("promo_invalid"); promoId = promo.id; discountRate = Number(promo.discount_rate);
  }
  const discountCents = Math.round(Number(offer.price_cents) * discountRate);
  const snapshot: DossierOfferSnapshot = { offerId: offer.id, tier: input.tier, name: offer.name, priceCents: Number(offer.price_cents), currency: offer.currency, interval: offer.billing_interval, stripePriceId: offer.stripe_price_id, stripeLookupKey: offer.stripe_lookup_key, promoCode: input.promoCode?.toUpperCase() ?? null, discountRate, discountCents, totalCents: Number(offer.price_cents) - discountCents, lockedAt: now(), legalIdentity: input.legalIdentity };
  const locked = { ...dossier, adminScope: input.scope, offerSnapshot: snapshot, validUntil: addDays(input.validDays ?? 30) };
  const clauses = ((template.body as Json).clauses as string[]) ?? [];
  const [briefPdf, quotePdf] = await Promise.all([renderPdf(briefHtml(locked)), renderPdf(quoteHtml(locked, clauses))]);
  const [briefDoc, quoteDoc] = await Promise.all([insertPdf(locked, "brief", briefPdf), insertPdf(locked, "quote", quotePdf)]);
  const manifest = manifestHash({ dossierId: id, revision: dossier.currentRevision, briefHash: String(briefDoc.sha256), quoteHash: String(quoteDoc.sha256), locale: dossier.locale, templateId: `${briefTemplate.id}:${template.id}`, templateVersion: Math.max(Number(briefTemplate.version), Number(template.version)), offerSnapshot: snapshot });
  const { data } = await sb.from("commercial_dossiers").update({ status: "awaiting_client_acceptance", admin_scope: input.scope, offer_id: offer.id, offer_snapshot: snapshot, template_id: template.id, valid_until: locked.validUntil, manifest_sha256: manifest }).eq("id", id).eq("status", "admin_review").select("*").maybeSingle();
  if (!data) throw new DossierError("stale_dossier_state");
  await issueAccess(await hydrate(data as Json), "dossier.ready_to_accept");
  await event(id, "documents_locked", "staff", session.userId, { manifest, template_version: template.version, promo_id: promoId });
}

export async function requestClientOtp(reference: string, rawSession: string | undefined) {
  const dossier = await clientDossierOrThrow(reference, rawSession);
  if (dossier.status !== "awaiting_client_acceptance") throw new DossierError("stale_dossier_state");
  if (dossier.validUntil && dossier.validUntil < new Date().toISOString().slice(0, 10)) {
    if (!isDemoMode) await supabaseService().from("commercial_dossiers").update({ status: "expired" }).eq("id", dossier.id).eq("status", "awaiting_client_acceptance");
    await event(dossier.id, "dossier_expired", "system", null); throw new DossierError("dossier_expired");
  }
  const code = randomOtp();
  if (isDemoMode) demoTokens.set(`otp:${dossier.id}`, { dossierId: dossier.id, purpose: "otp", expires: Date.now() + 600_000, otp: sha256(`${dossier.id}:${code}`), attempts: 0 });
  else {
    const sb = supabaseService();
    const [{ data: latest }, { count }] = await Promise.all([
      sb.from("dossier_access_tokens").select("created_at").eq("dossier_id", dossier.id).eq("purpose", "otp").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("dossier_access_tokens").select("id", { count: "exact", head: true }).eq("dossier_id", dossier.id).eq("purpose", "otp").gte("created_at", new Date(Date.now() - 3_600_000).toISOString()),
    ]);
    if (latest && Date.now() - new Date(latest.created_at).getTime() < 60_000) throw new DossierError("otp_rate_limited");
    if ((count ?? 0) >= 5) throw new DossierError("otp_rate_limited");
    await sb.from("dossier_access_tokens").insert({ dossier_id: dossier.id, purpose: "otp", token_hash: sha256(randomToken()), otp_hash: sha256(`${dossier.id}:${code}`), expires_at: addMinutes(10), max_attempts: 5 });
  }
  await queueDirectEmail({ to: dossier.clientEmail, locale: dossier.locale, template: "dossier.otp", key: `otp:${dossier.id}:${Date.now()}`, dossierId: dossier.id, params: { otp: code, dossier_ref: dossier.ref } });
}

export async function acceptClient(reference: string, rawSession: string | undefined, input: { code: string; name: string; title: string; mandatoryTerms: boolean; ip?: string; userAgent?: string }) {
  const dossier = await clientDossierOrThrow(reference, rawSession);
  if (dossier.status !== "awaiting_client_acceptance" || !dossier.manifestSha256 || !input.mandatoryTerms) throw new DossierError("acceptance_not_allowed");
  if (dossier.validUntil && dossier.validUntil < new Date().toISOString().slice(0, 10)) {
    if (!isDemoMode) await supabaseService().from("commercial_dossiers").update({ status: "expired" }).eq("id", dossier.id).eq("status", "awaiting_client_acceptance");
    await event(dossier.id, "dossier_expired", "system", null); throw new DossierError("dossier_expired");
  }
  const expected = sha256(`${dossier.id}:${input.code}`);
  if (isDemoMode) {
    const otp = demoTokens.get(`otp:${dossier.id}`); if (!otp || otp.expires < Date.now() || otp.attempts >= 5 || !otp.otp || !safeHashEqual(otp.otp, expected)) { if (otp) otp.attempts++; throw new DossierError("otp_invalid"); } otp.used = true;
    const row = demoRows.find((x) => x.id === dossier.id)!; row.status = "awaiting_studio_acceptance";
  } else {
    const sb = supabaseService();
    const { data: otp } = await sb.from("dossier_access_tokens").select("*").eq("dossier_id", dossier.id).eq("purpose", "otp").is("used_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!otp || new Date(otp.expires_at).getTime() < Date.now() || otp.attempts >= otp.max_attempts || !otp.otp_hash || !safeHashEqual(otp.otp_hash, expected)) {
      if (otp) await sb.from("dossier_access_tokens").update({ attempts: otp.attempts + 1 }).eq("id", otp.id); throw new DossierError("otp_invalid");
    }
    const { data, error } = await sb.rpc("dossier_accept_client", { p_dossier: dossier.id, p_manifest: dossier.manifestSha256, p_otp: otp.id, p_otp_hash: expected, p_name: input.name, p_email: dossier.clientEmail, p_title: input.title, p_ip_hash: evidenceHash(input.ip ?? null), p_user_agent_hash: evidenceHash(input.userAgent ?? null) });
    if (error || !data) throw new DossierError("stale_dossier_state");
  }
  await event(dossier.id, "client_accepted", "client", null, { manifest: dossier.manifestSha256 });
}

export async function countersignDossier(session: Session, id: string, input: { signerName: string; signerTitle: string }) {
  ensureStaff(session);
  if (isDemoMode) throw new DossierError("requires_supabase");
  const dossier = await getDossierForUser(session, id); if (!dossier || dossier.status !== "awaiting_studio_acceptance" || !dossier.manifestSha256) throw new DossierError("stale_dossier_state");
  const sb = supabaseService();
  const { data: accepted, error } = await sb.rpc("dossier_countersign", { p_dossier: id, p_manifest: dossier.manifestSha256, p_profile: session.userId, p_name: input.signerName, p_email: session.email, p_title: input.signerTitle });
  if (error || !accepted) throw new DossierError("stale_dossier_state");
  const { data } = await sb.from("commercial_dossiers").select("*").eq("id", id).single();
  const signed = await hydrate(data as Json);
  const proof = await renderPdf(proofHtml(signed, signed.acceptances));
  await insertPdf(signed, "proof", proof);
  await event(id, "studio_countersigned", "staff", session.userId, { manifest: dossier.manifestSha256 });
  return signed;
}

export async function requestAdminChanges(session: Session, id: string, note: string) {
  ensureStaff(session); if (isDemoMode) throw new DossierError("requires_supabase");
  const { data: revision, error } = await supabaseService().rpc("dossier_request_revision", { p_dossier: id, p_profile: session.userId });
  if (error || !revision) throw new DossierError("stale_dossier_state");
  const dossier = await getDossierForUser(session, id); if (!dossier) throw new DossierError("not_found");
  await issueAccess(dossier, "dossier.changes_requested", { comment: note });
  await event(id, "new_revision_requested", "staff", session.userId, { note, revision });
}

export async function setCheckoutOnDossier(id: string, checkoutId: string, stripeId: string, url: string) {
  await supabaseService().from("commercial_dossiers").update({ checkout_session_id: checkoutId, stripe_checkout_session_id: stripeId, stripe_checkout_url: url }).eq("id", id).eq("status", "awaiting_payment");
}

export async function notifyDossierPayment(session: Session, id: string, paymentUrl: string) {
  ensureStaff(session);
  const dossier = await getDossierForUser(session, id);
  if (!dossier || dossier.status !== "awaiting_payment") throw new DossierError("stale_dossier_state");
  await queueDirectEmail({ to: dossier.clientEmail, locale: dossier.locale, template: "dossier.payment", key: `dossier.payment:${id}:${dossier.manifestSha256}`, dossierId: id, params: { reference: dossier.ref, payment_url: paymentUrl } });
  await event(id, "payment_link_sent", "staff", session.userId);
}

export async function activateDossierAfterPayment(stripeSessionId: string) {
  if (isDemoMode) return;
  const sb = supabaseService();
  const { data } = await sb.from("commercial_dossiers").update({ status: "active", paid_at: now() }).eq("stripe_checkout_session_id", stripeSessionId).eq("status", "awaiting_payment").select("*").maybeSingle();
  if (!data) return;
  const dossier = await hydrate(data as Json);
  await issueAccess(dossier, "dossier.active");
  await event(dossier.id, "payment_confirmed", "system", null, { stripe_checkout_session_id: stripeSessionId });
}

export async function authorizeDocument(input: { documentId: string; session?: Session | null; reference?: string; clientCookie?: string }) {
  const sb = supabaseService();
  const { data: doc } = await sb.from("dossier_documents").select("id,dossier_id,storage_path,kind,commercial_dossiers!inner(public_ref,affiliate_id)").eq("id", input.documentId).maybeSingle();
  if (!doc) return null;
  const nested = doc.commercial_dossiers as unknown as { public_ref: string; affiliate_id: string };
  let allowed = !!input.session && (input.session.role === "admin" || input.session.role === "super_admin" || input.session.affiliate?.id === nested.affiliate_id);
  if (!allowed && input.reference === nested.public_ref) allowed = !!(await getClientDossier(nested.public_ref, input.clientCookie));
  if (!allowed) return null;
  const download = await sb.storage.from("commercial-dossiers").download(doc.storage_path);
  return download.data ? { bytes: Buffer.from(await download.data.arrayBuffer()), kind: doc.kind as string, reference: nested.public_ref } : null;
}

/** Printable fallback only. It is generated from the currently published
 * template/catalog and can never be used as acceptance evidence. */
export async function generateFallbackDocument(session: Session, locale: Locale, kind: "brief" | "quote", tier: OfferTier = "pro") {
  if (!session.affiliate && session.role !== "admin" && session.role !== "super_admin") throw new DossierError("unauthorized");
  if (isDemoMode) throw new DossierError("requires_supabase");
  const sb = supabaseService();
  const { data: briefTemplate } = await sb.from("contract_templates").select("id").eq("kind", "brief").eq("locale", locale).eq("status", "published").maybeSingle();
  if (!briefTemplate) throw new DossierError("legal_template_not_published");
  const stamp = now();
  const base = mapDossier({ id: "draft", public_ref: "DRAFT", affiliate_id: session.affiliate?.id ?? "staff", client_email: "", locale, status: "draft", current_revision: 1, created_at: stamp, updated_at: stamp }, [], [], {});
  if (kind === "brief") return { bytes: await renderPdf(briefHtml(base, true)), filename: `studio-ats-cahier-${locale}-brouillon.pdf` };
  const [template, offerResult] = await Promise.all([
    publishedTemplate(locale),
    sb.from("offers").select("id,name,price_cents,currency,billing_interval,stripe_price_id,stripe_lookup_key").eq("is_active", true).eq("stripe_lookup_key", OFFER_LOOKUP_KEYS[tier]).maybeSingle(),
  ]);
  const offer = offerResult.data; if (!offer) throw new DossierError("active_offer_missing");
  base.adminScope = contractCopy(locale).pdf.scopePlaceholder;
  base.validUntil = addDays(30);
  base.offerSnapshot = { offerId: offer.id, tier, name: offer.name, priceCents: Number(offer.price_cents), currency: offer.currency, interval: offer.billing_interval, stripePriceId: offer.stripe_price_id ?? "unconfigured", stripeLookupKey: offer.stripe_lookup_key ?? OFFER_LOOKUP_KEYS[tier], totalCents: Number(offer.price_cents), lockedAt: stamp, legalIdentity: { legalName: "Studio ATS", address: "À compléter / To be completed", registration: "À compléter / To be completed", representative: "À compléter / To be completed" } };
  const clauses = ((template.body as Json).clauses as string[]) ?? [];
  return { bytes: await renderPdf(quoteHtml(base, clauses, true)), filename: `studio-ats-devis-${tier}-${locale}-brouillon.pdf` };
}

export { DOSSIER_COOKIE };
