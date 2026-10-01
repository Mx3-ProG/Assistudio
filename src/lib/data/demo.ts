import "server-only";
import { cookies } from "next/headers";
import {
  computeCommissionCents, newCommission, summarize, transition,
  type CommissionEvent, type CommissionState, type SaleStatus,
} from "@/lib/commission";
import { defaultMarkets, type Market, type MarketContent } from "@/content/markets";
import { assetsFor } from "@/content/sales-kit";
import { maxEarningOffer } from "@/lib/offers";
import { defaultSalesContent } from "@/content/sales-center/content";
import type { SalesContent, ContentKind } from "@/lib/sales/content";
import type { Repo, Range, SignupData } from "./repo";
import { CODE_TTL_SECONDS, MAX_ATTEMPTS, RESEND_AFTER_SECONDS, generateCode, type CodePurpose } from "@/lib/auth-code";
import { summarizeBook } from "./book";
import { createDemoMessaging } from "./messaging.demo";
import type {
  Session, Settings, Offer, TrackingLink, PrivatePage, Prospect, SaleRow, CommissionRow,
  Payout, Notification, ActivityEvent, ActivityType, FraudFlag, AuditLog, AffiliateStatus, Role,
  ClickInput, LeadInput, ReferralTarget, LinkStats, RecurringContract, SubscriptionStatus,
  PerformanceRow, ProductView,
  PromoCode, ProspectEvent,
} from "./types";
import type { Locale } from "@/i18n/config";

/**
 * DEMO STORE — development only.
 * Every record here is fake and flagged `isDemo`. The UI shows a permanent
 * "Demo data" banner whenever this implementation is active.
 */

export const DEMO_SESSION_COOKIE = "studio_demo_session";

const DAY = 86_400_000;
const now = () => Date.now();
const iso = (t: number) => new Date(t).toISOString();
const daysAgo = (d: number) => iso(now() - d * DAY);
let seq = 0;
const id = (p: string) => `${p}_${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Deterministic PRNG so the demo looks the same on every restart.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

interface DemoUser {
  userId: string;
  email: string;
  role: Role;
  fullName: string;
  displayName: string | null;
  leaderboardOptIn: boolean;
  affiliateId: string | null;
}
interface DemoAffiliate {
  id: string;
  userId: string;
  code: string;
  slug: string | null;
  status: AffiliateStatus;
  country: string | null;
  onboardingStep: number;
  onboardingCompletedAt: string | null;
  monthlyGoalSales: number | null;
  createdAt: string;
  application: Record<string, unknown>;
  sponsorId: string | null;
}
interface DemoLink { id: string; affiliateId: string; code: string; name: string; campaignId: string | null; isDefault: boolean; createdAt: string; pageId?: string | null; marketId?: string | null; channel?: string | null }
interface DemoCampaign { id: string; affiliateId: string; name: string; source: string | null; marketId: string | null; createdAt: string }
interface DemoClick { id: string; affiliateId: string; linkId: string | null; visitorId: string; at: string; country: string; device: string; isBot: boolean; pageId?: string | null; campaignId?: string | null }
interface DemoLead { id: string; fullName?: string; affiliateId: string | null; linkId: string | null; campaignId: string | null; email: string; profession: string | null; company: string | null; status: string; createdAt: string; pageId?: string | null }
interface DemoCustomer { id: string; ref: string; name: string; email: string }
interface DemoSubscription { id: string; customerId: string; affiliateId: string; startedAt: string; periodEnd: string; status: SubscriptionStatus; cancelling: boolean }
interface DemoSale {
  id: string; ref: string; customerId: string; affiliateId: string | null; subscriptionId: string | null;
  linkId: string | null; campaignId: string | null; kind: "new" | "renewal"; status: SaleStatus;
  amountCents: number; createdAt: string; paidAt: string | null;
}
interface DemoCommission extends CommissionState { id: string; affiliateId: string; saleId: string; payoutId: string | null; expectedPaymentDate: string | null; createdAt: string; kind: "new" | "renewal"; disputeReason: string | null }
/** Clawbacks (negative) and manual adjustments not tied to a commission status — netted into `available`. */
interface DemoLedgerExtra { id: string; affiliateId: string; amountCents: number; type: "clawback" | "adjustment"; reason: string; settledBy: string | null; createdAt: string }
interface DemoPayout { id: string; ref: string; affiliateId: string; amountCents: number; status: Payout["status"]; scheduledFor: string; paidAt: string | null }
interface DemoActivity extends ActivityEvent { affiliateId: string }
interface DemoNotification extends Notification { userId: string }
interface DemoPromoCode extends PromoCode { affiliateId: string }

interface Store {
  markets: (Market & { active: boolean })[];
  settings: Settings;
  /** Studio Premium — the offer every demo sale uses. */
  offer: Offer;
  offers: Offer[];
  users: DemoUser[];
  affiliates: DemoAffiliate[];
  links: DemoLink[];
  campaigns: DemoCampaign[];
  clicks: DemoClick[];
  leads: DemoLead[];
  prospects: (Prospect & { affiliateId: string; deletedAt: string | null })[];
  prospectEvents: (ProspectEvent & { affiliateId: string })[];
  customers: DemoCustomer[];
  subscriptions: DemoSubscription[];
  sales: DemoSale[];
  commissions: DemoCommission[];
  ledgerExtras: DemoLedgerExtra[];
  payouts: DemoPayout[];
  pages: PrivatePage[];
  activity: DemoActivity[];
  notifications: DemoNotification[];
  promoCodes: DemoPromoCode[];
  fraud: (FraudFlag & { affiliateId: string | null })[];
  audit: AuditLog[];
  goals: Record<string, number>;
  privacyRequests: { userId: string; kind: string; at: string }[];
  // V0.3 Sales Center
  content: SalesContent[];
  favorites: { affiliateId: string; kind: string; key: string }[];
  progress: { affiliateId: string; key: string }[];
  events: { affiliateId: string | null; event: string; pageId: string | null; linkId: string | null; campaignId: string | null; contentKind: string | null; contentKey: string | null; at: string }[];
}

function seed(): Store {
  const r = rng(42);
  const settings: Settings = {
    attributionWindowDays: 90,
    attributionModel: "last_click",
    commissionValidationDays: 30,
    payoutMinimumCents: 5000,
    leaderboardEnabled: true,
    autoApprove: false,
    refundPartialPolicy: "manual_review",
    billingEmailsOwner: "stripe",
    connectEnabled: false,
    checkoutEnabled: true,
    sponsorRate: 0.05,
  };
  // Mirrors supabase/migrations/20260928000001_offers_v3.sql (same rate on every offer).
  const offers: Offer[] = [
    { id: "offer_studio_one", productId: "prod_studio", productName: "Studio ATS", tier: "one",
      priceCents: 50_000, currency: "EUR", interval: "one_time", commissionRate: 0.25, recurring: false },
    { id: "offer_studio_pro", productId: "prod_studio", productName: "Studio ATS", tier: "pro",
      priceCents: 300_000, currency: "EUR", interval: "year", commissionRate: 0.25, recurring: true },
    { id: "offer_studio_annual", productId: "prod_studio", productName: "Studio ATS", tier: "premium",
      priceCents: 600_000, currency: "EUR", interval: "year", commissionRate: 0.25, recurring: true },
  ];
  const offer = maxEarningOffer(offers);

  const s: Store = {
    markets: structuredClone(defaultMarkets).map((m) => ({ ...m, active: true })),
    settings, offer, offers, users: [], affiliates: [], links: [], campaigns: [], clicks: [], leads: [],
    prospects: [], prospectEvents: [], customers: [], subscriptions: [], sales: [], commissions: [], ledgerExtras: [], payouts: [], pages: [],
    activity: [], notifications: [], promoCodes: [], fraud: [], audit: [], goals: {}, privacyRequests: [],
    content: defaultSalesContent.map((c, i) => ({
      id: `cnt_${i}`, kind: c.kind, key: c.key, locale: c.locale, version: 1, status: c.status, productId: "prod_studio",
      targetKey: c.targetKey ?? null, channel: c.channel ?? null, stage: c.stage ?? null, title: c.title, summary: c.summary ?? null,
      body: c.body, tags: c.tags ?? [], sort: c.sort ?? 0, publishedAt: c.status === "active" ? daysAgo(20) : null, updatedAt: daysAgo(20),
    }) as SalesContent),
    favorites: [], progress: [], events: [],
  };

  const mkAffiliate = (
    key: string, fullName: string, displayName: string | null, code: string, slug: string | null,
    status: AffiliateStatus, optIn: boolean, role: Role = "affiliate", createdDaysAgo = 200,
  ) => {
    const userId = `usr_${key}`;
    const affId = `aff_${key}`;
    s.users.push({ userId, email: `${key}@demo.studio.invalid`, role, fullName, displayName, leaderboardOptIn: optIn, affiliateId: affId });
    s.affiliates.push({
      id: affId, userId, code, slug, status, country: "FR", createdAt: daysAgo(createdDaysAgo),
      onboardingStep: status === "approved" ? 5 : 0, onboardingCompletedAt: status === "approved" ? daysAgo(createdDaysAgo - 1) : null,
      monthlyGoalSales: null, application: { channels: "LinkedIn, network", motivation: "Demo application" }, sponsorId: null,
    });
    s.links.push({ id: `lnk_${key}`, affiliateId: affId, code: `${code}01`, name: "Default", campaignId: null, isDefault: true, createdAt: daysAgo(createdDaysAgo) });
    return affId;
  };

  const me = mkAffiliate("mathieu", "Mathieu Demo", null, "MTH4D2", "mathieu", "approved", false, "affiliate", 210);
  const alex = mkAffiliate("alex", "Alex Demo", "Alex", "ALX7K9", "alex", "approved", true, "affiliate", 320);
  const sofia = mkAffiliate("sofia", "Sofia Demo", "Sofia", "SOF3P8", null, "approved", true, "affiliate", 260);
  const marc = mkAffiliate("marc", "Marc Demo", null, "MRC5T2", null, "approved", true, "affiliate", 150);
  s.affiliates.find((a) => a.id === alex)!.sponsorId = me;
  s.affiliates.find((a) => a.id === sofia)!.sponsorId = me;
  mkAffiliate("jordan", "Jordan Demo", null, "JRD8W4", null, "pending", false, "affiliate", 2);
  mkAffiliate("lea", "Léa Demo", null, "LEA2N6", null, "pending", false, "affiliate", 1);
  s.users.push({ userId: "usr_admin", email: "admin@demo.studio.invalid", role: "super_admin", fullName: "Admin Demo", displayName: null, leaderboardOptIn: false, affiliateId: null });
  s.goals[me] = 5;

  // Campaigns for the demo affiliate
  const campaignDefs: [string, string, string | null, number][] = [
    ["Instagram Bio", "instagram", null, 150],
    ["LinkedIn", "linkedin", "mkt_b2b-consultants", 120],
    ["Cold Email September", "email", "mkt_architects", 25],
    ["Wedding Planners Marseille", "email", "mkt_wedding-planners", 40],
    ["Architects Paris", "linkedin", "mkt_architects", 18],
  ];
  const campaignLinks = campaignDefs.map(([name, source, marketId, age], i) => {
    const cid = `cmp_${i}`;
    s.campaigns.push({ id: cid, affiliateId: me, name, source, marketId, createdAt: daysAgo(age) });
    const lid = `lnk_cmp_${i}`;
    s.links.push({ id: lid, affiliateId: me, code: `MTH4D2C${i}`, name, campaignId: cid, isDefault: false, createdAt: daysAgo(age) });
    return { lid, cid, age };
  });

  // 243 clicks for the demo affiliate over ~120 days
  const countries = ["FR", "FR", "FR", "BE", "CH", "ES", "DE", "GB"];
  const devices = ["mobile", "mobile", "desktop", "desktop", "tablet"];
  for (let i = 0; i < 243; i++) {
    const pick = r();
    const link = pick < 0.35 ? `lnk_mathieu` : campaignLinks[Math.floor(r() * campaignLinks.length)].lid;
    s.clicks.push({
      id: `clk_${i}`, affiliateId: me, linkId: link, visitorId: `vis_${Math.floor(r() * 180)}`,
      at: daysAgo(Math.floor(r() * 120) + r()), country: countries[Math.floor(r() * countries.length)],
      device: devices[Math.floor(r() * devices.length)], isBot: false,
    });
  }
  for (const [aff, n] of [[alex, 410], [sofia, 280], [marc, 90]] as const) {
    for (let i = 0; i < n; i++) {
      s.clicks.push({ id: `clk_${aff}_${i}`, affiliateId: aff, linkId: null, visitorId: `vis_${aff}_${Math.floor(r() * n)}`, at: daysAgo(Math.floor(r() * 150)), country: "FR", device: "mobile", isBot: false });
    }
  }

  // Leads
  const professions = ["Photographer", "Architect", "Wedding planner", "Interior designer", "Landscaper", "B2B consultant"];
  for (let i = 0; i < 9; i++) {
    const c = campaignLinks[i % campaignLinks.length];
    s.leads.push({
      id: `led_${i}`, affiliateId: me, linkId: c.lid, campaignId: c.cid, email: `lead${i}@example.invalid`,
      profession: professions[i % professions.length], company: `Demo Studio ${i + 1}`,
      status: i < 4 ? "converted" : i < 6 ? "appointment_requested" : "new", createdAt: daysAgo(100 - i * 10),
    });
  }

  // Sales for the demo affiliate — reproduces the spec example:
  // €5,400 earned (€3,600 paid + €1,800 available), €1,800 pending, 3 active clients.
  // V0.2: a commission exists only once the payment is confirmed; it is
  // `pending` during the validation period, then `available`, then `paid`.
  const mkCommission = (affiliateId: string, sale: DemoSale, opts: { payout?: boolean } = {}) => {
    let { state } = newCommission(computeCommissionCents(sale.amountCents, offer.commissionRate), sale.paidAt!,
      settings.commissionValidationDays, { renewal: sale.kind === "renewal" });
    ({ state } = transition(state, { type: "release", at: iso(now()) }));
    if (state.status === "available") state = { ...state, availableAt: state.holdUntil };
    const com: DemoCommission = {
      ...state, id: id("com"), affiliateId, saleId: sale.id, payoutId: null, createdAt: sale.paidAt!, kind: sale.kind, disputeReason: null,
      expectedPaymentDate: iso(Date.parse(state.holdUntil!) + 7 * DAY).slice(0, 10),
    };
    if (opts.payout && com.status === "available") {
      const paidAt = iso(Date.parse(com.availableAt!) + 5 * DAY);
      const p: DemoPayout = { id: id("pay"), ref: `PAY-${String(s.payouts.length + 1).padStart(4, "0")}`, affiliateId, amountCents: com.amountCents, status: "paid", scheduledFor: paidAt.slice(0, 10), paidAt };
      s.payouts.push(p);
      Object.assign(com, transition(com, { type: "payout_paid", at: paidAt }).state, { payoutId: p.id });
    }
    s.commissions.push(com);
    return com;
  };
  const mkSale = (
    affiliateId: string, customerName: string, paidDaysAgo: number, opts: { payout?: boolean; linkIdx?: number } = {},
  ) => {
    const cust: DemoCustomer = { id: id("cus"), ref: `CUS-${String(s.customers.length + 1).padStart(4, "0")}`, name: customerName, email: `${customerName.toLowerCase().replace(/\W+/g, ".")}@example.invalid` };
    s.customers.push(cust);
    const link = opts.linkIdx !== undefined ? campaignLinks[opts.linkIdx] : null;
    const sub: DemoSubscription = {
      id: id("sub"), customerId: cust.id, affiliateId, startedAt: daysAgo(paidDaysAgo),
      periodEnd: iso(now() - paidDaysAgo * DAY + 365 * DAY), status: "active", cancelling: false,
    };
    s.subscriptions.push(sub);
    const sale: DemoSale = {
      id: id("sal"), ref: `SAL-${String(s.sales.length + 1).padStart(4, "0")}`, customerId: cust.id, affiliateId,
      subscriptionId: sub.id, linkId: link?.lid ?? null, campaignId: link?.cid ?? null, kind: "new", status: "paid",
      amountCents: offer.priceCents, createdAt: daysAgo(paidDaysAgo), paidAt: daysAgo(paidDaysAgo),
    };
    s.sales.push(sale);
    const com = mkCommission(affiliateId, sale, opts);
    return { sale, com, sub };
  };
  /** A renewal only exists once its payment is collected — same pipeline, kind = renewal. */
  const mkRenewal = (first: { sale: DemoSale; sub: DemoSubscription }, paidDaysAgo: number) => {
    const sale: DemoSale = { ...first.sale, id: id("sal"), ref: `SAL-${String(s.sales.length + 1).padStart(4, "0")}`, kind: "renewal", createdAt: daysAgo(paidDaysAgo), paidAt: daysAgo(paidDaysAgo) };
    s.sales.push(sale);
    first.sub.periodEnd = iso(now() - paidDaysAgo * DAY + 365 * DAY);
    return mkCommission(first.sale.affiliateId!, sale);
  };

  mkSale(me, "Atelier Lumière", 160, { payout: true, linkIdx: 0 });
  const verdier = mkSale(me, "Maison Verdier Architecture", 115, { payout: true, linkIdx: 2 });
  verdier.sub.cancelling = true; // cancellation scheduled: no renewal projected
  mkSale(me, "Bloom Wedding Co.", 62, { linkIdx: 3 });
  const horizon = mkSale(me, "Studio Horizon", 4, { linkIdx: 4 }); // paid 4 days ago → commission pending (validation period)
  const delorme = mkSale(me, "Cabinet Delorme", 380, { linkIdx: 1 });
  const delormeRenewal = mkRenewal(delorme, 15); // renewed 15 days ago → renewal commission pending

  // Other affiliates (leaderboard + admin)
  for (let i = 0; i < 14; i++) mkSale(alex, `Alex Client ${i + 1}`, Math.max(1, Math.min(135 - i * 3, 25 - i)));
  for (let i = 0; i < 8; i++) mkSale(sofia, `Sofia Client ${i + 1}`, Math.max(1, 20 - i * 2));
  mkSale(marc, "Marc Client 1", 12);
  const refunded = mkSale(marc, "Marc Client 2", 20);
  refunded.sale.status = "refunded";
  refunded.sub.status = "cancelled";
  Object.assign(refunded.com, transition(refunded.com, { type: "sale_status", status: "refunded", at: daysAgo(10), validationDays: 30 }).state);

  // Prospects (14 open opportunities + won/lost)
  const pnames: [string, string, string, Prospect["stage"], number | null][] = [
    ["Claire Martin", "Atelier Claire", "Photographer", "new", 1],
    ["Hugo Bernard", "Bernard Architectes", "Architect", "contacted", 0],
    ["Inès Petit", "Maison Inès", "Interior designer", "qualified", 2],
    ["Lucas Moreau", "Moreau Paysages", "Landscaper", "appointment", 3],
    ["Emma Laurent", "Laurent Events", "Event professional", "proposal", 5],
    ["Nathan Roux", "Roux Films", "Videographer", "new", null],
    ["Chloé Fournier", "Fournier Cuisines", "Kitchen designer", "contacted", 4],
    ["Louis Girard", "Girard Piscines", "Pool installer", "new", null],
    ["Jade Bonnet", "Bonnet Wedding", "Wedding planner", "replied", 1],
    ["Arthur Dupont", "Dupont Conseil", "B2B consultant", "contacted", 6],
    ["Léna Lambert", "Lambert Rénovation", "Renovation", "new", null],
    ["Raphaël Fontaine", "Fontaine Talent", "Recruitment firm", "appointment", 2],
    ["Manon Rousseau", "Rousseau Photo", "Photographer", "new", null],
    ["Tom Vincent", "Vincent & Co", "Architect", "proposal", 7],
    ["Sarah Muller", "Atelier Lumière", "Photographer", "won", null],
    ["Paul Lefèvre", "Lefèvre Design", "Interior designer", "lost", null],
  ];
  pnames.forEach(([name, company, profession, stage, next], i) => {
    s.prospects.push({
      id: `prs_${i}`, affiliateId: me, name, company, profession, email: `${name.split(" ")[0].toLowerCase()}@example.invalid`,
      phone: null, website: null, notes: null, source: i % 3 === 0 ? "Instagram" : i % 3 === 1 ? "LinkedIn" : "Referral",
      campaignId: null, marketId: null, stage, nextAction: next !== null ? (stage === "new" ? "Send first message" : stage === "proposal" ? "Follow up on proposal" : "Call back") : null,
      nextActionAt: next !== null ? iso(now() + next * DAY) : null, potentialValueCents: 600_000, createdAt: daysAgo(40 - i * 2), deletedAt: null,
      stageChangedAt: daysAgo(Math.max(0, 12 - i)),
    });
  });

  // Private page
  s.pages.push({
    id: "pg_demo", slug: "8FD7K2", affiliateId: me, marketId: "mkt_wedding-planners", campaignId: "cmp_3",
    locale: "fr", pitchVariant: "premium", ctaVariant: "request", displayName: "Mathieu", visibility: "private",
    isActive: true, viewCount: 37, createdAt: daysAgo(35),
    pathKey: null, templateKey: null, angleKey: null, productId: "prod_studio", ctaMode: "lead", showAdvisor: false, advisor: {}, indexable: false, archivedAt: null,
  });
  // V0.3 sales page (/a/mathieu/artisans) with a few demo visits and leads — fake, like every demo row.
  s.pages.push({
    id: "pg_artisans", slug: "ART5K3", affiliateId: me, marketId: "mkt_artisans", campaignId: null,
    locale: "fr", pitchVariant: "default", ctaVariant: "request", displayName: null, visibility: "unlisted",
    isActive: true, viewCount: 0, createdAt: daysAgo(12),
    pathKey: "artisans", templateKey: "studio-default", angleKey: "professional-presence", productId: "prod_studio", ctaMode: "lead",
    showAdvisor: true, advisor: { name: "Mathieu", title: "Studio ATS advisor", email: "mathieu@demo.studio.invalid" }, indexable: false, archivedAt: null,
  });
  for (let i = 0; i < 26; i++) {
    s.clicks.push({ id: `clk_pg_${i}`, affiliateId: me, linkId: "lnk_mathieu", pageId: "pg_artisans", visitorId: `vis_pg_${i % 19}`, at: daysAgo(Math.floor(r() * 12)), country: "FR", device: "mobile", isBot: false });
  }
  s.events.push(...Array.from({ length: 6 }, (_, i) => ({ affiliateId: me, event: "cta_click", pageId: "pg_artisans", linkId: null, campaignId: null, contentKind: null, contentKey: null, at: daysAgo(i) })));
  s.leads.push({ id: "led_pg_1", affiliateId: me, linkId: null, campaignId: null, pageId: "pg_artisans", email: "plombier@example.invalid", profession: "Plumber", company: "Demo Plomberie", status: "new", createdAt: daysAgo(2) });

  // Activity feed for the demo affiliate
  const acts: [ActivityType, number, Record<string, unknown>][] = [
    ["click", 0.02, { source: "instagram" }], ["visitor", 0.05, { country: "FR" }],
    ["payment_confirmed", 4, { sale_ref: horizon.sale.ref, gross_cents: 600_000, currency: "EUR" }],
    ["commission_pending", 4, { sale_ref: horizon.sale.ref, commission_cents: horizon.com.amountCents, currency: "EUR" }],
    ["renewal_confirmed", 15, { sale_ref: delorme.sale.ref, gross_cents: 600_000, currency: "EUR" }],
    ["commission_pending", 15, { commission_cents: delormeRenewal.amountCents, currency: "EUR" }],
    ["lead", 1, { profession: "Architect" }],
    ["appointment", 2, { profession: "Wedding planner" }], ["commission_available", 32, { commission_cents: 180_000, currency: "EUR" }],
    ["payment_confirmed", 62, { sale_ref: "SAL-0003" }], ["payout_completed", 80, { amount_cents: 180_000, currency: "EUR" }],
    ["click", 0.2, { source: "linkedin" }], ["lead", 6, { profession: "Photographer" }],
  ];
  for (const [type, ago, payload] of acts) s.activity.push({ id: id("act"), affiliateId: me, type, occurredAt: daysAgo(ago), payload });

  s.notifications.push(
    { id: id("ntf"), userId: "usr_mathieu", type: "lead", titleKey: "newLead", params: { profession: "Architect" }, href: "/dashboard", readAt: null, status: "unread", createdAt: daysAgo(1) },
    { id: id("ntf"), userId: "usr_mathieu", type: "sale", titleKey: "salePending", params: { sale_ref: horizon.sale.ref, commission_cents: 180_000, currency: "EUR" }, href: "/dashboard/commissions", readAt: null, status: "unread", createdAt: daysAgo(4) },
    { id: id("ntf"), userId: "usr_mathieu", type: "renewal", titleKey: "renewalPending", params: { sale_ref: delorme.sale.ref, commission_cents: 180_000, currency: "EUR" }, href: "/dashboard/commissions", readAt: null, status: "unread", createdAt: daysAgo(15) },
    { id: id("ntf"), userId: "usr_mathieu", type: "commission", titleKey: "commissionAvailable", params: { commission_cents: 180_000, currency: "EUR" }, href: "/dashboard/commissions", readAt: daysAgo(30), status: "read", createdAt: daysAgo(32) },
    { id: id("ntf"), userId: "usr_mathieu", type: "payout", titleKey: "payoutPaid", params: { amount_cents: 180_000, currency: "EUR" }, href: "/dashboard/payouts", readAt: daysAgo(70), status: "archived", createdAt: daysAgo(80) },
  );

  s.fraud.push(
    { id: "frd_1", type: "duplicate_lead", severity: 1, affiliateId: alex, affiliateName: "Alex Demo", entity: "lead", entityId: "led_x", signals: { email_seen: 2 }, status: "open", decisionNote: null, createdAt: daysAgo(2) },
    { id: "frd_2", type: "abnormal_clicks", severity: 2, affiliateId: marc, affiliateName: "Marc Demo", entity: "affiliate", entityId: marc, signals: { clicks_per_hour: 88, unique_visitors: 3 }, status: "open", decisionNote: null, createdAt: daysAgo(1) },
  );
  s.audit.push(
    { id: id("aud"), actor: "Admin Demo", action: "affiliate.status", entity: "affiliate", entityId: sofia, reason: "Application reviewed", before: { status: "pending" }, after: { status: "approved" }, createdAt: daysAgo(250) },
    { id: id("aud"), actor: "Admin Demo", action: "payout.paid", entity: "payout", entityId: "PAY-0001", reason: null, before: { status: "scheduled" }, after: { status: "paid" }, createdAt: daysAgo(80) },
  );
  return s;
}

interface DemoCode { purpose: CodePurpose; code: string; signup: SignupData | null; attempts: number; createdAt: number; expiresAt: number; consumed: boolean }
const demoCodes = () => ((g as { __studioDemoCodes?: Map<string, DemoCode> }).__studioDemoCodes ??= new Map());

// Bump when the Store shape changes so hot reloads don't keep a stale store.
const STORE_VERSION = 5;
const g = globalThis as unknown as { __studioDemo?: Store & { v?: number } };
function db(): Store {
  if (g.__studioDemo?.v !== STORE_VERSION) g.__studioDemo = Object.assign(seed(), { v: STORE_VERSION });
  return g.__studioDemo;
}

// ---------------------------------------------------------------- helpers
function mustAffiliate(s: Session) {
  if (!s.affiliate) throw new Error("No affiliate account");
  return s.affiliate.id;
}
function mustStaff(s: Session) {
  if (s.role !== "super_admin" && s.role !== "admin") throw new Error("forbidden");
}
function audit(s: Session, action: string, entity: string, entityId: string, before: unknown, after: unknown, reason: string | null) {
  db().audit.unshift({ id: id("aud"), actor: s.fullName, action, entity, entityId, reason, before, after, createdAt: iso(now()) });
}
function rangeStart(range: Range) {
  const d = { "7d": 7, "30d": 30, "90d": 90, "1y": 365, all: 3650 }[range];
  return now() - d * DAY;
}
function toLink(l: DemoLink): TrackingLink {
  const st = db();
  const c = l.campaignId ? st.campaigns.find((x) => x.id === l.campaignId) : null;
  return {
    id: l.id, code: l.code, name: l.name, campaignId: l.campaignId, campaignName: c?.name ?? null,
    source: c?.source ?? l.channel ?? null, marketId: c?.marketId ?? l.marketId ?? null, isDefault: l.isDefault, createdAt: l.createdAt,
    stats: statsFor((x) => x.linkId === l.id), pageId: l.pageId ?? null, channel: l.channel ?? c?.source ?? null,
  };
}
function statsFor(pred: (x: { linkId: string | null; affiliateId: string | null }) => boolean): LinkStats {
  const st = db();
  const clicks = st.clicks.filter((c) => pred(c) && !c.isBot);
  const leads = st.leads.filter(pred);
  const sales = st.sales.filter((x) => pred(x) && x.status === "paid");
  const revenue = sales.reduce((a, x) => a + x.amountCents, 0);
  const commission = st.commissions.filter((c) => sales.some((x) => x.id === c.saleId)).reduce((a, c) => a + c.amountCents, 0);
  return {
    clicks: clicks.length, uniqueVisitors: new Set(clicks.map((c) => c.visitorId)).size,
    leads: leads.length, conversions: sales.length, revenueCents: revenue, commissionCents: commission,
  };
}
function saleRow(x: DemoSale): SaleRow {
  const st = db();
  const cust = st.customers.find((c) => c.id === x.customerId)!;
  const com = st.commissions.find((c) => c.saleId === x.id);
  const sub = x.subscriptionId ? st.subscriptions.find((u) => u.id === x.subscriptionId) : null;
  const cmp = x.campaignId ? st.campaigns.find((c) => c.id === x.campaignId) : null;
  return {
    id: x.id, ref: x.ref, customerRef: cust.ref, customerName: cust.name, product: "Studio ATS", date: x.createdAt,
    status: x.status, kind: x.kind, amountCents: x.amountCents, commissionCents: com?.amountCents ?? null,
    commissionStatus: com?.status ?? null, renewalDate: sub?.status === "active" ? sub.periodEnd : null,
    source: cmp?.source ?? (x.linkId ? "link" : null), campaign: cmp?.name ?? null, isDemo: true,
  };
}
function commissionRow(c: DemoCommission): CommissionRow {
  const st = db();
  const sale = st.sales.find((x) => x.id === c.saleId)!;
  const cust = st.customers.find((x) => x.id === sale.customerId)!;
  return {
    id: c.id, kind: c.kind, saleRef: sale.ref, customerRef: cust.ref, grossCents: sale.amountCents, amountCents: c.amountCents,
    status: c.status, validatedAt: c.validatedAt, holdUntil: c.holdUntil, expectedPaymentDate: c.expectedPaymentDate,
    paidAt: c.paidAt, reversalReason: c.reversalReason, createdAt: c.createdAt,
  };
}
function applyCommissionEvent(c: DemoCommission, e: CommissionEvent) {
  const { state, moves } = transition(c, e);
  Object.assign(c, state);
  for (const m of moves) {
    if (m.type === "clawback") {
      db().ledgerExtras.push({ id: id("led"), affiliateId: c.affiliateId, amountCents: m.amountCents, type: "clawback", reason: m.note ?? "", settledBy: null, createdAt: iso(now()) });
    }
  }
}
function unsettled(affiliateId: string) {
  return db().ledgerExtras.filter((x) => x.affiliateId === affiliateId && !x.settledBy).reduce((a, x) => a + x.amountCents, 0);
}
function balancesOf(affiliateId: string) {
  return summarize(db().commissions.filter((c) => c.affiliateId === affiliateId), unsettled(affiliateId));
}
function affiliateName(affId: string | null) {
  if (!affId) return null;
  const a = db().affiliates.find((x) => x.id === affId);
  return db().users.find((u) => u.userId === a?.userId)?.fullName ?? null;
}

// ---------------------------------------------------------------- repo
export const demoRepo: Repo = {
  ...createDemoMessaging(
    () => ({ users: db().users, affiliates: db().affiliates }),
    (s, action, entityId, reason) => audit(s, action, "message_report", entityId, null, null, reason),
  ),

  async getSettings() { return db().settings; },
  async getOffer() { return db().offer; },
  async listOffers() { return db().offers; },
  async listMarkets() { return db().markets.filter((m) => m.active); },

  async resolveReferral(codeOrSlug) {
    const st = db();
    const key = codeOrSlug.toLowerCase();
    const link = st.links.find((l) => l.code.toLowerCase() === key);
    const aff = link
      ? st.affiliates.find((a) => a.id === link.affiliateId)
      : st.affiliates.find((a) => a.code.toLowerCase() === key || a.slug === key);
    if (!aff) return null;
    const user = st.users.find((u) => u.userId === aff.userId)!;
    const def = st.links.find((l) => l.affiliateId === aff.id && l.isDefault);
    const target: ReferralTarget = {
      affiliateId: aff.id, affiliateCode: aff.code, linkId: link?.id ?? def?.id ?? null, linkCode: link?.code ?? def?.code ?? null,
      campaignId: link?.campaignId ?? null, displayName: user.displayName ?? user.fullName.split(" ")[0], active: aff.status === "approved",
    };
    return target;
  },

  async getPrivatePage(slug) {
    const st = db();
    const p = st.pages.find((x) => x.slug.toLowerCase() === slug.toLowerCase() && x.isActive);
    if (!p) return null;
    const aff = st.affiliates.find((a) => a.id === p.affiliateId)!;
    const referral = await demoRepo.resolveReferral(aff.code);
    return referral ? { ...p, referral } : null;
  },

  async recordClick(input: ClickInput) {
    const st = db();
    const firstVisit = !st.clicks.some((c) => c.visitorId === input.visitorId);
    st.clicks.push({
      id: id("clk"), affiliateId: input.affiliateId, linkId: input.linkId, visitorId: input.visitorId, at: iso(now()),
      country: input.country ?? "—", device: input.deviceType, isBot: input.isBot,
    });
    if (!input.isBot) {
      st.activity.push({ id: id("act"), affiliateId: input.affiliateId, type: firstVisit ? "visitor" : "click", occurredAt: iso(now()), payload: { source: input.utm.source ?? null } });
    }
  },

  async recordPrivatePageView(pageId) {
    const p = db().pages.find((x) => x.id === pageId);
    if (p) p.viewCount += 1;
  },

  async createLead(input: LeadInput) {
    const st = db();
    const lead: DemoLead = {
      id: id("led"), fullName: input.fullName, affiliateId: input.affiliateId, linkId: input.linkId, campaignId: input.campaignId,
      email: input.email.toLowerCase(), profession: input.profession, company: input.company, status: "new", createdAt: iso(now()),
      pageId: input.privatePageId,
    };
    if (st.leads.some((l) => l.email === lead.email)) {
      st.fraud.unshift({ id: id("frd"), type: "duplicate_lead", severity: 1, affiliateId: input.affiliateId, affiliateName: affiliateName(input.affiliateId), entity: "lead", entityId: lead.id, signals: {}, status: "open", decisionNote: null, createdAt: iso(now()) });
    }
    st.leads.push(lead);
    // Same rule as SQL on_lead_share_with_advisor: contact details reach the CRM only with explicit consent.
    if (input.affiliateId && input.advisorConsent) {
      const page = st.pages.find((p) => p.id === input.privatePageId);
      st.prospects.push({
        id: id("prs"), affiliateId: input.affiliateId, name: input.fullName, company: input.company, profession: input.profession,
        email: lead.email, phone: input.phone, website: input.website, notes: input.message, source: "sales_page",
        campaignId: input.campaignId, marketId: page?.marketId ?? null, stage: "new", nextAction: null, nextActionAt: iso(now()),
        potentialValueCents: null, createdAt: iso(now()), stageChangedAt: iso(now()), leadId: lead.id, deletedAt: null,
      });
    }
    if (input.affiliateId) {
      st.activity.push({ id: id("act"), affiliateId: input.affiliateId, type: "lead", occurredAt: iso(now()), payload: { profession: input.profession } });
      const aff = st.affiliates.find((a) => a.id === input.affiliateId);
      if (aff) st.notifications.unshift({ id: id("ntf"), userId: aff.userId, type: "lead", titleKey: "newLead", params: { profession: input.profession ?? "—" }, href: "/dashboard", readAt: null, status: "unread", createdAt: iso(now()) });
    }
    return { id: lead.id };
  },

  async listProducts(): Promise<ProductView[]> {
    const o = db().offer;
    return [
      { id: o.productId, slug: "studio", name: o.productName, active: true, offer: { priceCents: o.priceCents, currency: o.currency, interval: "year", checkoutReady: false } },
    ];
  },

  async getSalesPage(affiliate, pathKey) {
    const st = db();
    const key = affiliate.toLowerCase();
    const aff = st.affiliates.find((a) => a.slug === key || a.code.toLowerCase() === key);
    if (!aff) return null;
    const p = st.pages.find((x) => x.affiliateId === aff.id && x.isActive && !x.archivedAt && x.pathKey === (pathKey ?? "general"));
    if (!p) return null;
    const referral = await demoRepo.resolveReferral(aff.code);
    return referral ? { ...p, referral } : null;
  },

  async listPublishedContent(kinds) {
    return db().content.filter((c) => c.status === "active" && kinds.includes(c.kind));
  },

  async recordSalesEvent(e) {
    db().events.push({
      affiliateId: e.affiliateId, event: e.event, pageId: e.privatePageId ?? null, linkId: e.linkId ?? null, campaignId: e.campaignId ?? null,
      contentKind: e.contentKind ?? null, contentKey: e.contentKey ?? null, at: iso(now()),
    });
  },

  async getSalesSettings() {
    return { followUpDays: 3, checkoutCheckInDays: 2, allowIndexing: false, advisorEnabled: true };
  },

  async getSession() {
    const jar = await cookies();
    const who = jar.get(DEMO_SESSION_COOKIE)?.value;
    if (!who) return null;
    const st = db();
    const user = st.users.find((u) => u.userId === who);
    if (!user) return null;
    const aff = user.affiliateId ? st.affiliates.find((a) => a.id === user.affiliateId) ?? null : null;
    return {
      userId: user.userId, email: user.email, role: user.role, fullName: user.fullName, displayName: user.displayName,
      locale: "en", leaderboardOptIn: user.leaderboardOptIn, isDemo: true,
      affiliate: aff && {
        id: aff.id, code: aff.code, slug: aff.slug, status: aff.status, commissionRate: st.offer.commissionRate,
        onboardingStep: aff.onboardingStep, onboardingCompletedAt: aff.onboardingCompletedAt,
        monthlyGoalSales: st.goals[aff.id] ?? null, payoutProvider: null, payoutAccountRef: null, createdAt: aff.createdAt,
        sponsorId: aff.sponsorId,
      },
    };
  },

  // ------------------------------------------------------------- passwordless sign-in (demo: in memory; no email, the code is shown on screen)
  async sendSignInCode({ email, purpose, signup }) {
    const st = db();
    if (purpose === "login" && !st.users.some((u) => u.email === email)) return { status: "no_account" };
    const codes = demoCodes();
    const prev = codes.get(email);
    if (prev && now() - prev.createdAt < RESEND_AFTER_SECONDS * 1000) return { status: "too_soon" };
    const code = generateCode();
    codes.set(email, { purpose, code, signup, attempts: 0, createdAt: now(), expiresAt: now() + CODE_TTL_SECONDS * 1000, consumed: false });
    return { status: "sent", demoCode: code };
  },

  async signInWithCode({ email, code }) {
    const c = demoCodes().get(email);
    if (!c || c.consumed) return { status: "invalid" };
    if (c.expiresAt <= now()) return { status: "expired" };
    if (c.attempts >= MAX_ATTEMPTS) return { status: "too_many_attempts" };
    c.attempts++;
    if (c.code !== code) return { status: c.attempts >= MAX_ATTEMPTS ? "too_many_attempts" : "invalid" };
    c.consumed = true;

    const st = db();
    let user = st.users.find((u) => u.email === email);
    const isNew = !user;
    if (!user) {
      if (c.purpose !== "signup" || !c.signup) return { status: "invalid" };
      // Mirrors handle_new_user(): profile + pending affiliate application + sponsor from the code.
      const key = id("new").replace(/^new_/, "");
      const sponsorCode = c.signup.sponsor_code?.toLowerCase();
      const sponsor = sponsorCode ? st.affiliates.find((a) => a.status === "approved" && (a.code.toLowerCase() === sponsorCode || a.slug === sponsorCode)) : undefined;
      const affId = `aff_${key}`;
      const code = `NEW${key.toUpperCase()}`.slice(0, 8);
      user = { userId: `usr_${key}`, email, role: "affiliate", fullName: c.signup.full_name, displayName: null, leaderboardOptIn: false, affiliateId: affId };
      st.users.push(user);
      st.affiliates.push({
        id: affId, userId: user.userId, code, slug: null, status: st.settings.autoApprove ? "approved" : "pending",
        country: c.signup.country, onboardingStep: 0, onboardingCompletedAt: null, monthlyGoalSales: null, createdAt: iso(now()),
        application: c.signup.application, sponsorId: sponsor?.id ?? null,
      });
      st.links.push({ id: `lnk_${key}`, affiliateId: affId, code: `${code}01`, name: "Default", campaignId: null, isDefault: true, createdAt: iso(now()) });
    }
    (await cookies()).set(DEMO_SESSION_COOKIE, user.userId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
    return { status: "ok", isNew, role: user.role };
  },

  async getBalances(s) {
    return balancesOf(mustAffiliate(s));
  },

  async getFinancialOverview(s) {
    const aff = mustAffiliate(s);
    const st = db();
    const book = await demoRepo.getRecurringBook(s);
    const mine = st.sales.filter((x) => x.affiliateId === aff);
    const latest = mine.filter((x) => x.paidAt).sort((a, b) => b.paidAt!.localeCompare(a.paidAt!))[0];
    const latestCom = latest ? st.commissions.find((c) => c.saleId === latest.id) : null;
    return {
      currency: st.offer.currency,
      revenueGeneratedCents: mine.filter((x) => x.status === "paid" || x.status === "partially_refunded" || x.status === "disputed").reduce((a, x) => a + x.amountCents, 0),
      balances: balancesOf(aff),
      recurringContracts: book.activeCount,
      potentialNext12mCents: book.contracts.reduce((a, c) => a + c.projected12mCents, 0),
      latestSale: latest ? {
        ref: latest.ref, kind: latest.kind, grossCents: latest.amountCents, at: latest.paidAt!,
        commissionCents: latestCom?.amountCents ?? null, commissionStatus: latestCom?.status ?? null,
      } : null,
    };
  },

  async getOverview(s, range) {
    const aff = mustAffiliate(s);
    const st = db();
    const start = rangeStart(range);
    const mine = st.commissions.filter((c) => c.affiliateId === aff);
    const earnedEvents = mine
      .filter((c) => (c.status === "available" || c.status === "paid") && c.availableAt)
      .map((c) => ({ date: c.availableAt!.slice(0, 10), cents: c.amountCents }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    return {
      balances: balancesOf(aff),
      activeClients: st.subscriptions.filter((x) => x.affiliateId === aff && x.status === "active").length,
      opportunities: st.prospects.filter((p) => p.affiliateId === aff && !p.deletedAt && p.stage !== "won" && p.stage !== "lost").length,
      clicks: st.clicks.filter((c) => c.affiliateId === aff && !c.isBot && Date.parse(c.at) >= start).length,
      earnings: earnedEvents,
      activity: st.activity.filter((a) => a.affiliateId === aff).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 12),
      nextActions: st.prospects
        .filter((p) => p.affiliateId === aff && !p.deletedAt && p.nextActionAt && p.stage !== "won" && p.stage !== "lost")
        .sort((a, b) => a.nextActionAt!.localeCompare(b.nextActionAt!)).slice(0, 5),
      goal: {
        target: st.goals[aff] ?? null,
        current: st.sales.filter((x) => x.affiliateId === aff && x.status === "paid" && x.paidAt && Date.parse(x.paidAt) >= monthStart.getTime()).length,
      },
    };
  },

  async getDefaultLink(s) {
    const aff = mustAffiliate(s);
    return toLink(db().links.find((l) => l.affiliateId === aff && l.isDefault)!);
  },
  async getLinkStats(s) {
    const aff = mustAffiliate(s);
    return statsFor((x) => x.affiliateId === aff);
  },
  async listLinks(s) {
    const aff = mustAffiliate(s);
    return db().links.filter((l) => l.affiliateId === aff && !l.isDefault).map(toLink).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createCampaignLink(s, input) {
    const aff = mustAffiliate(s);
    const st = db();
    const c: DemoCampaign = { id: id("cmp"), affiliateId: aff, name: input.name, source: input.source, marketId: input.marketId, createdAt: iso(now()) };
    if (input.pageId && !st.pages.some((p) => p.id === input.pageId && p.affiliateId === aff)) throw new Error("forbidden");
    st.campaigns.push(c);
    const code = `${s.affiliate!.code}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const l: DemoLink = { id: id("lnk"), affiliateId: aff, code, name: input.name, campaignId: c.id, isDefault: false, createdAt: iso(now()), pageId: input.pageId ?? null };
    st.links.push(l);
    return toLink(l);
  },
  async listPromoCodes(s) {
    const aff = mustAffiliate(s);
    return db().promoCodes.filter((x) => x.affiliateId === aff).map((x) => ({
      id: x.id, code: x.code, discountRate: x.discountRate, active: x.active, redemptions: x.redemptions, createdAt: x.createdAt,
    }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createPromoCode(s, input) {
    const aff = mustAffiliate(s);
    const code = input.code.toUpperCase();
    if (db().promoCodes.some((x) => x.code === code)) throw new Error("code_taken");
    const row: DemoPromoCode = { id: id("promo"), affiliateId: aff, code, discountRate: input.discountRate, active: true, redemptions: 0, createdAt: iso(now()) };
    db().promoCodes.push(row);
    return { id: row.id, code: row.code, discountRate: row.discountRate, active: row.active, redemptions: row.redemptions, createdAt: row.createdAt };
  },
  async setPromoCodeActive(s, promoId, active) {
    const row = db().promoCodes.find((x) => x.id === promoId && x.affiliateId === mustAffiliate(s));
    if (!row) throw new Error("not_found");
    row.active = active;
  },
  async setSlug(s, slug) {
    const aff = mustAffiliate(s);
    const st = db();
    if (st.affiliates.some((a) => a.slug === slug && a.id !== aff)) throw new Error("slug_taken");
    st.affiliates.find((a) => a.id === aff)!.slug = slug;
  },
  async listPrivatePages(s) {
    const aff = mustAffiliate(s);
    return db().pages.filter((p) => p.affiliateId === aff).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createPrivatePage(s, input) {
    const aff = mustAffiliate(s);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const slug = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    const p: PrivatePage = {
      ...input, id: id("pg"), slug, affiliateId: aff, isActive: true, viewCount: 0, createdAt: iso(now()),
      pathKey: null, templateKey: null, angleKey: null, productId: "prod_studio", ctaMode: input.ctaVariant === "call" ? "call" : "lead",
      showAdvisor: false, advisor: {}, indexable: false, archivedAt: null,
    };
    db().pages.push(p);
    return p;
  },

  async listProspects(s) {
    const aff = mustAffiliate(s);
    return db().prospects.filter((p) => p.affiliateId === aff && !p.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createProspect(s, input) {
    const aff = mustAffiliate(s);
    const p = { ...input, id: id("prs"), createdAt: iso(now()), stageChangedAt: iso(now()), affiliateId: aff, deletedAt: null };
    db().prospects.push(p);
    return p;
  },
  async updateProspect(s, pid, patch) {
    const aff = mustAffiliate(s);
    const p = db().prospects.find((x) => x.id === pid && x.affiliateId === aff);
    if (!p) throw new Error("not_found");
    if (patch.stage && patch.stage !== p.stage) p.stageChangedAt = iso(now());
    Object.assign(p, patch);
  },
  async listProspectEvents(s, prospectId) {
    const aff = mustAffiliate(s);
    return db().prospectEvents.filter((e) => e.affiliateId === aff && (!prospectId || e.prospectId === prospectId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async addProspectEvent(s, prospectId, type, stage, payload = {}) {
    const aff = mustAffiliate(s);
    if (!db().prospects.some((p) => p.id === prospectId && p.affiliateId === aff && !p.deletedAt)) throw new Error("not_found");
    db().prospectEvents.push({ id: id("pev"), prospectId, type, stage, payload, createdAt: iso(now()), affiliateId: aff });
  },
  async deleteProspect(s, pid) {
    const aff = mustAffiliate(s);
    const p = db().prospects.find((x) => x.id === pid && x.affiliateId === aff);
    if (p) p.deletedAt = iso(now());
  },

  async listSales(s) {
    const aff = mustAffiliate(s);
    return db().sales.filter((x) => x.affiliateId === aff).map(saleRow).sort((a, b) => b.date.localeCompare(a.date));
  },
  async listCommissions(s) {
    const aff = mustAffiliate(s);
    return db().commissions.filter((c) => c.affiliateId === aff).map(commissionRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getRecurringBook(s) {
    const aff = mustAffiliate(s);
    const st = db();
    const commission = computeCommissionCents(st.offer.priceCents, st.offer.commissionRate);
    const contracts = st.subscriptions.filter((x) => x.affiliateId === aff).map((sub): RecurringContract => {
      const cust = st.customers.find((c) => c.id === sub.customerId)!;
      const sales = st.sales.filter((x) => x.subscriptionId === sub.id && x.status === "paid");
      const renewing = (sub.status === "active" || sub.status === "past_due") && !sub.cancelling;
      const within12m = renewing && Date.parse(sub.periodEnd) <= now() + 365 * DAY;
      return {
        subscriptionId: sub.id, customerRef: cust.ref, customerName: cust.name, productName: st.offer.productName,
        startedAt: sub.startedAt, renewalDate: sub.periodEnd, annualCents: st.offer.priceCents, currency: st.offer.currency,
        status: sub.status, cancelling: sub.cancelling, ruleLabel: "Studio ATS — default affiliate commission",
        ruleRate: st.offer.commissionRate, ruleDurationMonths: null,
        nextCommissionEligible: renewing, nextCommissionReason: renewing ? null : "not_renewing",
        nextCommissionCents: renewing ? commission : 0, projected12mCents: within12m ? commission : 0,
        renewalsCount: sales.filter((x) => x.kind === "renewal").length,
        lastPaidAt: sales.map((x) => x.paidAt!).sort().at(-1) ?? null,
      };
    }).sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || a.renewalDate.localeCompare(b.renewalDate));
    return summarizeBook(contracts, st.offer.currency, balancesOf(aff).lifetimeEarnedCents);
  },
  async listPayouts(s) {
    const aff = mustAffiliate(s);
    return db().payouts.filter((p) => p.affiliateId === aff).map((p) => ({ id: p.id, ref: p.ref, amountCents: p.amountCents, status: p.status, scheduledFor: p.scheduledFor, paidAt: p.paidAt, documentPath: null }))
      .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  },
  async listNotifications(s, status = "inbox") {
    return db().notifications
      .filter((n) => n.userId === s.userId && (status === "inbox" ? n.status !== "archived" : n.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markNotificationsRead(s) {
    for (const n of db().notifications) if (n.userId === s.userId && !n.readAt) { n.readAt = iso(now()); if (n.status === "unread") n.status = "read"; }
  },
  async setNotificationStatus(s, nid, status) {
    const n = db().notifications.find((x) => x.id === nid && x.userId === s.userId);
    if (!n) return;
    n.status = status;
    n.readAt = status === "unread" ? null : n.readAt ?? iso(now());
  },
  async getConnectStatus() {
    return {
      enabled: db().settings.connectEnabled, providerConfigured: false, accountConnected: false,
      onboardingStatus: "not_started", payoutsEnabled: false, requirementsStatus: null, updatedAt: null,
    };
  },
  async getLeaderboard(s) {
    const st = db();
    if (!st.settings.leaderboardEnabled) return [];
    const monthStart = now() - 30 * DAY;
    const rows = st.affiliates.filter((a) => a.status === "approved").map((a) => {
      const u = st.users.find((x) => x.userId === a.userId)!;
      const isMe = a.id === s.affiliate?.id;
      return {
        visible: u.leaderboardOptIn || isMe, isMe,
        displayName: u.displayName || `${u.fullName[0]}***`,
        sales: st.sales.filter((x) => x.affiliateId === a.id && x.status === "paid" && x.paidAt && Date.parse(x.paidAt) >= monthStart).length,
      };
    }).filter((r) => r.visible && r.sales > 0).sort((a, b) => b.sales - a.sales);
    return rows.map((r, i) => ({ rank: i + 1, displayName: r.displayName, sales: r.sales, isMe: r.isMe }));
  },
  async getAnalytics(s, range) {
    const aff = mustAffiliate(s);
    const st = db();
    const start = rangeStart(range);
    const inRange = (d: string) => Date.parse(d) >= start;
    const clicks = st.clicks.filter((c) => c.affiliateId === aff && !c.isBot && inRange(c.at));
    const leads = st.leads.filter((l) => l.affiliateId === aff && inRange(l.createdAt));
    const sales = st.sales.filter((x) => x.affiliateId === aff && x.status === "paid" && inRange(x.createdAt));
    const count = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {}))
      .map(([key, n]) => ({ key, clicks: n })).sort((a, b) => b.clicks - a.clicks);
    return {
      funnel: {
        visitors: new Set(clicks.map((c) => c.visitorId)).size, leads: leads.length,
        appointments: leads.filter((l) => l.status === "appointment_requested" || l.status === "converted").length, sales: sales.length,
      },
      byCampaign: st.campaigns.filter((c) => c.affiliateId === aff).map((c) => ({
        name: c.name,
        clicks: clicks.filter((k) => st.links.find((l) => l.id === k.linkId)?.campaignId === c.id).length,
        leads: leads.filter((l) => l.campaignId === c.id).length,
        sales: sales.filter((x) => x.campaignId === c.id).length,
      })),
      byCountry: count(clicks.map((c) => c.country)),
      byDevice: count(clicks.map((c) => c.device)),
    };
  },
  async getReferralDashboard(s) {
    const aff = mustAffiliate(s);
    const st = db();
    const me = st.affiliates.find((a) => a.id === aff)!;
    const recruits = st.affiliates.filter((a) => a.sponsorId === aff).map((a) => {
      const u = st.users.find((x) => x.userId === a.userId)!;
      const sales = st.sales.filter((x) => x.affiliateId === a.id && x.status === "paid");
      return {
        id: a.id, name: u.displayName || u.fullName, status: a.status, joinedAt: a.createdAt,
        sales: sales.length, commissionCents: sales.reduce((sum, x) => sum + computeCommissionCents(x.amountCents, 0.05), 0),
      };
    });
    const total = recruits.reduce((sum, x) => sum + x.commissionCents, 0);
    const sponsor = me.sponsorId ? st.affiliates.find((a) => a.id === me.sponsorId) : null;
    const sponsorUser = sponsor ? st.users.find((u) => u.userId === sponsor.userId) : null;
    return {
      code: me.code, slug: me.slug,
      sponsor: sponsorUser ? { name: sponsorUser.displayName || sponsorUser.fullName } : null,
      recruits, totalCommissionCents: total, pendingCommissionCents: Math.round(total * 0.35),
      availableCommissionCents: Math.round(total * 0.25),
    };
  },
  async listSalesAssets(_s, locale: Locale) { return assetsFor(locale); },
  async setMonthlyGoal(s, target) { db().goals[mustAffiliate(s)] = target; },

  async listSalesContent(s, kinds?: ContentKind[]) {
    mustAffiliate(s);
    return db().content.filter((c) => c.status === "active" && (!kinds || kinds.includes(c.kind)));
  },
  async listFavorites(s) {
    const aff = mustAffiliate(s);
    return db().favorites.filter((f) => f.affiliateId === aff).map(({ kind, key }) => ({ kind, key }));
  },
  async setFavorite(s, kind, key, on) {
    const aff = mustAffiliate(s);
    const st = db();
    st.favorites = st.favorites.filter((f) => !(f.affiliateId === aff && f.kind === kind && f.key === key));
    if (on) st.favorites.push({ affiliateId: aff, kind, key });
  },
  async listProgress(s) {
    const aff = mustAffiliate(s);
    return db().progress.filter((p) => p.affiliateId === aff).map((p) => p.key);
  },
  async setProgress(s, key, done) {
    const aff = mustAffiliate(s);
    const st = db();
    st.progress = st.progress.filter((p) => !(p.affiliateId === aff && p.key === key));
    if (done) st.progress.push({ affiliateId: aff, key });
  },
  async getPerformance(s) {
    const aff = mustAffiliate(s);
    const st = db();
    // Mirror of public.affiliate_performance: each stage from its own source.
    type Src = { k: "click" | "cta" | "lead" | "sale"; link: string | null; campaign: string | null; page: string | null; visitor: string | null; amt: number; com: number; pend: number };
    const src: Src[] = [
      ...st.clicks.filter((c) => c.affiliateId === aff && !c.isBot).map((c): Src => ({ k: "click", link: c.linkId, campaign: c.campaignId ?? st.links.find((l) => l.id === c.linkId)?.campaignId ?? null, page: c.pageId ?? null, visitor: c.visitorId, amt: 0, com: 0, pend: 0 })),
      ...st.events.filter((e) => e.affiliateId === aff && e.event === "cta_click").map((e): Src => ({ k: "cta", link: e.linkId, campaign: e.campaignId, page: e.pageId, visitor: null, amt: 0, com: 0, pend: 0 })),
      ...st.leads.filter((l) => l.affiliateId === aff).map((l): Src => ({ k: "lead", link: l.linkId, campaign: l.campaignId, page: l.pageId ?? null, visitor: null, amt: 0, com: 0, pend: 0 })),
      ...st.sales.filter((x) => x.affiliateId === aff && x.status === "paid").map((x): Src => {
        const cs = st.commissions.filter((c) => c.saleId === x.id && c.status !== "reversed");
        return { k: "sale", link: x.linkId, campaign: x.campaignId, page: null, visitor: null, amt: x.amountCents,
          com: cs.reduce((a, c) => a + c.amountCents, 0), pend: cs.filter((c) => c.status === "pending" || c.status === "disputed").reduce((a, c) => a + c.amountCents, 0) };
      }),
    ];
    const rows = new Map<string, PerformanceRow & { vis: Set<string> }>();
    for (const x of src) {
      for (const [dimension, refId] of [["total", null], ["link", x.link], ["campaign", x.campaign], ["page", x.page]] as const) {
        if (dimension !== "total" && !refId) continue;
        const k = `${dimension}:${refId}`;
        const r = rows.get(k) ?? { dimension, refId, clicks: 0, visitors: 0, ctaClicks: 0, leads: 0, checkouts: 0, sales: 0, revenueCents: 0, commissionCents: 0, commissionPendingCents: 0, vis: new Set<string>() };
        if (x.k === "click") { r.clicks++; if (x.visitor) r.vis.add(x.visitor); }
        if (x.k === "cta") r.ctaClicks++;
        if (x.k === "lead") r.leads++;
        if (x.k === "sale") { r.sales++; r.revenueCents += x.amt; r.commissionCents += x.com; r.commissionPendingCents += x.pend; }
        r.visitors = r.vis.size;
        rows.set(k, r);
      }
    }
    return [...rows.values()].map((row) => {
      const { vis, ...result } = row;
      void vis;
      return result;
    });
  },
  async createSalesPage(s, input) {
    const aff = mustAffiliate(s);
    const st = db();
    if (st.pages.some((p) => p.affiliateId === aff && p.pathKey === input.pathKey && !p.archivedAt)) throw new Error("path_taken");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const p: PrivatePage = {
      id: id("pg"), slug: Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(""), affiliateId: aff,
      marketId: input.marketId, campaignId: input.campaignId, locale: input.locale, pitchVariant: "default", ctaVariant: input.ctaMode === "call" ? "call" : "request",
      displayName: null, visibility: "unlisted", isActive: true, viewCount: 0, createdAt: iso(now()),
      pathKey: input.pathKey, templateKey: input.templateKey, angleKey: input.angleKey, productId: "prod_studio", ctaMode: input.ctaMode,
      showAdvisor: input.showAdvisor, advisor: input.advisor, indexable: false, archivedAt: null,
    };
    st.pages.push(p);
    return p;
  },
  async updateSalesPage(s, pid, input) {
    const aff = mustAffiliate(s);
    const p = db().pages.find((x) => x.id === pid && x.affiliateId === aff);
    if (!p) throw new Error("not_found");
    Object.assign(p, { marketId: input.marketId, locale: input.locale, templateKey: input.templateKey, angleKey: input.angleKey,
      ctaMode: input.ctaMode, showAdvisor: input.showAdvisor, advisor: input.advisor, campaignId: input.campaignId });
  },
  async archiveSalesPage(s, pid) {
    const aff = mustAffiliate(s);
    const p = db().pages.find((x) => x.id === pid && x.affiliateId === aff);
    if (p) { p.archivedAt = iso(now()); p.isActive = false; }
  },
  async createLink(s, input) {
    const aff = mustAffiliate(s);
    const st = db();
    if (input.pageId && !st.pages.some((p) => p.id === input.pageId && p.affiliateId === aff)) throw new Error("forbidden");
    const l: DemoLink = {
      id: id("lnk"), affiliateId: aff, code: `${s.affiliate!.code}${Math.random().toString(36).slice(2, 5).toUpperCase()}`, name: input.name,
      campaignId: null, isDefault: false, createdAt: iso(now()), pageId: input.pageId, marketId: input.marketId, channel: input.channel,
    };
    st.links.push(l);
    return toLink(l);
  },
  async updateProfile(s, patch) {
    const u = db().users.find((x) => x.userId === s.userId)!;
    if (patch.fullName !== undefined) u.fullName = patch.fullName;
    if (patch.displayName !== undefined) u.displayName = patch.displayName;
    if (patch.leaderboardOptIn !== undefined) u.leaderboardOptIn = patch.leaderboardOptIn;
  },
  async setOnboardingStep(s, step, completed) {
    const a = db().affiliates.find((x) => x.id === mustAffiliate(s))!;
    a.onboardingStep = Math.max(a.onboardingStep, step);
    if (completed) a.onboardingCompletedAt = iso(now());
  },
  async exportMyData(s) {
    const aff = s.affiliate?.id;
    const st = db();
    return {
      notice: "DEMO DATA EXPORT",
      profile: st.users.find((u) => u.userId === s.userId),
      affiliate: st.affiliates.find((a) => a.id === aff),
      prospects: st.prospects.filter((p) => p.affiliateId === aff),
      prospectEvents: st.prospectEvents.filter((e) => e.affiliateId === aff),
      campaigns: st.campaigns.filter((c) => c.affiliateId === aff),
      commissions: st.commissions.filter((c) => c.affiliateId === aff),
      payouts: st.payouts.filter((p) => p.affiliateId === aff),
    };
  },
  async requestErasure(s) { db().privacyRequests.push({ userId: s.userId, kind: "erasure", at: iso(now()) }); },

  // ---------------------------------------------------------------- admin
  async adminOverview(s) {
    mustStaff(s);
    const st = db();
    const b = summarize(st.commissions);
    return {
      affiliates: st.affiliates.filter((a) => a.status === "approved").length,
      applications: st.affiliates.filter((a) => a.status === "pending").length,
      clicks30d: st.clicks.filter((c) => Date.parse(c.at) >= now() - 30 * DAY).length,
      leads: st.leads.length,
      sales: st.sales.filter((x) => x.status === "paid").length,
      revenueCents: st.sales.filter((x) => x.status === "paid").reduce((a, x) => a + x.amountCents, 0),
      commissionsOwedCents: b.availableCents + b.pendingCents + b.disputedCents,
      paidOutCents: st.payouts.filter((p) => p.status === "paid").reduce((a, p) => a + p.amountCents, 0),
      renewals60d: st.subscriptions.filter((x) => x.status === "active" && Date.parse(x.periodEnd) <= now() + 60 * DAY).length,
      openFraudFlags: st.fraud.filter((f) => f.status === "open" || f.status === "reviewing").length,
    };
  },
  async adminListAffiliates(s) {
    mustStaff(s);
    const st = db();
    return st.affiliates.map((a) => {
      const u = st.users.find((x) => x.userId === a.userId)!;
      return {
        id: a.id, profileId: a.userId, name: u.fullName, email: u.email, code: a.code, status: a.status, country: a.country,
        sales: st.sales.filter((x) => x.affiliateId === a.id && x.status === "paid").length,
        availableCents: balancesOf(a.id).availableCents,
        createdAt: a.createdAt, application: a.application,
      };
    }).sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  },
  async adminSetAffiliateStatus(s, affId, status, reason) {
    mustStaff(s);
    const a = db().affiliates.find((x) => x.id === affId);
    if (!a) throw new Error("not_found");
    audit(s, "affiliate.status", "affiliate", affId, { status: a.status }, { status }, reason);
    a.status = status;
  },
  async adminListLeads(s) {
    mustStaff(s);
    return db().leads.map((l) => ({
      id: l.id, fullName: l.fullName ?? `Demo lead ${l.id}`, company: l.company, profession: l.profession, email: l.email,
      affiliateId: l.affiliateId, affiliateName: affiliateName(l.affiliateId), status: l.status, createdAt: l.createdAt,
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async adminCreateSaleFromLead(s, leadId, reason) {
    mustStaff(s);
    const st = db();
    const lead = st.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("not_found");
    if (lead.status === "converted") throw new Error("lead already converted");
    const cust: DemoCustomer = { id: id("cus"), ref: `CUS-${String(st.customers.length + 1).padStart(4, "0")}`, name: lead.company ?? lead.fullName ?? "—", email: lead.email };
    st.customers.push(cust);
    const sale: DemoSale = {
      id: id("sal"), ref: `SAL-${String(st.sales.length + 1).padStart(4, "0")}`, customerId: cust.id, affiliateId: lead.affiliateId,
      subscriptionId: null, linkId: lead.linkId, campaignId: lead.campaignId, kind: "new", status: "pending",
      amountCents: st.offer.priceCents, createdAt: iso(now()), paidAt: null,
    };
    st.sales.push(sale);
    // V0.2: no commission until the payment is confirmed.
    if (lead.affiliateId) {
      st.activity.push({ id: id("act"), affiliateId: lead.affiliateId, type: "sale_pending", occurredAt: iso(now()), payload: { sale_ref: sale.ref } });
    }
    lead.status = "converted";
    audit(s, "sale.create_from_lead", "sale", sale.ref, null, { lead: lead.id, affiliate: affiliateName(lead.affiliateId) }, reason);
  },
  async adminListSales(s) {
    mustStaff(s);
    return db().sales.map((x) => ({ ...saleRow(x), affiliateId: x.affiliateId, affiliateName: affiliateName(x.affiliateId) }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  async adminSetSaleStatus(s, saleId, status, reason) {
    mustStaff(s);
    const st = db();
    const sale = st.sales.find((x) => x.id === saleId);
    if (!sale) throw new Error("not_found");
    audit(s, "sale.status", "sale", sale.ref, { status: sale.status }, { status }, reason);
    sale.status = status;
    if (status === "paid") {
      sale.paidAt = iso(now());
      const sub: DemoSubscription = { id: id("sub"), customerId: sale.customerId, affiliateId: sale.affiliateId!, startedAt: sale.paidAt, periodEnd: iso(now() + 365 * DAY), status: "active", cancelling: false };
      if (sale.affiliateId && !sale.subscriptionId) { st.subscriptions.push(sub); sale.subscriptionId = sub.id; }
    } else if (sale.subscriptionId) {
      const sub = st.subscriptions.find((x) => x.id === sale.subscriptionId);
      if (sub) sub.status = "cancelled";
    }
    const com = st.commissions.find((c) => c.saleId === sale.id);
    if (com) {
      applyCommissionEvent(com, { type: "sale_status", status, at: iso(now()), validationDays: st.settings.commissionValidationDays });
    } else if (status === "paid" && sale.affiliateId) {
      // Payment confirmed → the commission is created now, pending validation.
      const { state } = newCommission(computeCommissionCents(sale.amountCents, st.offer.commissionRate), sale.paidAt!, st.settings.commissionValidationDays);
      st.commissions.push({ ...state, id: id("com"), affiliateId: sale.affiliateId, saleId: sale.id, payoutId: null, kind: sale.kind, disputeReason: null,
        expectedPaymentDate: iso(Date.parse(state.holdUntil!) + 7 * DAY).slice(0, 10), createdAt: sale.paidAt! });
      st.activity.push({ id: id("act"), affiliateId: sale.affiliateId, type: "commission_pending", occurredAt: iso(now()), payload: { sale_ref: sale.ref, commission_cents: state.amountCents, currency: "EUR" } });
    }
    if (sale.affiliateId && status === "paid") {
      st.activity.push({ id: id("act"), affiliateId: sale.affiliateId, type: "payment_confirmed", occurredAt: iso(now()), payload: { sale_ref: sale.ref, gross_cents: sale.amountCents, currency: "EUR" } });
    }
  },
  async adminCorrectAttribution(s, saleId, affId, reason) {
    mustStaff(s);
    const st = db();
    const sale = st.sales.find((x) => x.id === saleId);
    if (!sale) throw new Error("not_found");
    const com = st.commissions.find((c) => c.saleId === saleId && c.affiliateId === sale.affiliateId);
    if (com?.status === "paid") throw new Error("commission_already_paid");
    audit(s, "attribution.correct", "sale", sale.ref, { affiliate: affiliateName(sale.affiliateId) }, { affiliate: affiliateName(affId) }, reason);
    if (com) applyCommissionEvent(com, { type: "reverse", at: iso(now()), reason: `attribution corrected: ${reason}` });
    sale.affiliateId = affId;
    if (com && sale.paidAt) {
      const { state } = newCommission(com.amountCents, sale.paidAt, st.settings.commissionValidationDays, { renewal: sale.kind === "renewal" });
      st.commissions.push({ ...state, id: id("com"), affiliateId: affId, saleId, payoutId: null, kind: sale.kind, disputeReason: null, expectedPaymentDate: com.expectedPaymentDate, createdAt: iso(now()) });
    }
  },
  async adminListCommissions(s) {
    mustStaff(s);
    return db().commissions.map((c) => ({
      ...commissionRow(c), affiliateId: c.affiliateId, affiliateName: affiliateName(c.affiliateId) ?? "—", kind: c.kind, currency: "EUR",
      disputeReason: c.disputeReason, recoveryStatus: c.recoveryRequired ? (db().ledgerExtras.some((x) => x.affiliateId === c.affiliateId && x.type === "clawback" && !x.settledBy) ? "required" as const : "recovered" as const) : null,
    }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async adminHoldCommission(s, cid, hold, reason) {
    mustStaff(s);
    const c = db().commissions.find((x) => x.id === cid);
    if (!c) throw new Error("not_found");
    const before = c.status;
    applyCommissionEvent(c, hold ? { type: "dispute", reason } : { type: "restore", at: iso(now()), reason });
    c.disputeReason = hold ? reason : null;
    audit(s, hold ? "commission.dispute" : "commission.undispute", "commission", cid, { status: before }, { status: c.status }, reason);
  },
  async adminReverseCommission(s, cid, reason) {
    mustStaff(s);
    const c = db().commissions.find((x) => x.id === cid);
    if (!c) throw new Error("not_found");
    audit(s, "commission.reverse", "commission", cid, { status: c.status }, { status: "reversed" }, reason);
    applyCommissionEvent(c, { type: "reverse", at: iso(now()), reason });
  },
  async adminReleaseDue(s) {
    mustStaff(s);
    let n = 0;
    for (const c of db().commissions) {
      const before = c.status;
      applyCommissionEvent(c, { type: "release", at: iso(now()) });
      if (before !== c.status) n++;
    }
    return n;
  },
  async adminValidateCommission(s, cid, reason) {
    mustStaff(s);
    const c = db().commissions.find((x) => x.id === cid);
    if (!c) throw new Error("not_found");
    if (c.status !== "pending") throw new Error("only a pending commission can be validated");
    audit(s, "commission.validate", "commission", cid, { status: c.status }, { status: "available" }, reason);
    Object.assign(c, { status: "available", availableAt: iso(now()) });
  },
  async adminAdjustLedger(s, affId, amountCents, currency, reason) {
    mustStaff(s);
    if (!reason.trim()) throw new Error("reason required");
    if (!amountCents) throw new Error("amount must not be zero");
    db().ledgerExtras.push({ id: id("led"), affiliateId: affId, amountCents, type: "adjustment", reason, settledBy: null, createdAt: iso(now()) });
    audit(s, "ledger.adjustment", "affiliate", affId, null, { amount_cents: amountCents, currency }, reason);
  },
  async adminFinanceSummary(s, f) {
    mustStaff(s);
    const st = db();
    const from = f.from ? Date.parse(f.from) : -Infinity;
    const to = f.to ? Date.parse(f.to) : Infinity;
    const sales = st.sales.filter((x) => x.paidAt && Date.parse(x.paidAt) >= from && Date.parse(x.paidAt) < to
      && (!f.affiliateId || x.affiliateId === f.affiliateId) && (!f.status || x.status === f.status)
      && (!f.campaignId || x.campaignId === f.campaignId));
    const coms = st.commissions.filter((c) => sales.some((x) => x.id === c.saleId));
    const sum = (st2: string) => coms.filter((c) => c.status === st2).reduce((a, c) => a + c.amountCents, 0);
    const subs = st.subscriptions.filter((x) => !f.affiliateId || x.affiliateId === f.affiliateId);
    return {
      currency: "EUR",
      grossRevenueCents: sales.reduce((a, x) => a + x.amountCents, 0),
      attributedRevenueCents: sales.filter((x) => x.affiliateId).reduce((a, x) => a + x.amountCents, 0),
      salesCount: sales.length, renewalsCount: sales.filter((x) => x.kind === "renewal").length,
      pendingCommissionsCents: sum("pending"), disputedCommissionsCents: sum("disputed"), availableCommissionsCents: sum("available"),
      paidCommissionsCents: sum("paid"), reversedCommissionsCents: sum("reversed"),
      recoveryRequiredCount: coms.filter((c) => c.recoveryRequired).length,
      refundsCents: sales.filter((x) => x.status === "refunded").reduce((a, x) => a + x.amountCents, 0),
      chargebacksCount: sales.filter((x) => x.status === "chargeback").length,
      chargebacksCents: sales.filter((x) => x.status === "chargeback").reduce((a, x) => a + x.amountCents, 0),
      openDisputesCount: sales.filter((x) => x.status === "disputed").length,
      activeSubscriptions: subs.filter((x) => x.status === "active").length,
      upcomingRenewals60d: subs.filter((x) => x.status === "active" && !x.cancelling && Date.parse(x.periodEnd) <= now() + 60 * DAY).length,
      cancellingSubscriptions: subs.filter((x) => x.status === "active" && x.cancelling).length,
      webhooksFailed: 0, webhooksLastReceivedAt: null, emailsFailed: 0,
    };
  },
  async adminFinanceOptions(s) {
    mustStaff(s);
    const st = db();
    return {
      affiliates: st.affiliates.map((a) => ({ id: a.id, name: affiliateName(a.id) ?? a.code })),
      products: [{ id: st.offer.productId, name: st.offer.productName }],
      campaigns: st.campaigns.map((c) => ({ id: c.id, name: c.name })),
      countries: ["BE", "CH", "FR"],
    };
  },
  async adminPayoutCandidates(s) {
    mustStaff(s);
    const st = db();
    return st.affiliates.map((a) => ({
      affiliateId: a.id, affiliateName: affiliateName(a.id) ?? "—",
      availableCents: st.commissions.filter((c) => c.affiliateId === a.id && c.status === "available" && !c.payoutId).reduce((x, c) => x + c.amountCents, 0) + unsettled(a.id),
    })).filter((x) => x.availableCents >= st.settings.payoutMinimumCents);
  },
  async adminListPayouts(s) {
    mustStaff(s);
    return db().payouts.map((p) => ({ id: p.id, ref: p.ref, amountCents: p.amountCents, status: p.status, scheduledFor: p.scheduledFor, paidAt: p.paidAt, documentPath: null, affiliateName: affiliateName(p.affiliateId) ?? "—" }))
      .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  },
  async adminCreatePayout(s, affId) {
    mustStaff(s);
    const st = db();
    const coms = st.commissions.filter((c) => c.affiliateId === affId && c.status === "available" && !c.payoutId);
    const extras = st.ledgerExtras.filter((x) => x.affiliateId === affId && !x.settledBy);
    const total = coms.reduce((a, c) => a + c.amountCents, 0) + extras.reduce((a, x) => a + x.amountCents, 0);
    if (total <= 0 || total < st.settings.payoutMinimumCents) throw new Error("below_minimum");
    const p: DemoPayout = { id: id("pay"), ref: `PAY-${String(st.payouts.length + 1).padStart(4, "0")}`, affiliateId: affId, amountCents: total, status: "scheduled", scheduledFor: iso(now()).slice(0, 10), paidAt: null };
    st.payouts.push(p);
    for (const c of coms) c.payoutId = p.id;
    for (const x of extras) x.settledBy = p.id;
    audit(s, "payout.create", "payout", p.ref, null, { amount_cents: total }, null);
  },
  async adminMarkPayoutPaid(s, pid, providerRef) {
    mustStaff(s);
    const st = db();
    const p = st.payouts.find((x) => x.id === pid);
    if (!p || p.status === "paid") return;
    audit(s, "payout.paid", "payout", p.ref, { status: p.status }, { status: "paid", provider_ref: providerRef }, null);
    p.status = "paid"; p.paidAt = iso(now());
    for (const c of st.commissions.filter((x) => x.payoutId === p.id && x.status === "available")) applyCommissionEvent(c, { type: "payout_paid", at: p.paidAt });
    st.activity.push({ id: id("act"), affiliateId: p.affiliateId, type: "payout_completed", occurredAt: p.paidAt, payload: { amount_cents: p.amountCents, currency: "EUR" } });
  },
  async adminListFraudFlags(s) { mustStaff(s); return db().fraud; },
  async adminReviewFraudFlag(s, fid, status, note) {
    mustStaff(s);
    const f = db().fraud.find((x) => x.id === fid);
    if (!f) throw new Error("not_found");
    audit(s, "fraud.review", "fraud_flag", fid, { status: f.status }, { status }, note);
    f.status = status; f.decisionNote = note;
  },
  async adminListAuditLogs(s) { mustStaff(s); return db().audit; },
  async adminUpdateSettings(s, patch) {
    mustStaff(s);
    if (s.role !== "super_admin") throw new Error("forbidden");
    const st = db();
    audit(s, "settings.update", "settings", "global", st.settings, { ...st.settings, ...patch }, null);
    Object.assign(st.settings, patch);
  },
  async adminListMarkets(s) { mustStaff(s); return db().markets; },
  async adminListSalesContent(s) {
    mustStaff(s);
    return [...db().content].sort((a, b) => a.kind.localeCompare(b.kind) || a.sort - b.sort || a.key.localeCompare(b.key) || b.version - a.version);
  },
  async adminGetSalesContent(s, cid) { mustStaff(s); return db().content.find((c) => c.id === cid) ?? null; },
  async adminSaveSalesContent(s, cid, input) {
    mustStaff(s);
    const st = db();
    if (cid) {
      const c = st.content.find((x) => x.id === cid);
      if (!c) throw new Error("not_found");
      if (c.status !== "draft") throw new Error("Published content is immutable: create a new version");
      Object.assign(c, { ...input, updatedAt: iso(now()) });
      audit(s, "sales_content.update", "sales_content", c.id, null, { title: c.title }, null);
      return { id: c.id };
    }
    const version = 1 + Math.max(0, ...st.content.filter((x) => x.kind === input.kind && x.key === input.key && x.locale === input.locale).map((x) => x.version));
    const c = { ...input, id: id("cnt"), version, status: "draft", productId: "prod_studio", publishedAt: null, updatedAt: iso(now()) } as SalesContent;
    st.content.push(c);
    audit(s, "sales_content.insert", "sales_content", c.id, null, { kind: c.kind, key: c.key, locale: c.locale, version }, null);
    return { id: c.id };
  },
  async adminSetSalesContentStatus(s, cid, status, reason) {
    mustStaff(s);
    const st = db();
    const c = st.content.find((x) => x.id === cid);
    if (!c) throw new Error("not_found");
    if (status === "active") {
      for (const o of st.content) if (o.kind === c.kind && o.key === c.key && o.locale === c.locale && o.status === "active" && o.id !== c.id) o.status = "archived";
      c.publishedAt = iso(now());
    }
    c.status = status;
    audit(s, `sales_content.${status === "active" ? "publish" : "archive"}`, "sales_content", c.id, null, { version: c.version }, reason);
  },
  async adminNewSalesContentVersion(s, cid, locale) {
    mustStaff(s);
    const c = db().content.find((x) => x.id === cid);
    if (!c) throw new Error("not_found");
    return demoRepo.adminSaveSalesContent(s, null, { kind: c.kind, key: c.key, locale: (locale ?? c.locale) as Locale, title: c.title, summary: c.summary,
      targetKey: c.targetKey, channel: c.channel, stage: c.stage, tags: c.tags, sort: c.sort, body: structuredClone(c.body) });
  },
  async adminDeleteSalesContentDraft(s, cid) {
    mustStaff(s);
    const st = db();
    const c = st.content.find((x) => x.id === cid);
    if (c?.status !== "draft") throw new Error("Only drafts can be deleted");
    st.content = st.content.filter((x) => x.id !== cid);
  },
  async adminSalesAnalytics(s) {
    mustStaff(s);
    const st = db();
    const byContent = new Map<string, { kind: string; key: string; views: number; copies: number; affiliates: number; who: Set<string> }>();
    for (const e of st.events) {
      if (!e.contentKey) continue;
      const k = `${e.contentKind}:${e.contentKey}`;
      const r = byContent.get(k) ?? { kind: e.contentKind ?? "", key: e.contentKey, views: 0, copies: 0, affiliates: 0, who: new Set<string>() };
      if (e.event === "content_view") r.views++;
      if (e.event === "content_copy") r.copies++;
      if (e.affiliateId) r.who.add(e.affiliateId);
      r.affiliates = r.who.size;
      byContent.set(k, r);
    }
    const pages = st.pages.filter((p) => !p.archivedAt).map((p) => ({
      id: p.id, slug: p.slug, path_key: p.pathKey, template_key: p.templateKey, target: st.markets.find((m) => m.id === p.marketId)?.slug ?? null, cta_mode: p.ctaMode,
      visitors: new Set(st.clicks.filter((c) => c.pageId === p.id).map((c) => c.visitorId)).size,
      leads: st.leads.filter((l) => l.pageId === p.id).length, checkouts: 0, sales: 0,
    }));
    return {
      content: [...byContent.values()].map((row) => {
        const { who, ...result } = row;
        void who;
        return result;
      }).sort((a, b) => b.views + b.copies - a.views - a.copies),
      targets: st.markets.map((m) => ({ target: m.slug, pages: pages.filter((p) => p.target === m.slug).length,
        visitors: pages.filter((p) => p.target === m.slug).reduce((a, p) => a + p.visitors, 0), leads: pages.filter((p) => p.target === m.slug).reduce((a, p) => a + p.leads, 0) }))
        .filter((t) => t.pages > 0),
      pages,
      campaigns: st.campaigns.map((c) => ({ id: c.id, name: c.name, source: c.source, target: st.markets.find((m) => m.id === c.marketId)?.slug ?? null,
        leads: st.leads.filter((l) => l.campaignId === c.id).length, sales: st.sales.filter((x) => x.campaignId === c.id && x.status === "paid").length })),
      objections: [...byContent.values()].filter((r) => r.kind === "objection").map((r) => ({ key: r.key, views: r.views + r.copies })),
    };
  },
  async adminListSalesPages(s) {
    mustStaff(s);
    return db().pages.map((p) => ({ ...p, affiliateName: affiliateName(p.affiliateId) }));
  },
  async adminSetSalesPageActive(s, pid, active, reason) {
    mustStaff(s);
    const p = db().pages.find((x) => x.id === pid);
    if (!p) throw new Error("not_found");
    audit(s, "sales_page.active", "private_sales_page", p.id, { active: p.isActive }, { active }, reason);
    p.isActive = active;
  },
  async adminUpdateMarket(s, marketId, locale, content: MarketContent, isActive) {
    mustStaff(s);
    const m = db().markets.find((x) => x.id === marketId);
    if (!m) throw new Error("not_found");
    audit(s, "market.update", "market", m.slug, m.content[locale] ?? null, content, null);
    m.content[locale] = content;
    m.active = isActive;
  },
};

/** Demo sign-in helper — returns the cookie value for a demo persona. */
export function demoUserId(persona: "affiliate" | "admin" | "pending") {
  return persona === "admin" ? "usr_admin" : persona === "pending" ? "usr_jordan" : "usr_mathieu";
}
