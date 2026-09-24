import "server-only";
import { cookies } from "next/headers";
import {
  computeCommissionCents, newCommission, summarize, transition,
  type CommissionEvent, type CommissionState, type SaleStatus,
} from "@/lib/commission";
import { defaultMarkets, type Market, type MarketContent } from "@/content/markets";
import { assetsFor } from "@/content/sales-kit";
import type { Repo, Range } from "./repo";
import type {
  Session, Settings, Offer, TrackingLink, PrivatePage, Prospect, SaleRow, CommissionRow,
  Payout, Notification, ActivityEvent, ActivityType, FraudFlag, AuditLog, AffiliateStatus, Role,
  ClickInput, LeadInput, ReferralTarget, LinkStats,
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
}
interface DemoLink { id: string; affiliateId: string; code: string; name: string; campaignId: string | null; isDefault: boolean; createdAt: string }
interface DemoCampaign { id: string; affiliateId: string; name: string; source: string | null; marketId: string | null; createdAt: string }
interface DemoClick { id: string; affiliateId: string; linkId: string | null; visitorId: string; at: string; country: string; device: string; isBot: boolean }
interface DemoLead { id: string; fullName?: string; affiliateId: string | null; linkId: string | null; campaignId: string | null; email: string; profession: string | null; company: string | null; status: string; createdAt: string }
interface DemoCustomer { id: string; ref: string; name: string; email: string }
interface DemoSubscription { id: string; customerId: string; affiliateId: string; startedAt: string; periodEnd: string; status: "active" | "past_due" | "cancelled" | "expired" }
interface DemoSale {
  id: string; ref: string; customerId: string; affiliateId: string | null; subscriptionId: string | null;
  linkId: string | null; campaignId: string | null; kind: "new" | "renewal"; status: SaleStatus;
  amountCents: number; createdAt: string; paidAt: string | null;
}
interface DemoCommission extends CommissionState { id: string; affiliateId: string; saleId: string; payoutId: string | null; expectedPaymentDate: string | null; createdAt: string }
interface DemoPayout { id: string; ref: string; affiliateId: string; amountCents: number; status: Payout["status"]; scheduledFor: string; paidAt: string | null }
interface DemoActivity extends ActivityEvent { affiliateId: string }
interface DemoNotification extends Notification { userId: string }

interface Store {
  markets: (Market & { active: boolean })[];
  settings: Settings;
  offer: Offer;
  users: DemoUser[];
  affiliates: DemoAffiliate[];
  links: DemoLink[];
  campaigns: DemoCampaign[];
  clicks: DemoClick[];
  leads: DemoLead[];
  prospects: (Prospect & { affiliateId: string; deletedAt: string | null })[];
  customers: DemoCustomer[];
  subscriptions: DemoSubscription[];
  sales: DemoSale[];
  commissions: DemoCommission[];
  payouts: DemoPayout[];
  pages: PrivatePage[];
  activity: DemoActivity[];
  notifications: DemoNotification[];
  fraud: (FraudFlag & { affiliateId: string | null })[];
  audit: AuditLog[];
  goals: Record<string, number>;
  privacyRequests: { userId: string; kind: string; at: string }[];
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
  };
  const offer: Offer = {
    id: "offer_studio_annual", productId: "prod_studio", productName: "STUDIO",
    priceCents: 300_000, currency: "EUR", commissionRate: 0.5, recurring: true,
  };

  const s: Store = {
    markets: structuredClone(defaultMarkets).map((m) => ({ ...m, active: true })),
    settings, offer, users: [], affiliates: [], links: [], campaigns: [], clicks: [], leads: [],
    prospects: [], customers: [], subscriptions: [], sales: [], commissions: [], payouts: [], pages: [],
    activity: [], notifications: [], fraud: [], audit: [], goals: {}, privacyRequests: [],
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
      monthlyGoalSales: null, application: { channels: "LinkedIn, network", motivation: "Demo application" },
    });
    s.links.push({ id: `lnk_${key}`, affiliateId: affId, code: `${code}01`, name: "Default", campaignId: null, isDefault: true, createdAt: daysAgo(createdDaysAgo) });
    return affId;
  };

  const me = mkAffiliate("mathieu", "Mathieu Demo", null, "MTH4D2", "mathieu", "approved", false, "affiliate", 210);
  const alex = mkAffiliate("alex", "Alex Demo", "Alex", "ALX7K9", "alex", "approved", true, "affiliate", 320);
  const sofia = mkAffiliate("sofia", "Sofia Demo", "Sofia", "SOF3P8", null, "approved", true, "affiliate", 260);
  const marc = mkAffiliate("marc", "Marc Demo", null, "MRC5T2", null, "approved", true, "affiliate", 150);
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
  // €4,500 earned (€3,000 paid + €1,500 available), €1,500 pending, 3 active clients.
  const mkSale = (
    affiliateId: string, customerName: string, createdDaysAgo: number, paidDaysAgo: number | null,
    status: SaleStatus, opts: { payout?: boolean; linkIdx?: number } = {},
  ) => {
    const cust: DemoCustomer = { id: id("cus"), ref: `CUS-${String(s.customers.length + 1).padStart(4, "0")}`, name: customerName, email: `${customerName.toLowerCase().replace(/\W+/g, ".")}@example.invalid` };
    s.customers.push(cust);
    const link = opts.linkIdx !== undefined ? campaignLinks[opts.linkIdx] : null;
    const sub: DemoSubscription | null = status === "paid"
      ? { id: id("sub"), customerId: cust.id, affiliateId, startedAt: daysAgo(paidDaysAgo!), periodEnd: iso(now() - paidDaysAgo! * DAY + 365 * DAY), status: "active" }
      : null;
    if (sub) s.subscriptions.push(sub);
    const sale: DemoSale = {
      id: id("sal"), ref: `SAL-${String(s.sales.length + 1).padStart(4, "0")}`, customerId: cust.id, affiliateId,
      subscriptionId: sub?.id ?? null, linkId: link?.lid ?? null, campaignId: link?.cid ?? null, kind: "new", status,
      amountCents: offer.priceCents, createdAt: daysAgo(createdDaysAgo), paidAt: paidDaysAgo !== null ? daysAgo(paidDaysAgo) : null,
    };
    s.sales.push(sale);
    let { state } = newCommission(computeCommissionCents(sale.amountCents, offer.commissionRate));
    if (sale.paidAt) {
      ({ state } = transition(state, { type: "sale_status", status: "paid", at: sale.paidAt, validationDays: settings.commissionValidationDays }));
      ({ state } = transition(state, { type: "release", at: iso(now()) }));
      if (state.status === "available") state = { ...state, availableAt: iso(Date.parse(state.holdUntil!)) };
    }
    const com: DemoCommission = {
      ...state, id: id("com"), affiliateId, saleId: sale.id, payoutId: null, createdAt: sale.createdAt,
      expectedPaymentDate: state.holdUntil ? iso(Date.parse(state.holdUntil) + 7 * DAY).slice(0, 10) : null,
    };
    if (opts.payout && com.status === "available") {
      const paidAt = iso(Date.parse(com.availableAt!) + 5 * DAY);
      const p: DemoPayout = { id: id("pay"), ref: `PAY-${String(s.payouts.length + 1).padStart(4, "0")}`, affiliateId, amountCents: com.amountCents, status: "paid", scheduledFor: paidAt.slice(0, 10), paidAt };
      s.payouts.push(p);
      Object.assign(com, transition(com, { type: "payout_paid", at: paidAt }).state, { payoutId: p.id });
    }
    s.commissions.push(com);
    return { sale, com };
  };

  mkSale(me, "Atelier Lumière", 165, 160, "paid", { payout: true, linkIdx: 0 });
  mkSale(me, "Maison Verdier Architecture", 120, 115, "paid", { payout: true, linkIdx: 2 });
  mkSale(me, "Bloom Wedding Co.", 70, 62, "paid", { linkIdx: 3 });
  mkSale(me, "Studio Horizon", 6, 4, "paid", { linkIdx: 4 }); // in validation (still pending)
  // Make the last one pending payment instead, so active clients = 3 and pending = €1,500:
  const last = s.sales[s.sales.length - 1];
  last.status = "pending"; last.paidAt = null;
  s.subscriptions = s.subscriptions.filter((x) => x.id !== last.subscriptionId);
  last.subscriptionId = null;
  Object.assign(s.commissions[s.commissions.length - 1], newCommission(150_000).state);

  // Other affiliates (leaderboard + admin)
  for (let i = 0; i < 14; i++) mkSale(alex, `Alex Client ${i + 1}`, 140 - i * 3, 135 - i * 3 > 1 ? Math.min(135 - i * 3, 25 - i) : 1, "paid", {});
  for (let i = 0; i < 8; i++) mkSale(sofia, `Sofia Client ${i + 1}`, 90 - i * 2, Math.max(1, 20 - i * 2), "paid", {});
  mkSale(marc, "Marc Client 1", 40, 12, "paid", {});
  const refunded = mkSale(marc, "Marc Client 2", 30, 20, "paid", {});
  refunded.sale.status = "refunded";
  Object.assign(refunded.com, transition(refunded.com, { type: "sale_status", status: "refunded", at: daysAgo(10), validationDays: 30 }).state);

  // Prospects (14 open opportunities + won/lost)
  const pnames: [string, string, string, Prospect["stage"], number | null][] = [
    ["Claire Martin", "Atelier Claire", "Photographer", "new", 1],
    ["Hugo Bernard", "Bernard Architectes", "Architect", "contacted", 0],
    ["Inès Petit", "Maison Inès", "Interior designer", "interested", 2],
    ["Lucas Moreau", "Moreau Paysages", "Landscaper", "appointment", 3],
    ["Emma Laurent", "Laurent Events", "Event professional", "proposal", 5],
    ["Nathan Roux", "Roux Films", "Videographer", "new", null],
    ["Chloé Fournier", "Fournier Cuisines", "Kitchen designer", "contacted", 4],
    ["Louis Girard", "Girard Piscines", "Pool installer", "new", null],
    ["Jade Bonnet", "Bonnet Wedding", "Wedding planner", "interested", 1],
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
      nextActionAt: next !== null ? iso(now() + next * DAY) : null, potentialValueCents: 300_000, createdAt: daysAgo(40 - i * 2), deletedAt: null,
    });
  });

  // Private page
  s.pages.push({
    id: "pg_demo", slug: "8FD7K2", affiliateId: me, marketId: "mkt_wedding-planners", campaignId: "cmp_3",
    locale: "fr", pitchVariant: "premium", ctaVariant: "request", displayName: "Mathieu", visibility: "private",
    isActive: true, viewCount: 37, createdAt: daysAgo(35),
  });

  // Activity feed for the demo affiliate
  const acts: [ActivityType, number, Record<string, unknown>][] = [
    ["click", 0.02, { source: "instagram" }], ["visitor", 0.05, { country: "FR" }],
    ["sale_pending", 4, { sale_ref: last.ref, amount_cents: 150_000 }], ["lead", 1, { profession: "Architect" }],
    ["appointment", 2, { profession: "Wedding planner" }], ["commission_validated", 32, { amount_cents: 150_000 }],
    ["payment_confirmed", 62, { sale_ref: "SAL-0003" }], ["commission_paid", 80, { amount_cents: 150_000 }],
    ["click", 0.2, { source: "linkedin" }], ["lead", 6, { profession: "Photographer" }],
  ];
  for (const [type, ago, payload] of acts) s.activity.push({ id: id("act"), affiliateId: me, type, occurredAt: daysAgo(ago), payload });

  s.notifications.push(
    { id: id("ntf"), userId: "usr_mathieu", type: "lead", titleKey: "newLead", params: { profession: "Architect" }, href: "/dashboard", readAt: null, createdAt: daysAgo(1) },
    { id: id("ntf"), userId: "usr_mathieu", type: "commission", titleKey: "commissionAvailable", params: { amount: "€1,500" }, href: "/dashboard/commissions", readAt: null, createdAt: daysAgo(32) },
    { id: id("ntf"), userId: "usr_mathieu", type: "payout", titleKey: "payoutPaid", params: { amount: "€1,500" }, href: "/dashboard/payouts", readAt: daysAgo(70), createdAt: daysAgo(80) },
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

// Bump when the Store shape changes so hot reloads don't keep a stale store.
const STORE_VERSION = 2;
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
    source: c?.source ?? null, marketId: c?.marketId ?? null, isDefault: l.isDefault, createdAt: l.createdAt,
    stats: statsFor((x) => x.linkId === l.id),
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
    id: x.id, ref: x.ref, customerRef: cust.ref, customerName: cust.name, product: "STUDIO", date: x.createdAt,
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
    id: c.id, saleRef: sale.ref, customerRef: cust.ref, grossCents: sale.amountCents, amountCents: c.amountCents,
    status: c.status, validatedAt: c.validatedAt, holdUntil: c.holdUntil, expectedPaymentDate: c.expectedPaymentDate,
    paidAt: c.paidAt, reversalReason: c.reversalReason, createdAt: c.createdAt,
  };
}
function applyCommissionEvent(c: DemoCommission, e: CommissionEvent) {
  Object.assign(c, transition(c, e).state);
}
function affiliateName(affId: string | null) {
  if (!affId) return null;
  const a = db().affiliates.find((x) => x.id === affId);
  return db().users.find((u) => u.userId === a?.userId)?.fullName ?? null;
}

// ---------------------------------------------------------------- repo
export const demoRepo: Repo = {
  async getSettings() { return db().settings; },
  async getOffer() { return db().offer; },
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
    };
    if (st.leads.some((l) => l.email === lead.email)) {
      st.fraud.unshift({ id: id("frd"), type: "duplicate_lead", severity: 1, affiliateId: input.affiliateId, affiliateName: affiliateName(input.affiliateId), entity: "lead", entityId: lead.id, signals: {}, status: "open", decisionNote: null, createdAt: iso(now()) });
    }
    st.leads.push(lead);
    if (input.affiliateId) {
      st.activity.push({ id: id("act"), affiliateId: input.affiliateId, type: "lead", occurredAt: iso(now()), payload: { profession: input.profession } });
      const aff = st.affiliates.find((a) => a.id === input.affiliateId);
      if (aff) st.notifications.unshift({ id: id("ntf"), userId: aff.userId, type: "lead", titleKey: "newLead", params: { profession: input.profession ?? "—" }, href: "/dashboard", readAt: null, createdAt: iso(now()) });
    }
    return { id: lead.id };
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
      },
    };
  },

  async getBalances(s) {
    const aff = mustAffiliate(s);
    return summarize(db().commissions.filter((c) => c.affiliateId === aff));
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
      balances: summarize(mine),
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
    st.campaigns.push(c);
    const code = `${s.affiliate!.code}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const l: DemoLink = { id: id("lnk"), affiliateId: aff, code, name: input.name, campaignId: c.id, isDefault: false, createdAt: iso(now()) };
    st.links.push(l);
    return toLink(l);
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
    const p: PrivatePage = { ...input, id: id("pg"), slug, affiliateId: aff, isActive: true, viewCount: 0, createdAt: iso(now()) };
    db().pages.push(p);
    return p;
  },

  async listProspects(s) {
    const aff = mustAffiliate(s);
    return db().prospects.filter((p) => p.affiliateId === aff && !p.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async createProspect(s, input) {
    const aff = mustAffiliate(s);
    const p = { ...input, id: id("prs"), createdAt: iso(now()), affiliateId: aff, deletedAt: null };
    db().prospects.push(p);
    return p;
  },
  async updateProspect(s, pid, patch) {
    const aff = mustAffiliate(s);
    const p = db().prospects.find((x) => x.id === pid && x.affiliateId === aff);
    if (!p) throw new Error("not_found");
    Object.assign(p, patch);
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
    const contracts = st.subscriptions.filter((x) => x.affiliateId === aff).map((sub) => {
      const cust = st.customers.find((c) => c.id === sub.customerId)!;
      return {
        subscriptionId: sub.id, customerRef: cust.ref, customerName: cust.name, startedAt: sub.startedAt,
        renewalDate: sub.periodEnd, annualCents: st.offer.priceCents,
        commissionCents: computeCommissionCents(st.offer.priceCents, st.offer.commissionRate), status: sub.status,
      };
    }).sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));
    const active = contracts.filter((c) => c.status === "active");
    return {
      contracts,
      earnedCents: summarize(st.commissions.filter((c) => c.affiliateId === aff)).lifetimeEarnedCents,
      potentialAnnualCents: active.reduce((a, c) => a + c.commissionCents, 0),
    };
  },
  async listPayouts(s) {
    const aff = mustAffiliate(s);
    return db().payouts.filter((p) => p.affiliateId === aff).map((p) => ({ id: p.id, ref: p.ref, amountCents: p.amountCents, status: p.status, scheduledFor: p.scheduledFor, paidAt: p.paidAt, documentPath: null }))
      .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
  },
  async listNotifications(s) {
    return db().notifications.filter((n) => n.userId === s.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markNotificationsRead(s) {
    for (const n of db().notifications) if (n.userId === s.userId && !n.readAt) n.readAt = iso(now());
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
  async listSalesAssets(_s, locale: Locale) { return assetsFor(locale); },
  async setMonthlyGoal(s, target) { db().goals[mustAffiliate(s)] = target; },
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
      commissionsOwedCents: b.availableCents + b.inValidationCents,
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
        id: a.id, name: u.fullName, email: u.email, code: a.code, status: a.status, country: a.country,
        sales: st.sales.filter((x) => x.affiliateId === a.id && x.status === "paid").length,
        availableCents: summarize(st.commissions.filter((c) => c.affiliateId === a.id)).availableCents,
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
    if (lead.affiliateId) {
      const { state } = newCommission(computeCommissionCents(sale.amountCents, st.offer.commissionRate));
      st.commissions.push({ ...state, id: id("com"), affiliateId: lead.affiliateId, saleId: sale.id, payoutId: null, expectedPaymentDate: null, createdAt: sale.createdAt });
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
      const sub: DemoSubscription = { id: id("sub"), customerId: sale.customerId, affiliateId: sale.affiliateId!, startedAt: sale.paidAt, periodEnd: iso(now() + 365 * DAY), status: "active" };
      if (sale.affiliateId && !sale.subscriptionId) { st.subscriptions.push(sub); sale.subscriptionId = sub.id; }
    } else if (sale.subscriptionId) {
      const sub = st.subscriptions.find((x) => x.id === sale.subscriptionId);
      if (sub) sub.status = "cancelled";
    }
    const com = st.commissions.find((c) => c.saleId === sale.id);
    if (com) {
      applyCommissionEvent(com, { type: "sale_status", status, at: iso(now()), validationDays: st.settings.commissionValidationDays });
      if (com.holdUntil && !com.expectedPaymentDate) com.expectedPaymentDate = iso(Date.parse(com.holdUntil) + 7 * DAY).slice(0, 10);
    }
    if (sale.affiliateId && status === "paid") {
      st.activity.push({ id: id("act"), affiliateId: sale.affiliateId, type: "payment_confirmed", occurredAt: iso(now()), payload: { sale_ref: sale.ref } });
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
    if (com) {
      let { state } = newCommission(com.amountCents);
      if (sale.paidAt) ({ state } = transition(state, { type: "sale_status", status: "paid", at: sale.paidAt, validationDays: st.settings.commissionValidationDays }));
      st.commissions.push({ ...state, id: id("com"), affiliateId: affId, saleId, payoutId: null, expectedPaymentDate: com.expectedPaymentDate, createdAt: iso(now()) });
    }
  },
  async adminListCommissions(s) {
    mustStaff(s);
    return db().commissions.map((c) => ({ ...commissionRow(c), affiliateId: c.affiliateId, affiliateName: affiliateName(c.affiliateId) ?? "—" }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async adminHoldCommission(s, cid, hold, reason) {
    mustStaff(s);
    const c = db().commissions.find((x) => x.id === cid);
    if (!c) throw new Error("not_found");
    audit(s, hold ? "commission.hold" : "commission.unhold", "commission", cid, { status: c.status }, null, reason);
    applyCommissionEvent(c, hold ? { type: "hold", reason } : { type: "unhold", at: iso(now()), reason });
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
  async adminPayoutCandidates(s) {
    mustStaff(s);
    const st = db();
    return st.affiliates.map((a) => ({
      affiliateId: a.id, affiliateName: affiliateName(a.id) ?? "—",
      availableCents: st.commissions.filter((c) => c.affiliateId === a.id && c.status === "available" && !c.payoutId).reduce((x, c) => x + c.amountCents, 0),
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
    const total = coms.reduce((a, c) => a + c.amountCents, 0);
    if (total < st.settings.payoutMinimumCents) throw new Error("below_minimum");
    const p: DemoPayout = { id: id("pay"), ref: `PAY-${String(st.payouts.length + 1).padStart(4, "0")}`, affiliateId: affId, amountCents: total, status: "scheduled", scheduledFor: iso(now()).slice(0, 10), paidAt: null };
    st.payouts.push(p);
    for (const c of coms) c.payoutId = p.id;
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
    st.activity.push({ id: id("act"), affiliateId: p.affiliateId, type: "commission_paid", occurredAt: p.paidAt, payload: { amount_cents: p.amountCents } });
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
