/* eslint-disable @typescript-eslint/no-explicit-any -- rows are untyped until `supabase gen types` is wired in */
import "server-only";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { type Balances } from "@/lib/commission";
import { OFFER_LOOKUP_KEYS, maxEarningOffer, sortOffers, tierOfLookupKey } from "@/lib/offers";
import { defaultMarkets, type Market } from "@/content/markets";
import { assetsFor, type SalesAsset } from "@/content/sales-kit";
import { resolveLocale } from "@/i18n/config";
import { isValidCode } from "@/lib/attribution";
import type { Repo, Range } from "./repo";
import type { SalesContent } from "@/lib/sales/content";
import { summarizeBook } from "./book";
import { log } from "@/lib/log";
import { StepError, describeError, isDuplicate, isEmailAlreadyRegistered, isMissingDbObject } from "@/lib/auth-errors";
import type { EmailOtpType } from "@supabase/supabase-js";
import type {
  Session, Settings, Offer, TrackingLink, PrivatePage, Prospect, SaleRow, CommissionRow, LinkStats,
  ReferralTarget, AdminAffiliateRow, RecurringBook, RecurringContract, FinancialOverview, AdminFinanceSummary,
  PerformanceRow, ProductView, SalesAnalytics,
} from "./types";

const DAY = 86_400_000;

const rangeStart = (r: Range) => new Date(Date.now() - { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: 3650 }[r] * DAY).toISOString();

function check<T>(res: { data: T; error: any }): T {
  if (res.error) throw new Error(res.error.message ?? String(res.error));
  return res.data;
}
function mustAffiliate(s: Session) {
  if (!s.affiliate) throw new Error("No affiliate account");
  return s.affiliate.id;
}

const toProspect = (r: any): Prospect => ({
  id: r.id, name: r.name, company: r.company, profession: r.profession, email: r.email, phone: r.phone,
  website: r.website, notes: r.notes, source: r.source, campaignId: r.campaign_id, marketId: r.market_id,
  stage: r.stage, nextAction: r.next_action, nextActionAt: r.next_action_at,
  potentialValueCents: r.potential_value_cents, createdAt: r.created_at,
  stageChangedAt: r.stage_changed_at ?? null, leadId: r.lead_id ?? null,
});
const fromProspect = (p: Partial<Prospect>) => {
  const out: Record<string, unknown> = {};
  const map: Record<string, string> = {
    name: "name", company: "company", profession: "profession", email: "email", phone: "phone", website: "website",
    notes: "notes", source: "source", campaignId: "campaign_id", marketId: "market_id", stage: "stage",
    nextAction: "next_action", nextActionAt: "next_action_at", potentialValueCents: "potential_value_cents",
  };
  for (const [k, col] of Object.entries(map)) if (k in p) out[col] = (p as any)[k];
  if ("stage" in p) out.stage_changed_at = new Date().toISOString();
  return out;
};
const toPage = (r: any): PrivatePage => ({
  id: r.id, slug: r.slug, affiliateId: r.affiliate_id, marketId: r.market_id, campaignId: r.campaign_id,
  locale: resolveLocale(r.locale) ?? "en", pitchVariant: r.pitch_variant, ctaVariant: r.cta_variant,
  displayName: r.display_name, visibility: r.visibility, isActive: r.is_active, viewCount: r.view_count, createdAt: r.created_at,
  pathKey: r.path_key ?? null, templateKey: r.template_key ?? null, angleKey: r.angle_key ?? null, productId: r.product_id ?? null,
  ctaMode: r.cta_mode ?? "lead", showAdvisor: !!r.show_advisor, advisor: r.advisor ?? {}, indexable: !!r.indexable, archivedAt: r.archived_at ?? null,
});
const toContent = (r: any): SalesContent => ({
  id: r.id, kind: r.kind, key: r.key, locale: r.locale, version: r.version, status: r.status, productId: r.product_id,
  targetKey: r.target_key, channel: r.channel, stage: r.stage, title: r.title, summary: r.summary, body: r.body,
  tags: r.tags ?? [], sort: r.sort, publishedAt: r.published_at, updatedAt: r.updated_at,
});
const fromPageInput = (i: import("./types").SalesPageInput) => ({
  market_id: i.marketId, path_key: i.pathKey, locale: i.locale, template_key: i.templateKey, angle_key: i.angleKey,
  cta_mode: i.ctaMode, show_advisor: i.showAdvisor, advisor: i.advisor, campaign_id: i.campaignId,
  cta_variant: i.ctaMode === "call" ? "call" : "request", visibility: "unlisted",
});
const CONTENT_COLS = "id, kind, key, locale, version, status, product_id, target_key, channel, stage, title, summary, body, tags, sort, published_at, updated_at";
const toCommission = (r: any): CommissionRow => ({
  id: r.id, kind: r.kind ?? null, saleRef: r.sales?.public_ref ?? "—", customerRef: r.sales?.customer_ref ?? "—",
  grossCents: r.base_amount_cents, amountCents: r.amount_cents, status: r.status, validatedAt: r.validated_at,
  holdUntil: r.hold_until, expectedPaymentDate: r.expected_payment_date, paidAt: r.paid_at,
  reversalReason: r.reversal_reason, createdAt: r.created_at,
});

async function linkStats(sb: any, filter: { affiliate_id?: string; link_id?: string }): Promise<LinkStats> {
  const [clicks, leads, sales] = await Promise.all([
    sb.from("clicks").select("visitor_id").match(filter).eq("is_bot", false).limit(50_000),
    sb.from("my_leads").select("id", { count: "exact", head: true }).match(filter),
    sb.from("sales").select("id, gross_amount_cents, commissions(amount_cents)").match(filter).eq("status", "paid"),
  ]);
  const c = check(clicks) as any[];
  const s = check(sales) as any[];
  return {
    clicks: c.length,
    uniqueVisitors: new Set(c.map((x) => x.visitor_id)).size,
    leads: leads.count ?? 0,
    conversions: s.length,
    revenueCents: s.reduce((a, x) => a + x.gross_amount_cents, 0),
    commissionCents: s.reduce((a, x) => a + (x.commissions?.[0]?.amount_cents ?? 0), 0),
  };
}

type Account = { id: string; role: Session["role"]; deleted: boolean };
type Svc = ReturnType<typeof supabaseService>;

/**
 * Auth account for this address, provisioning its profile if missing (service
 * role). Null = no account. Falls back to a plain profiles lookup when the
 * ensure_profile migration is not applied yet.
 */
async function ensureProfile(email: string): Promise<Account | null> {
  const svc = supabaseService();
  const { data, error } = await svc.rpc("ensure_profile", { p_email: email });
  if (!error) return ((data as any[]) ?? [])[0] ?? null;
  if (!isMissingDbObject(error)) throw new StepError("ensure_profile", error);
  log.warn("auth", "ensure_profile missing (migration 20261002000001 not applied): profiles lookup fallback");
  const { data: p, error: e2 } = await svc.from("profiles").select("id, role, deleted_at").eq("email", email).maybeSingle();
  if (e2) throw new StepError("profiles_lookup", e2);
  return p ? { id: (p as any).id, role: (p as any).role, deleted: !!(p as any).deleted_at } : null;
}

/**
 * Makes sure an auth user has a profile + affiliate application. Tolerates the
 * optional auth.users trigger having done it already, and a database where the
 * idempotent provision_account() is missing or still the old non-idempotent one.
 */
async function provisionIfMissing(svc: Svc, id: string, email: string, meta: Record<string, any>): Promise<Account> {
  const read = async () => {
    const { data, error } = await svc.from("profiles").select("id, role, deleted_at").eq("id", id).maybeSingle();
    if (error) throw new StepError("profiles_lookup", error);
    return data ? { id, role: (data as any).role, deleted: !!(data as any).deleted_at } as Account : null;
  };
  const existing = await read();
  if (existing) return existing;

  const { error } = await svc.rpc("provision_account", { p_id: id, p_email: email, p_meta: meta });
  if (error && isMissingDbObject(error)) {
    log.warn("auth", "provision_account missing: direct provisioning fallback");
    await provisionDirect(svc, id, email, meta);
  } else if (error && !isDuplicate(error)) {
    throw new StepError("provision", error);
  }
  const account = await read();
  if (!account) throw new StepError("provision", "profile still missing after provisioning");
  return account;
}

/** Same rules as provision_account() in SQL, for a database without it. */
async function provisionDirect(svc: Svc, id: string, email: string, meta: Record<string, any>) {
  const { error: pe } = await svc.from("profiles").upsert(
    { id, email, full_name: String(meta.full_name ?? ""), locale: String(meta.locale ?? "en") },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (pe) throw new StepError("provision_profile", pe);
  const { data: setting } = await svc.from("settings").select("value").eq("key", "affiliates.auto_approve").maybeSingle();
  const autoApprove = (setting as any)?.value === true || (setting as any)?.value === "true";
  let sponsorId: string | null = null;
  const code = typeof meta.sponsor_code === "string" && isValidCode(meta.sponsor_code) ? meta.sponsor_code : null;
  if (code) {
    const { data: sp } = await svc.from("affiliates").select("id").is("deleted_at", null).eq("status", "approved")
      .or(`code.ilike.${code},slug.ilike.${code}`).limit(1).maybeSingle();
    sponsorId = (sp as any)?.id ?? null;
  }
  const { error: ae } = await svc.from("affiliates").upsert({
    profile_id: id, status: autoApprove ? "approved" : "pending", approved_at: autoApprove ? new Date().toISOString() : null,
    country: meta.country ?? null, application: meta.application ?? {}, sponsor_id: sponsorId,
  }, { onConflict: "profile_id", ignoreDuplicates: true });
  if (ae) throw new StepError("provision_affiliate", ae);
}

export const supabaseRepo: Repo = {
  // ------------------------------------------------------------- public
  async getSettings(): Promise<Settings> {
    const sb = supabaseService();
    const rows = check(await sb.from("settings").select("key, value")) as { key: string; value: any }[];
    const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      attributionWindowDays: Number(v["attribution.window_days"] ?? 90),
      attributionModel: v["attribution.model"] === "first_click" ? "first_click" : v["attribution.model"] === "manual" ? "manual" : "last_click",
      commissionValidationDays: Number(v["commission.validation_days"] ?? 30),
      payoutMinimumCents: Number(v["payout.minimum_cents"] ?? 5000),
      leaderboardEnabled: Boolean(v["leaderboard.enabled"]),
      autoApprove: Boolean(v["affiliates.auto_approve"]),
      refundPartialPolicy: (["proportional", "full_reversal"].includes(v["refund.partial_policy"]) ? v["refund.partial_policy"] : "manual_review"),
      billingEmailsOwner: v["emails.customer_billing_owner"] === "studio" ? "studio" : "stripe",
      connectEnabled: v["payouts.connect_enabled"] === true,
      checkoutEnabled: v["checkout.enabled"] !== false,
      // Same default as public.accrue_sponsor_commission().
      sponsorRate: Number(v["referrals.sponsor_rate"] ?? 0.05),
    };
  },

  async getOffer(): Promise<Offer> {
    return maxEarningOffer(await supabaseRepo.listOffers());
  },

  async listOffers(): Promise<Offer[]> {
    const sb = supabaseService();
    const rows = check(await sb.from("offers").select("*, products!inner(slug, name)").eq("products.slug", "studio").eq("is_active", true)
      .in("stripe_lookup_key", Object.values(OFFER_LOOKUP_KEYS))) as any[];
    return sortOffers(rows.map((r) => ({
      id: r.id, productId: r.product_id, productName: r.products.name, tier: tierOfLookupKey(r.stripe_lookup_key)!,
      priceCents: r.price_cents, currency: r.currency, interval: r.billing_interval,
      commissionRate: Number(r.commission_rate), recurring: r.commission_recurring,
    })));
  },

  async listMarkets(): Promise<Market[]> {
    const sb = supabaseService();
    const rows = check(await sb.from("markets").select("*").eq("is_active", true).order("sort")) as any[];
    if (!rows.length) return defaultMarkets;
    return rows.map((r) => ({ id: r.id, slug: r.slug, icon: r.icon ?? "sparkles", sort: r.sort, relevance: r.relevance ?? 3, content: r.content }));
  },

  async listProducts(): Promise<ProductView[]> {
    const sb = supabaseService();
    const rows = check(await sb.from("products").select("id, slug, name, is_active, offers(price_cents, currency, billing_interval, is_active, valid_from, stripe_lookup_key)")
      .is("deleted_at", null).order("sort")) as any[];
    return rows.map((p) => {
      // Several active offers (Studio ATS One/Pro/Premium): show the highest price, i.e. the highest commission.
      const o = (p.offers ?? []).filter((x: any) => x.is_active).sort((a: any, b: any) => b.price_cents - a.price_cents || b.valid_from.localeCompare(a.valid_from))[0];
      return {
        id: p.id, slug: p.slug, name: p.name, active: p.is_active,
        offer: o ? { priceCents: o.price_cents, currency: o.currency, interval: o.billing_interval, checkoutReady: !!o.stripe_lookup_key } : null,
      };
    });
  },

  async getSalesPage(affiliate, pathKey) {
    const sb = supabaseService();
    const key = affiliate.trim();
    if (!isValidCode(key)) return null;
    const aff = check(await sb.from("affiliates").select("id, code").or(`code.eq.${key.toUpperCase()},slug.eq.${key.toLowerCase()}`).is("deleted_at", null).maybeSingle()) as any;
    if (!aff) return null;
    const r = check(await sb.from("private_sales_pages").select("*").eq("affiliate_id", aff.id).eq("path_key", pathKey ?? "general")
      .eq("is_active", true).is("archived_at", null).maybeSingle()) as any;
    if (!r) return null;
    const referral = await supabaseRepo.resolveReferral(aff.code);
    return referral ? { ...toPage(r), referral } : null;
  },

  async listPublishedContent(kinds) {
    const sb = supabaseService();
    return (check(await sb.from("sales_content").select(CONTENT_COLS).eq("status", "active").in("kind", kinds).order("sort")) as any[]).map(toContent);
  },

  async recordSalesEvent(e) {
    const { error } = await supabaseService().from("sales_events").insert({
      event: e.event, affiliate_id: e.affiliateId, visitor_id: e.visitorId ?? null, private_page_id: e.privatePageId ?? null,
      link_id: e.linkId ?? null, campaign_id: e.campaignId ?? null, content_kind: e.contentKind ?? null, content_key: e.contentKey ?? null,
      target_key: e.targetKey ?? null, channel: e.channel ?? null, meta: e.meta ?? {},
    });
    if (error) console.error(JSON.stringify({ level: "warn", scope: "sales_events", message: error.message }));
  },

  async getSalesSettings() {
    const sb = supabaseService();
    const rows = check(await sb.from("settings").select("key, value").in("key", ["crm.follow_up_days", "crm.checkout_check_in_days", "sales_pages.allow_indexing", "sales_pages.advisor_enabled"])) as any[];
    const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      followUpDays: Number(v["crm.follow_up_days"] ?? 3), checkoutCheckInDays: Number(v["crm.checkout_check_in_days"] ?? 2),
      allowIndexing: v["sales_pages.allow_indexing"] === true, advisorEnabled: v["sales_pages.advisor_enabled"] !== false,
    };
  },

  async resolveReferral(codeOrSlug) {
    const sb = supabaseService();
    const key = codeOrSlug.trim();
    if (!isValidCode(key)) return null;
    const link = check(await sb.from("affiliate_links").select("id, code, campaign_id, affiliate_id").ilike("code", key).is("archived_at", null).maybeSingle()) as any;
    let aff: any;
    if (link) {
      aff = check(await sb.from("affiliates").select("id, code, status, profile_id, profiles(display_name, full_name)").eq("id", link.affiliate_id).single());
    } else {
      aff = check(await sb.from("affiliates").select("id, code, status, profile_id, profiles(display_name, full_name)")
        .or(`code.eq.${key.toUpperCase()},slug.eq.${key.toLowerCase()}`).is("deleted_at", null).maybeSingle());
    }
    if (!aff) return null;
    const def = link ?? (check(await sb.from("affiliate_links").select("id, code").eq("affiliate_id", aff.id).eq("is_default", true).maybeSingle()) as any);
    const target: ReferralTarget = {
      affiliateId: aff.id, affiliateCode: aff.code, linkId: def?.id ?? null, linkCode: def?.code ?? null,
      campaignId: link?.campaign_id ?? null,
      displayName: aff.profiles?.display_name || (aff.profiles?.full_name ?? "").split(" ")[0] || null,
      active: aff.status === "approved",
    };
    return target;
  },

  async getPrivatePage(slug) {
    const sb = supabaseService();
    const r = check(await sb.from("private_sales_pages").select("*, affiliates(code)").eq("slug", slug.toUpperCase()).eq("is_active", true).maybeSingle()) as any;
    if (!r) return null;
    const referral = await supabaseRepo.resolveReferral(r.affiliates.code);
    return referral ? { ...toPage(r), referral } : null;
  },

  async recordClick(i) {
    const sb = supabaseService();
    await sb.from("visitors").upsert(
      { id: i.visitorId, last_seen_at: new Date().toISOString(), country: i.country, device_type: i.deviceType, is_bot: i.isBot },
      { onConflict: "id" },
    );
    const { count } = await sb.from("clicks").select("id", { count: "exact", head: true }).eq("visitor_id", i.visitorId);
    check(await sb.from("clicks").insert({
      affiliate_id: i.affiliateId, link_id: i.linkId, campaign_id: i.campaignId, private_page_id: i.privatePageId,
      visitor_id: i.visitorId, landing_path: i.landingPath, utm_source: i.utm.source, utm_medium: i.utm.medium,
      utm_campaign: i.utm.campaign, utm_content: i.utm.content, utm_term: i.utm.term, referrer_host: i.referrerHost,
      country: i.country, device_type: i.deviceType, ip_hash: i.ipHash, ua_hash: i.uaHash, is_bot: i.isBot,
    }));
    if (!i.isBot) {
      await sb.from("activity_events").insert({ affiliate_id: i.affiliateId, type: count ? "click" : "visitor", payload: { source: i.utm.source ?? null } });
      // Server-side attribution record (the cookie only carries the visitor id).
      const { error: touchError } = await sb.rpc("record_referral_touch", { p: {
        session_key: i.visitorId, affiliate_id: i.affiliateId, referral_code: i.referralCode ?? "",
        link_id: i.linkId, campaign_id: i.campaignId, private_page_id: i.privatePageId,
        landing_page: i.landingPath, utm: i.utm,
      } });
      if (touchError) console.error(JSON.stringify({ level: "error", scope: "attribution", message: "touch not recorded", error: touchError.message }));
    }
    // Abnormal click burst → flag for human review (never auto-block).
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count: burst } = await sb.from("clicks").select("id", { count: "exact", head: true })
      .eq("affiliate_id", i.affiliateId).eq("ip_hash", i.ipHash ?? "").gte("occurred_at", since);
    const threshold = Number((check(await sb.from("settings").select("value").eq("key", "fraud.click_burst_threshold").maybeSingle()) as any)?.value ?? 50);
    if (i.ipHash && (burst ?? 0) === threshold) {
      await sb.from("fraud_flags").insert({ type: "abnormal_clicks", severity: 2, affiliate_id: i.affiliateId, entity: "affiliate", entity_id: i.affiliateId, signals: { clicks_last_hour_same_ip: burst } });
    }
  },

  async recordPrivatePageView(pageId) {
    const sb = supabaseService();
    const r = check(await sb.from("private_sales_pages").select("view_count").eq("id", pageId).single()) as any;
    await sb.from("private_sales_pages").update({ view_count: r.view_count + 1 }).eq("id", pageId);
  },

  async createLead(i) {
    const sb = supabaseService();
    const row = check(await sb.from("leads").insert({
      affiliate_id: i.affiliateId, link_id: i.linkId, campaign_id: i.campaignId, private_page_id: i.privatePageId,
      visitor_id: i.visitorId, attribution_model: i.attributionModel, first_click_at: i.firstClickAt, last_click_at: i.lastClickAt,
      utm: i.utm, full_name: i.fullName, company: i.company, profession: i.profession, email: i.email, phone: i.phone,
      website: i.website, message: i.message, locale: i.locale, consent_at: new Date().toISOString(),
      request_type: i.requestType ?? null, advisor_consent_at: i.advisorConsent ? new Date().toISOString() : null,
    }).select("id").single()) as any;
    return { id: row.id };
  },

  // ------------------------------------------------------------- session
  async getSession(): Promise<Session | null> {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    let profile = check(await sb.from("profiles").select("*").eq("id", user.id).maybeSingle()) as any;
    if (!profile) {
      // Auth user without a profile (created outside /register): provision it once, audited.
      const { data: healed } = await sb.rpc("ensure_my_account");
      if (healed) profile = check(await sb.from("profiles").select("*").eq("id", user.id).maybeSingle()) as any;
    }
    if (!profile || profile.deleted_at) return null;
    const aff = check(await sb.from("affiliates").select("*").eq("profile_id", user.id).maybeSingle()) as any;
    let rate = 0.25;
    if (aff) {
      const offer = await supabaseRepo.getOffer().catch(() => null);
      rate = aff.commission_rate_override != null ? Number(aff.commission_rate_override) : offer?.commissionRate ?? 0.25;
    }
    return {
      userId: user.id, email: user.email ?? "", role: profile.role, fullName: profile.full_name ?? "",
      displayName: profile.display_name, locale: resolveLocale(profile.locale) ?? "en",
      leaderboardOptIn: profile.leaderboard_opt_in, isDemo: false,
      affiliate: aff && {
        id: aff.id, code: aff.code, slug: aff.slug, status: aff.status, commissionRate: rate,
        onboardingStep: aff.onboarding_step, onboardingCompletedAt: aff.onboarding_completed_at,
        monthlyGoalSales: aff.monthly_goal_sales, payoutProvider: aff.payout_provider,
        payoutAccountRef: aff.payout_account_ref ? "connected" : null, createdAt: aff.created_at,
        sponsorId: aff.sponsor_id ?? null,
      },
    };
  },

  // ------------------------------------------------------------- passwordless sign-in
  // Codes are checked by SQL (auth_code_*). The session is then opened with the
  // admin API: generateLink() returns a one-time token WITHOUT sending any
  // email, and verifyOtp() on the request-scoped client writes the session
  // cookies in the current browser (no PKCE, no redirect, works on any device).
  async issueSignInCode({ email, purpose, codeHash, signup, ipHash }) {
    const svc = supabaseService();
    if (purpose === "login") {
      const account = await ensureProfile(email);
      if (!account || account.deleted) return "no_account";
    }
    const { data, error } = await svc.rpc("auth_code_issue", {
      p_email: email, p_purpose: purpose, p_hash: codeHash, p_payload: signup, p_ip_hash: ipHash,
    });
    if (error) throw new StepError("issue_code", error);
    return ((data as any[]) ?? [])[0]?.status ?? "rate_limited";
  },

  async signInWithCode({ email, codeHash }) {
    const svc = supabaseService();
    const { data, error } = await svc.rpc("auth_code_consume", { p_email: email, p_hash: codeHash });
    if (error) throw new StepError("check_code", error);
    const res = ((data as any[]) ?? [])[0];
    if (!res || res.status !== "ok") return { status: res?.status ?? "invalid" };

    try {
      let account = await ensureProfile(email);
      if (account?.deleted) return { status: "invalid" };
      let isNew = false;
      if (!account) {
        if (res.purpose !== "signup" || !res.payload) return { status: "invalid" };
        const { error: createError } = await svc.auth.admin.createUser({ email, email_confirm: true, user_metadata: res.payload });
        // An auth user may already exist (older sign-up flow, never confirmed): sign them in instead.
        if (createError && !isEmailAlreadyRegistered(createError)) throw new StepError("create_user", createError);
        isNew = !createError;
      }
      // One-time token for this user, WITHOUT any email sent by Supabase.
      const link = await svc.auth.admin.generateLink({ type: "magiclink", email });
      const props = link.data?.properties;
      if (link.error || !props?.hashed_token || !link.data.user) throw new StepError("session_token", link.error ?? "no token");
      account ??= await provisionIfMissing(svc, link.data.user.id, email, res.payload ?? link.data.user.user_metadata ?? {});
      if (account.deleted) return { status: "invalid" };
      const { error: verifyError } = await (await supabaseServer()).auth.verifyOtp({
        type: (props.verification_type ?? "magiclink") as EmailOtpType, token_hash: props.hashed_token,
      });
      if (verifyError) throw new StepError("session_open", verifyError);
      return { status: "ok", isNew, role: account.role };
    } catch (e) {
      // A technical failure after a valid code: give the code back so the person can simply retry.
      const released = await svc.rpc("auth_code_release", { p_email: email, p_hash: codeHash }).then((r) => !r.error && r.data === true, () => false);
      const detail = describeError(e);
      log.error("auth", "sign-in failed after a valid code", { detail, codeReleased: released });
      return { status: "failed", detail, retrySameCode: released };
    }
  },

  // ------------------------------------------------------------- affiliate
  async getBalances(s): Promise<Balances> {
    const sb = await supabaseServer();
    const aff = mustAffiliate(s);
    // affiliate_balances nets unsettled clawbacks / adjustments into `available` (security_invoker: RLS applies).
    const [b, reversed] = await Promise.all([
      sb.from("affiliate_balances").select("*").eq("affiliate_id", aff).maybeSingle(),
      sb.from("commissions").select("amount_cents").eq("affiliate_id", aff).eq("status", "reversed"),
    ]);
    const r = (check(b) ?? {}) as any;
    return {
      awaitingPaymentCents: Number(r.awaiting_payment_cents ?? 0), pendingCents: Number(r.pending_cents ?? 0),
      disputedCents: Number(r.disputed_cents ?? 0), availableCents: Number(r.available_cents ?? 0),
      paidCents: Number(r.paid_cents ?? 0), lifetimeEarnedCents: Number(r.lifetime_earned_cents ?? 0),
      reversedCents: (check(reversed) as any[]).reduce((a, x) => a + x.amount_cents, 0),
    };
  },

  async getFinancialOverview(s): Promise<FinancialOverview> {
    const sb = await supabaseServer();
    const aff = mustAffiliate(s);
    const [balances, sales, book, latest] = await Promise.all([
      supabaseRepo.getBalances(s),
      sb.from("sales").select("gross_amount_cents, currency").eq("affiliate_id", aff).in("status", ["paid", "partially_refunded", "disputed"]),
      supabaseRepo.getRecurringBook(s),
      sb.from("sales").select("public_ref, kind, gross_amount_cents, paid_at, commissions(amount_cents, status)").eq("affiliate_id", aff)
        .not("paid_at", "is", null).order("paid_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const currency = book.currency;
    const l = check(latest) as any;
    return {
      currency,
      revenueGeneratedCents: (check(sales) as any[]).filter((x) => x.currency === currency).reduce((a, x) => a + x.gross_amount_cents, 0),
      balances,
      recurringContracts: book.activeCount,
      potentialNext12mCents: book.contracts.reduce((a, c) => a + c.projected12mCents, 0),
      latestSale: l ? {
        ref: l.public_ref, kind: l.kind, grossCents: l.gross_amount_cents, at: l.paid_at,
        commissionCents: l.commissions?.[0]?.amount_cents ?? null, commissionStatus: l.commissions?.[0]?.status ?? null,
      } : null,
    };
  },

  async getOverview(s, range) {
    const aff = mustAffiliate(s);
    const sb = await supabaseServer();
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [balances, subs, prospects, clicks, earned, activity, next, monthSales, goal] = await Promise.all([
      supabaseRepo.getBalances(s),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("affiliate_id", aff).eq("status", "active"),
      sb.from("prospects").select("id", { count: "exact", head: true }).eq("affiliate_id", aff).is("deleted_at", null).not("stage", "in", "(won,lost)"),
      sb.from("clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", aff).eq("is_bot", false).gte("occurred_at", rangeStart(range)),
      sb.from("commissions").select("amount_cents, available_at").eq("affiliate_id", aff).in("status", ["available", "paid"]).not("available_at", "is", null).order("available_at"),
      sb.from("activity_events").select("*").eq("affiliate_id", aff).order("occurred_at", { ascending: false }).limit(12),
      sb.from("prospects").select("*").eq("affiliate_id", aff).is("deleted_at", null).not("next_action_at", "is", null).not("stage", "in", "(won,lost)").order("next_action_at").limit(5),
      sb.from("sales").select("id", { count: "exact", head: true }).eq("affiliate_id", aff).eq("status", "paid").gte("paid_at", monthStart.toISOString()),
      sb.from("goals").select("target_sales").eq("affiliate_id", aff).eq("month", monthStart.toISOString().slice(0, 10)).maybeSingle(),
    ]);
    return {
      balances,
      activeClients: subs.count ?? 0,
      opportunities: prospects.count ?? 0,
      clicks: clicks.count ?? 0,
      earnings: (check(earned) as any[]).map((r) => ({ date: r.available_at.slice(0, 10), cents: r.amount_cents })),
      activity: (check(activity) as any[]).map((r) => ({ id: String(r.id), type: r.type, occurredAt: r.occurred_at, payload: r.payload })),
      nextActions: (check(next) as any[]).map(toProspect),
      goal: { target: (goal.data as any)?.target_sales ?? s.affiliate!.monthlyGoalSales, current: monthSales.count ?? 0 },
    };
  },

  async getDefaultLink(s) {
    const aff = mustAffiliate(s);
    const sb = await supabaseServer();
    let r = check(await sb.from("affiliate_links").select("*").eq("affiliate_id", aff).eq("is_default", true).maybeSingle()) as any;
    if (!r) r = check(await sb.from("affiliate_links").insert({ affiliate_id: aff, name: "Default", is_default: true }).select("*").single());
    return { id: r.id, code: r.code, name: r.name, campaignId: null, campaignName: null, source: null, marketId: null, isDefault: true, createdAt: r.created_at, stats: await linkStats(sb, { link_id: r.id }) };
  },

  async getLinkStats(s) {
    return linkStats(await supabaseServer(), { affiliate_id: mustAffiliate(s) });
  },

  async listLinks(s) {
    const sb = await supabaseServer();
    const rows = check(await sb.from("affiliate_links").select("*, campaigns(name, source, market_id, private_page_id)").eq("affiliate_id", mustAffiliate(s)).eq("is_default", false).is("archived_at", null).order("created_at", { ascending: false })) as any[];
    return Promise.all(rows.map(async (r): Promise<TrackingLink> => ({
      id: r.id, code: r.code, name: r.name, campaignId: r.campaign_id, campaignName: r.campaigns?.name ?? null,
      source: r.campaigns?.source ?? r.channel ?? null, marketId: r.campaigns?.market_id ?? r.market_id ?? null, isDefault: false, createdAt: r.created_at,
      stats: await linkStats(sb, { link_id: r.id }),
      pageId: r.private_page_id ?? r.campaigns?.private_page_id ?? null, channel: r.channel ?? r.campaigns?.source ?? null,
    })));
  },

  async createCampaignLink(s, input) {
    const aff = mustAffiliate(s);
    const sb = await supabaseServer();
    const c = check(await sb.from("campaigns").insert({ affiliate_id: aff, name: input.name, source: input.source, market_id: input.marketId,
      private_page_id: input.pageId ?? null, message_key: input.messageKey ?? null }).select("id").single()) as any;
    const l = check(await sb.from("affiliate_links").insert({ affiliate_id: aff, campaign_id: c.id, name: input.name, private_page_id: input.pageId ?? null,
      destination: input.pageId ? "private_page" : "studio", channel: input.source, market_id: input.marketId }).select("*").single()) as any;
    return { id: l.id, code: l.code, name: l.name, campaignId: c.id, campaignName: input.name, source: input.source, marketId: input.marketId, isDefault: false, createdAt: l.created_at, stats: { clicks: 0, uniqueVisitors: 0, leads: 0, conversions: 0, revenueCents: 0, commissionCents: 0 } };
  },

  async listPromoCodes(s) {
    const sb = await supabaseServer();
    const aff = mustAffiliate(s);
    const rows = check(await sb.from("affiliate_promo_codes")
      .select("id, code, discount_rate, is_active, created_at, sales(count)")
      .eq("affiliate_id", aff).order("created_at", { ascending: false })) as any[];
    return rows.map((r) => ({
      id: r.id, code: String(r.code), discountRate: Number(r.discount_rate), active: r.is_active,
      redemptions: Number(r.sales?.[0]?.count ?? 0), createdAt: r.created_at,
    }));
  },

  async createPromoCode(s, input) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("affiliate_promo_codes").insert({
      affiliate_id: mustAffiliate(s), code: input.code, discount_rate: input.discountRate,
    }).select("id, code, discount_rate, is_active, created_at").single();
    if (error) throw new Error(error.code === "23505" ? "code_taken" : error.message);
    return { id: data.id, code: String(data.code), discountRate: Number(data.discount_rate), active: data.is_active, redemptions: 0, createdAt: data.created_at };
  },

  async setPromoCodeActive(s, id, active) {
    const sb = await supabaseServer();
    const { error } = await sb.from("affiliate_promo_codes").update({ is_active: active })
      .eq("id", id).eq("affiliate_id", mustAffiliate(s));
    if (error) throw new Error(error.message);
  },

  async setSlug(s, slug) {
    const sb = await supabaseServer();
    const { error } = await sb.from("affiliates").update({ slug }).eq("id", mustAffiliate(s));
    if (error) throw new Error(error.code === "23505" ? "slug_taken" : error.message);
  },

  async listPrivatePages(s) {
    const sb = await supabaseServer();
    return (check(await sb.from("private_sales_pages").select("*").eq("affiliate_id", mustAffiliate(s)).order("created_at", { ascending: false })) as any[]).map(toPage);
  },

  async createPrivatePage(s, i) {
    const sb = await supabaseServer();
    return toPage(check(await sb.from("private_sales_pages").insert({
      affiliate_id: mustAffiliate(s), market_id: i.marketId, campaign_id: i.campaignId, locale: i.locale,
      pitch_variant: i.pitchVariant, cta_variant: i.ctaVariant, display_name: i.displayName, visibility: i.visibility,
    }).select("*").single()));
  },

  async listProspects(s) {
    const sb = await supabaseServer();
    return (check(await sb.from("prospects").select("*").eq("affiliate_id", mustAffiliate(s)).is("deleted_at", null).order("created_at", { ascending: false })) as any[]).map(toProspect);
  },
  async createProspect(s, input) {
    const sb = await supabaseServer();
    return toProspect(check(await sb.from("prospects").insert({ ...fromProspect(input), affiliate_id: mustAffiliate(s) }).select("*").single()));
  },
  async updateProspect(s, id, patch) {
    const sb = await supabaseServer();
    check(await sb.from("prospects").update(fromProspect(patch)).eq("id", id).eq("affiliate_id", mustAffiliate(s)));
  },
  async deleteProspect(s, id) {
    const sb = await supabaseServer();
    check(await sb.from("prospects").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("affiliate_id", mustAffiliate(s)));
  },

  async listSales(s) {
    const sb = await supabaseServer();
    const [rows, customers] = await Promise.all([
      sb.from("sales").select("*, commissions(amount_cents, status), subscriptions(current_period_end, status), campaigns(name, source), offers(products(name))")
        .eq("affiliate_id", mustAffiliate(s)).order("created_at", { ascending: false }),
      sb.from("my_customers").select("*"),
    ]);
    const cmap = new Map((check(customers) as any[]).map((c) => [c.id, c]));
    return (check(rows) as any[]).map((r): SaleRow => ({
      id: r.id, ref: r.public_ref, customerRef: cmap.get(r.customer_id)?.public_ref ?? "—",
      customerName: cmap.get(r.customer_id)?.company_name ?? null, product: r.offers?.products?.name ?? "Studio ATS",
      date: r.created_at, status: r.status, kind: r.kind, amountCents: r.gross_amount_cents,
      commissionCents: r.commissions?.[0]?.amount_cents ?? null, commissionStatus: r.commissions?.[0]?.status ?? null,
      renewalDate: r.subscriptions?.status === "active" ? r.subscriptions.current_period_end : null,
      source: r.campaigns?.source ?? null, campaign: r.campaigns?.name ?? null, isDemo: r.is_demo,
    }));
  },

  async listCommissions(s) {
    const sb = await supabaseServer();
    const [rows, customers] = await Promise.all([
      sb.from("commissions").select("*, sales(public_ref, customer_id)").eq("affiliate_id", mustAffiliate(s)).order("created_at", { ascending: false }),
      sb.from("my_customers").select("id, public_ref"),
    ]);
    const cmap = new Map((check(customers) as any[]).map((c) => [c.id, c.public_ref]));
    return (check(rows) as any[]).map((r) => toCommission({ ...r, sales: { ...r.sales, customer_ref: cmap.get(r.sales?.customer_id) } }));
  },

  async getRecurringBook(s): Promise<RecurringBook> {
    const sb = await supabaseServer();
    const aff = mustAffiliate(s);
    const [rows, balances, offer] = await Promise.all([
      sb.rpc("affiliate_recurring_book", { p_affiliate_id: aff }),
      supabaseRepo.getBalances(s),
      supabaseRepo.getOffer(),
    ]);
    const contracts = (check(rows) as any[]).map((r): RecurringContract => ({
      subscriptionId: r.subscription_id, customerRef: r.customer_ref, customerName: r.customer_name, productName: r.product_name,
      startedAt: r.started_at, renewalDate: r.next_renewal_at, annualCents: Number(r.annual_amount_cents), currency: String(r.currency).trim(),
      status: r.status, cancelling: r.cancelling, ruleLabel: r.rule_label, ruleRate: r.rule_rate != null ? Number(r.rule_rate) : null,
      ruleDurationMonths: r.rule_duration_months, nextCommissionEligible: !!r.next_commission_eligible,
      nextCommissionReason: r.next_commission_reason, nextCommissionCents: Number(r.next_commission_cents ?? 0),
      projected12mCents: Number(r.projected_12m_cents ?? 0), renewalsCount: r.renewals_count ?? 0, lastPaidAt: r.last_paid_at,
    }));
    return summarizeBook(contracts, offer.currency, balances.lifetimeEarnedCents);
  },

  async listPayouts(s) {
    const sb = await supabaseServer();
    return (check(await sb.from("payouts").select("*").eq("affiliate_id", mustAffiliate(s)).order("scheduled_for", { ascending: false })) as any[])
      .map((r) => ({ id: r.id, ref: r.public_ref, amountCents: r.amount_cents, status: r.status, scheduledFor: r.scheduled_for, paidAt: r.paid_at, documentPath: r.document_path }));
  },

  async listNotifications(s, status = "inbox") {
    const sb = await supabaseServer();
    let q = sb.from("notifications").select("*").eq("profile_id", s.userId);
    q = status === "inbox" ? q.neq("status", "archived") : q.eq("status", status);
    return (check(await q.order("created_at", { ascending: false }).limit(100)) as any[])
      .map((r) => ({ id: r.id, type: r.type, titleKey: String(r.title_key).replace(/^notifications\./, ""), params: r.params, href: r.href, readAt: r.read_at, status: r.status, createdAt: r.created_at }));
  },
  async markNotificationsRead(s) {
    const sb = await supabaseServer();
    check(await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", s.userId).is("read_at", null));
  },
  async setNotificationStatus(s, id, status) {
    const sb = await supabaseServer();
    const nowIso = new Date().toISOString();
    const patch = status === "archived" ? { archived_at: nowIso, read_at: nowIso }
      : status === "read" ? { read_at: nowIso, archived_at: null } : { read_at: null, archived_at: null };
    check(await sb.from("notifications").update(patch).eq("id", id).eq("profile_id", s.userId));
  },

  async getConnectStatus(s) {
    const sb = await supabaseServer();
    const [a, settings] = await Promise.all([
      sb.from("affiliates").select("stripe_connected_account_id, connect_onboarding_status, payouts_enabled, connect_requirements_status, connect_updated_at").eq("id", mustAffiliate(s)).single(),
      supabaseRepo.getSettings(),
    ]);
    const r = check(a) as any;
    return {
      enabled: settings.connectEnabled, providerConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      accountConnected: !!r.stripe_connected_account_id, onboardingStatus: r.connect_onboarding_status,
      payoutsEnabled: r.payouts_enabled, requirementsStatus: r.connect_requirements_status, updatedAt: r.connect_updated_at,
    };
  },

  async getLeaderboard() {
    const sb = await supabaseServer();
    return (check(await sb.rpc("leaderboard")) as any[]).map((r) => ({ rank: Number(r.rank), displayName: r.display_name, sales: Number(r.sales), isMe: r.is_me }));
  },

  async getAnalytics(s, range) {
    const aff = mustAffiliate(s);
    const sb = await supabaseServer();
    const since = rangeStart(range);
    const [clicks, leads, sales, campaigns] = await Promise.all([
      sb.from("clicks").select("visitor_id, country, device_type, campaign_id").eq("affiliate_id", aff).eq("is_bot", false).gte("occurred_at", since).limit(50_000),
      sb.from("my_leads").select("status, campaign_id").gte("created_at", since),
      sb.from("sales").select("campaign_id").eq("affiliate_id", aff).eq("status", "paid").gte("created_at", since),
      sb.from("campaigns").select("id, name").eq("affiliate_id", aff),
    ]);
    const c = check(clicks) as any[]; const l = check(leads) as any[]; const sl = check(sales) as any[];
    const count = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {}))
      .map(([key, n]) => ({ key, clicks: n })).sort((a, b) => b.clicks - a.clicks);
    return {
      funnel: {
        visitors: new Set(c.map((x) => x.visitor_id)).size, leads: l.length,
        appointments: l.filter((x) => x.status === "appointment_requested" || x.status === "converted").length, sales: sl.length,
      },
      byCampaign: (check(campaigns) as any[]).map((cm) => ({
        name: cm.name, clicks: c.filter((x) => x.campaign_id === cm.id).length,
        leads: l.filter((x) => x.campaign_id === cm.id).length, sales: sl.filter((x) => x.campaign_id === cm.id).length,
      })),
      byCountry: count(c.map((x) => x.country ?? "—")),
      byDevice: count(c.map((x) => x.device_type ?? "unknown")),
    };
  },

  async getReferralDashboard(s) {
    mustAffiliate(s);
    const sb = await supabaseServer();
    const r = check(await sb.rpc("affiliate_referral_dashboard")) as any;
    return {
      code: r.code,
      slug: r.slug ?? null,
      sponsor: r.sponsor ? { name: r.sponsor.name } : null,
      recruits: (r.recruits ?? []).map((x: any) => ({
        id: x.id, name: x.name, status: x.status, joinedAt: x.joinedAt,
        sales: Number(x.sales ?? 0), commissionCents: Number(x.commissionCents ?? 0),
      })),
      totalCommissionCents: Number(r.totalCommissionCents ?? 0),
      pendingCommissionCents: Number(r.pendingCommissionCents ?? 0),
      availableCommissionCents: Number(r.availableCommissionCents ?? 0),
    };
  },

  async listSalesAssets(_s, locale): Promise<SalesAsset[]> {
    const sb = await supabaseServer();
    const rows = check(await sb.from("sales_assets").select("*").eq("is_active", true).in("locale", [locale, "en"]).order("sort")) as any[];
    if (!rows.length) return assetsFor(locale);
    const local = rows.filter((r) => r.locale === locale);
    return (local.length ? local : rows).map((r) => ({ id: r.id, type: r.type, locale: r.locale, title: r.title, body: r.body ?? undefined, filePath: r.file_path ?? undefined }));
  },

  async listSalesContent(s, kinds) {
    mustAffiliate(s);
    const sb = await supabaseServer();
    let q = sb.from("sales_content").select(CONTENT_COLS).eq("status", "active").order("sort");
    if (kinds) q = q.in("kind", kinds);
    return (check(await q) as any[]).map(toContent);
  },
  async listFavorites(s) {
    const sb = await supabaseServer();
    return (check(await sb.from("affiliate_favorites").select("content_kind, content_key").eq("affiliate_id", mustAffiliate(s))) as any[])
      .map((r) => ({ kind: r.content_kind, key: r.content_key }));
  },
  async setFavorite(s, kind, key, on) {
    const sb = await supabaseServer();
    const aff = mustAffiliate(s);
    if (on) check(await sb.from("affiliate_favorites").upsert({ affiliate_id: aff, content_kind: kind, content_key: key }));
    else check(await sb.from("affiliate_favorites").delete().match({ affiliate_id: aff, content_kind: kind, content_key: key }));
  },
  async listProgress(s) {
    const sb = await supabaseServer();
    return (check(await sb.from("affiliate_progress").select("item_key").eq("affiliate_id", mustAffiliate(s))) as any[]).map((r) => r.item_key);
  },
  async setProgress(s, key, done) {
    const sb = await supabaseServer();
    const aff = mustAffiliate(s);
    if (done) check(await sb.from("affiliate_progress").upsert({ affiliate_id: aff, item_key: key }));
    else check(await sb.from("affiliate_progress").delete().match({ affiliate_id: aff, item_key: key }));
  },
  async getPerformance(s): Promise<PerformanceRow[]> {
    mustAffiliate(s);
    const sb = await supabaseServer();
    return (check(await sb.rpc("affiliate_performance")) as any[]).map((r) => ({
      dimension: r.dimension, refId: r.ref_id, clicks: Number(r.clicks), visitors: Number(r.visitors), ctaClicks: Number(r.cta_clicks),
      leads: Number(r.leads), checkouts: Number(r.checkouts), sales: Number(r.sales), revenueCents: Number(r.revenue_cents),
      commissionCents: Number(r.commission_cents), commissionPendingCents: Number(r.commission_pending_cents),
    }));
  },
  async createSalesPage(s, input) {
    const sb = await supabaseServer();
    const { data, error } = await sb.from("private_sales_pages").insert({ ...fromPageInput(input), affiliate_id: mustAffiliate(s) }).select("*").single();
    if (error) throw new Error(error.code === "23505" ? "path_taken" : error.message);
    return toPage(data);
  },
  async updateSalesPage(s, id, input) {
    const sb = await supabaseServer();
    const { error } = await sb.from("private_sales_pages").update(fromPageInput(input)).eq("id", id).eq("affiliate_id", mustAffiliate(s));
    if (error) throw new Error(error.code === "23505" ? "path_taken" : error.message);
  },
  async archiveSalesPage(s, id) {
    const sb = await supabaseServer();
    check(await sb.from("private_sales_pages").update({ archived_at: new Date().toISOString(), is_active: false }).eq("id", id).eq("affiliate_id", mustAffiliate(s)));
  },
  async createLink(s, input) {
    const sb = await supabaseServer();
    const l = check(await sb.from("affiliate_links").insert({
      affiliate_id: mustAffiliate(s), name: input.name, private_page_id: input.pageId, market_id: input.marketId, channel: input.channel,
      destination: input.pageId ? "private_page" : "studio",
    }).select("*").single()) as any;
    return { id: l.id, code: l.code, name: l.name, campaignId: null, campaignName: null, source: input.channel, marketId: input.marketId, isDefault: false,
      createdAt: l.created_at, pageId: input.pageId, channel: input.channel,
      stats: { clicks: 0, uniqueVisitors: 0, leads: 0, conversions: 0, revenueCents: 0, commissionCents: 0 } };
  },

  async setMonthlyGoal(s, target) {
    const sb = await supabaseServer();
    const month = new Date(); month.setDate(1);
    check(await sb.from("goals").upsert({ affiliate_id: mustAffiliate(s), month: month.toISOString().slice(0, 10), target_sales: target }));
  },

  async updateProfile(s, patch) {
    const sb = await supabaseServer();
    const row: Record<string, unknown> = {};
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.leaderboardOptIn !== undefined) row.leaderboard_opt_in = patch.leaderboardOptIn;
    check(await sb.from("profiles").update(row).eq("id", s.userId));
  },

  async setOnboardingStep(s, step, completed) {
    const sb = await supabaseServer();
    const row: Record<string, unknown> = { onboarding_step: Math.max(step, s.affiliate?.onboardingStep ?? 0) };
    if (completed) row.onboarding_completed_at = new Date().toISOString();
    check(await sb.from("affiliates").update(row).eq("id", mustAffiliate(s)));
  },

  async exportMyData(s) {
    const sb = await supabaseServer();
    const aff = s.affiliate?.id ?? "";
    const tables = ["prospects", "campaigns", "affiliate_links", "private_sales_pages", "commissions", "payouts", "goals"] as const;
    const out: Record<string, unknown> = {
      profile: check(await sb.from("profiles").select("*").eq("id", s.userId).single()),
      affiliate: check(await sb.from("affiliates").select("*").eq("id", aff).maybeSingle()),
    };
    for (const t of tables) out[t] = check(await sb.from(t).select("*").eq("affiliate_id", aff));
    await sb.from("privacy_requests").insert({ profile_id: s.userId, kind: "export", status: "completed", completed_at: new Date().toISOString() });
    return out;
  },

  async requestErasure(s) {
    const sb = await supabaseServer();
    check(await sb.from("privacy_requests").insert({ profile_id: s.userId, kind: "erasure" }));
  },

  // ------------------------------------------------------------- admin
  // Staff reads run under the user's JWT: RLS grants staff access via is_staff().
  async adminOverview() {
    const sb = await supabaseServer();
    const since30 = new Date(Date.now() - 30 * DAY).toISOString();
    const in60 = new Date(Date.now() + 60 * DAY).toISOString();
    const [aff, apps, clicks, leads, sales, coms, payouts, renewals, fraud] = await Promise.all([
      sb.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "approved"),
      sb.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("clicks").select("id", { count: "exact", head: true }).gte("occurred_at", since30),
      sb.from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
      sb.from("sales").select("gross_amount_cents").eq("status", "paid"),
      sb.from("commissions").select("amount_cents").in("status", ["pending", "disputed", "available"]),
      sb.from("payouts").select("amount_cents").eq("status", "paid"),
      sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").lte("current_period_end", in60),
      sb.from("fraud_flags").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    ]);
    const sum = (r: any, k: string) => (check(r) as any[]).reduce((a, x) => a + x[k], 0);
    return {
      affiliates: aff.count ?? 0, applications: apps.count ?? 0, clicks30d: clicks.count ?? 0, leads: leads.count ?? 0,
      sales: (sales.data ?? []).length, revenueCents: sum(sales, "gross_amount_cents"), commissionsOwedCents: sum(coms, "amount_cents"),
      paidOutCents: sum(payouts, "amount_cents"), renewals60d: renewals.count ?? 0, openFraudFlags: fraud.count ?? 0,
    };
  },

  async adminListAffiliates() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("affiliates").select("*, profiles(full_name, email), commissions(status, amount_cents), sales(status)").is("deleted_at", null).order("created_at", { ascending: false })) as any[];
    return rows.map((r): AdminAffiliateRow => ({
      id: r.id, name: r.profiles?.full_name ?? "—", email: r.profiles?.email ?? "—", code: r.code, status: r.status, country: r.country,
      sales: (r.sales ?? []).filter((x: any) => x.status === "paid").length,
      availableCents: (r.commissions ?? []).filter((c: any) => c.status === "available").reduce((a: number, c: any) => a + c.amount_cents, 0),
      createdAt: r.created_at, application: r.application ?? {},
    })).sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  },

  async adminSetAffiliateStatus(_s, affiliateId, status, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_set_affiliate_status", { p_affiliate_id: affiliateId, p_status: status, p_reason: reason }));
  },

  async adminListSales() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("sales").select("*, customers(public_ref, company_name), commissions(amount_cents, status), campaigns(name, source), affiliates(id, profiles(full_name)), subscriptions(current_period_end, status)").order("created_at", { ascending: false }).limit(500)) as any[];
    return rows.map((r) => ({
      id: r.id, ref: r.public_ref, customerRef: r.customers?.public_ref ?? "—", customerName: r.customers?.company_name ?? null,
      product: "Studio ATS", date: r.created_at, status: r.status, kind: r.kind, amountCents: r.gross_amount_cents,
      commissionCents: r.commissions?.[0]?.amount_cents ?? null, commissionStatus: r.commissions?.[0]?.status ?? null,
      renewalDate: r.subscriptions?.status === "active" ? r.subscriptions.current_period_end : null,
      source: r.campaigns?.source ?? null, campaign: r.campaigns?.name ?? null,
      affiliateId: r.affiliate_id, affiliateName: r.affiliates?.profiles?.full_name ?? null, isDemo: r.is_demo,
    }));
  },

  async adminSetSaleStatus(_s, saleId, status, reason) {
    // Payment status normally arrives through the payment-provider webhook.
    const sb = await supabaseServer();
    check(await sb.rpc("staff_set_sale_status", { p_sale_id: saleId, p_status: status, p_reason: reason }));
  },

  async adminListLeads() {
    const sb = await supabaseServer();
    return (check(await sb.from("leads").select("*, affiliates(profiles(full_name))").is("deleted_at", null).order("created_at", { ascending: false }).limit(300)) as any[])
      .map((r) => ({ id: r.id, fullName: r.full_name, company: r.company, profession: r.profession, email: r.email, affiliateId: r.affiliate_id, affiliateName: r.affiliates?.profiles?.full_name ?? null, status: r.status, createdAt: r.created_at }));
  },

  async adminCreateSaleFromLead(_s, leadId, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_create_sale_from_lead", { p_lead_id: leadId, p_reason: reason }));
  },

  async adminCorrectAttribution(_s, saleId, affiliateId, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_correct_attribution", { p_sale_id: saleId, p_new_affiliate_id: affiliateId, p_reason: reason }));
  },

  async adminListCommissions() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("commissions").select("*, sales(public_ref, customers(public_ref)), affiliates(profiles(full_name))").order("created_at", { ascending: false }).limit(500)) as any[];
    return rows.map((r) => ({
      ...toCommission({ ...r, sales: { public_ref: r.sales?.public_ref, customer_ref: r.sales?.customers?.public_ref } }),
      affiliateId: r.affiliate_id, affiliateName: r.affiliates?.profiles?.full_name ?? "—", kind: r.kind ?? null,
      currency: String(r.currency).trim(), disputeReason: r.dispute_reason ?? null, recoveryStatus: r.recovery_status ?? null,
    }));
  },

  async adminHoldCommission(_s, id, hold, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_set_commission_hold", { p_commission_id: id, p_hold: hold, p_reason: reason }));
  },
  async adminReverseCommission(_s, id, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_reverse_commission", { p_commission_id: id, p_reason: reason }));
  },
  async adminReleaseDue() {
    return Number(check(await supabaseService().rpc("release_due_commissions")));
  },
  async adminValidateCommission(_s, id, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_validate_commission", { p_commission_id: id, p_reason: reason }));
  },
  async adminAdjustLedger(_s, affiliateId, amountCents, currency, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_ledger_adjustment", { p_affiliate_id: affiliateId, p_amount_cents: amountCents, p_currency: currency, p_reason: reason }));
  },
  async adminFinanceSummary(_s, f): Promise<AdminFinanceSummary> {
    const sb = await supabaseServer();
    const r = check(await sb.rpc("admin_finance_summary", {
      p_from: f.from || null, p_to: f.to || null, p_affiliate_id: f.affiliateId || null, p_product_id: f.productId || null,
      p_status: f.status || null, p_country: f.country || null, p_campaign_id: f.campaignId || null, p_currency: f.currency ?? "EUR",
    })) as any;
    const n = (k: string) => Number(r?.[k] ?? 0);
    return {
      currency: r.currency, grossRevenueCents: n("gross_revenue_cents"), attributedRevenueCents: n("attributed_revenue_cents"),
      salesCount: n("sales_count"), renewalsCount: n("renewals_count"), pendingCommissionsCents: n("pending_commissions_cents"),
      disputedCommissionsCents: n("disputed_commissions_cents"), availableCommissionsCents: n("available_commissions_cents"),
      paidCommissionsCents: n("paid_commissions_cents"), reversedCommissionsCents: n("reversed_commissions_cents"),
      recoveryRequiredCount: n("recovery_required_count"), refundsCents: n("refunds_cents"), chargebacksCount: n("chargebacks_count"),
      chargebacksCents: n("chargebacks_cents"), openDisputesCount: n("open_disputes_count"), activeSubscriptions: n("active_subscriptions"),
      upcomingRenewals60d: n("upcoming_renewals_60d"), cancellingSubscriptions: n("cancelling_subscriptions"),
      webhooksFailed: n("webhooks_failed"), webhooksLastReceivedAt: r.webhooks_last_received_at ?? null, emailsFailed: n("emails_failed"),
    };
  },
  async adminFinanceOptions() {
    const sb = await supabaseServer();
    const [affs, products, campaigns, countries] = await Promise.all([
      sb.from("affiliates").select("id, profiles(full_name)").is("deleted_at", null),
      sb.from("products").select("id, name").is("deleted_at", null).order("sort"),
      sb.from("campaigns").select("id, name").is("archived_at", null).order("name").limit(500),
      sb.from("customers").select("country").not("country", "is", null).limit(5000),
    ]);
    return {
      affiliates: (check(affs) as any[]).map((a) => ({ id: a.id, name: a.profiles?.full_name || a.id.slice(0, 8) })).sort((a, b) => a.name.localeCompare(b.name)),
      products: (check(products) as any[]).map((p) => ({ id: p.id, name: p.name })),
      campaigns: (check(campaigns) as any[]).map((c) => ({ id: c.id, name: c.name })),
      countries: [...new Set((check(countries) as any[]).map((c) => String(c.country).trim()))].sort(),
    };
  },

  async adminPayoutCandidates() {
    const sb = await supabaseServer();
    const [rows, settings] = await Promise.all([
      sb.from("commissions").select("affiliate_id, amount_cents, affiliates(profiles(full_name))").eq("status", "available").is("payout_id", null),
      supabaseRepo.getSettings(),
    ]);
    const m = new Map<string, { affiliateId: string; affiliateName: string; availableCents: number }>();
    for (const r of check(rows) as any[]) {
      const e = m.get(r.affiliate_id) ?? { affiliateId: r.affiliate_id, affiliateName: r.affiliates?.profiles?.full_name ?? "—", availableCents: 0 };
      e.availableCents += r.amount_cents;
      m.set(r.affiliate_id, e);
    }
    return [...m.values()].filter((x) => x.availableCents >= settings.payoutMinimumCents);
  },
  async adminListPayouts() {
    const sb = await supabaseServer();
    return (check(await sb.from("payouts").select("*, affiliates(profiles(full_name))").order("created_at", { ascending: false }).limit(200)) as any[])
      .map((r) => ({ id: r.id, ref: r.public_ref, amountCents: r.amount_cents, status: r.status, scheduledFor: r.scheduled_for, paidAt: r.paid_at, documentPath: r.document_path, affiliateName: r.affiliates?.profiles?.full_name ?? "—" }));
  },
  async adminCreatePayout(_s, affiliateId) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_create_payout", { p_affiliate_id: affiliateId }));
  },
  async adminMarkPayoutPaid(_s, payoutId, providerRef) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_mark_payout_paid", { p_payout_id: payoutId, p_provider_ref: providerRef }));
  },

  async adminListFraudFlags() {
    const sb = await supabaseServer();
    return (check(await sb.from("fraud_flags").select("*, affiliates(profiles(full_name))").order("created_at", { ascending: false }).limit(200)) as any[])
      .map((r) => ({ id: r.id, type: r.type, severity: r.severity, affiliateName: r.affiliates?.profiles?.full_name ?? null, entity: r.entity, entityId: r.entity_id, signals: r.signals, status: r.status, decisionNote: r.decision_note, createdAt: r.created_at }));
  },
  async adminReviewFraudFlag(_s, id, status, note) {
    const sb = await supabaseServer();
    check(await sb.rpc("staff_review_fraud_flag", { p_flag_id: id, p_status: status, p_note: note }));
  },
  async adminListAuditLogs() {
    const sb = await supabaseServer();
    return (check(await sb.from("audit_logs").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(300)) as any[])
      .map((r) => ({ id: String(r.id), actor: r.profiles?.full_name ?? "system", action: r.action, entity: r.entity, entityId: r.entity_id, reason: r.reason, before: r.before, after: r.after, createdAt: r.created_at }));
  },
  async adminUpdateSettings(s, patch) {
    const sb = await supabaseServer();
    const map: Record<string, [string, unknown]> = {};
    if (patch.attributionWindowDays !== undefined) map.a = ["attribution.window_days", patch.attributionWindowDays];
    if (patch.attributionModel !== undefined) map.b = ["attribution.model", patch.attributionModel];
    if (patch.commissionValidationDays !== undefined) map.c = ["commission.validation_days", patch.commissionValidationDays];
    if (patch.payoutMinimumCents !== undefined) map.d = ["payout.minimum_cents", patch.payoutMinimumCents];
    if (patch.leaderboardEnabled !== undefined) map.e = ["leaderboard.enabled", patch.leaderboardEnabled];
    if (patch.autoApprove !== undefined) map.f = ["affiliates.auto_approve", patch.autoApprove];
    if (patch.refundPartialPolicy !== undefined) map.g = ["refund.partial_policy", patch.refundPartialPolicy];
    if (patch.billingEmailsOwner !== undefined) map.h = ["emails.customer_billing_owner", patch.billingEmailsOwner];
    if (patch.connectEnabled !== undefined) map.i = ["payouts.connect_enabled", patch.connectEnabled];
    if (patch.checkoutEnabled !== undefined) map.j = ["checkout.enabled", patch.checkoutEnabled];
    for (const [key, value] of Object.values(map)) {
      check(await sb.from("settings").update({ value, updated_by: s.userId, updated_at: new Date().toISOString() }).eq("key", key));
    }
    await supabaseService().from("audit_logs").insert({ actor_id: s.userId, action: "settings.update", entity: "settings", entity_id: "global", after: patch });
  },

  async adminListMarkets() {
    const sb = await supabaseServer();
    const rows = check(await sb.from("markets").select("*").order("sort")) as any[];
    return rows.map((r) => ({ id: r.id, slug: r.slug, icon: r.icon ?? "sparkles", sort: r.sort, content: r.content, active: r.is_active }));
  },

  async adminUpdateMarket(s, marketId, locale, content, isActive) {
    const sb = await supabaseServer();
    const row = check(await sb.from("markets").select("content").eq("id", marketId).single()) as any;
    check(await sb.from("markets").update({ content: { ...row.content, [locale]: content }, is_active: isActive }).eq("id", marketId));
    await supabaseService().from("audit_logs").insert({ actor_id: s.userId, action: "market.update", entity: "market", entity_id: marketId, before: row.content?.[locale] ?? null, after: content });
  },

  async adminListSalesContent() {
    const sb = await supabaseServer();
    return (check(await sb.from("sales_content").select(CONTENT_COLS).order("kind").order("sort").order("key").order("version", { ascending: false })) as any[]).map(toContent);
  },
  async adminGetSalesContent(_s, id) {
    const sb = await supabaseServer();
    const r = check(await sb.from("sales_content").select(CONTENT_COLS).eq("id", id).maybeSingle());
    return r ? toContent(r) : null;
  },
  async adminSaveSalesContent(s, id, i) {
    const sb = await supabaseServer();
    const row = {
      kind: i.kind, key: i.key, locale: i.locale, title: i.title, summary: i.summary, target_key: i.targetKey, channel: i.channel,
      stage: i.stage, tags: i.tags, sort: i.sort, body: i.body, updated_by: s.userId,
    };
    if (id) {
      // RLS: staff only; guard_sales_content rejects edits of published rows.
      check(await sb.from("sales_content").update(row).eq("id", id).eq("status", "draft"));
      return { id };
    }
    const { data: prev } = await sb.from("sales_content").select("version").match({ kind: i.kind, key: i.key, locale: i.locale }).order("version", { ascending: false }).limit(1).maybeSingle();
    const product = check(await sb.from("products").select("id").eq("slug", "studio").single()) as any;
    const r = check(await sb.from("sales_content").insert({ ...row, version: ((prev as any)?.version ?? 0) + 1, status: "draft", product_id: product.id, created_by: s.userId }).select("id").single()) as any;
    return { id: r.id };
  },
  async adminSetSalesContentStatus(_s, id, status, reason) {
    const sb = await supabaseServer();
    check(await sb.rpc(status === "active" ? "staff_publish_sales_content" : "staff_archive_sales_content", { p_id: id, p_reason: reason }));
  },
  async adminNewSalesContentVersion(_s, id, locale) {
    const sb = await supabaseServer();
    return { id: check(await sb.rpc("staff_new_sales_content_version", { p_from: id, p_locale: locale })) as string };
  },
  async adminDeleteSalesContentDraft(_s, id) {
    const sb = await supabaseServer();
    check(await sb.from("sales_content").delete().eq("id", id).eq("status", "draft"));
  },
  async adminSalesAnalytics(_s, sinceDays): Promise<SalesAnalytics> {
    const sb = await supabaseServer();
    return check(await sb.rpc("admin_sales_center_analytics", { p_since: new Date(Date.now() - sinceDays * DAY).toISOString() })) as SalesAnalytics;
  },
  async adminListSalesPages() {
    const sb = await supabaseServer();
    return (check(await sb.from("private_sales_pages").select("*, affiliates(profiles(full_name))").order("created_at", { ascending: false }).limit(500)) as any[])
      .map((r) => ({ ...toPage(r), affiliateName: r.affiliates?.profiles?.full_name ?? null }));
  },
  async adminSetSalesPageActive(s, id, active, reason) {
    const sb = await supabaseServer();
    check(await sb.from("private_sales_pages").update({ is_active: active }).eq("id", id));
    await supabaseService().from("audit_logs").insert({ actor_id: s.userId, action: "sales_page.active", entity: "private_sales_page", entity_id: id, after: { active }, reason });
  },
};
