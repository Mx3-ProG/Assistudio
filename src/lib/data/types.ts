import type { CommissionStatus, SaleStatus, Balances } from "@/lib/commission";
import type { AttributionModel } from "@/lib/attribution";
import type { Market } from "@/content/markets";
import type { SalesAsset } from "@/content/sales-kit";
import type { Locale } from "@/i18n/config";
import type { ContentKind, Channel, FunnelStage, CtaMode } from "@/lib/sales/content";
import type { OfferTier } from "@/lib/offers";

export type Role = "super_admin" | "admin" | "affiliate_manager" | "agency" | "sales_closer" | "affiliate";
export type AffiliateStatus = "pending" | "approved" | "rejected" | "suspended";
/** "interested" is legacy (V0.1): migrated to "qualified", never offered anymore. */
export type ProspectStage = "new" | "contacted" | "replied" | "qualified" | "interested" | "appointment" | "proposal" | "checkout" | "won" | "lost";
export type PayoutStatus = "scheduled" | "processing" | "paid" | "failed" | "cancelled";
export type ActivityType =
  | "click" | "visitor" | "lead" | "appointment" | "checkout_started" | "sale_pending" | "payment_confirmed"
  | "commission_pending" | "commission_validated" | "commission_available" | "commission_reversed"
  | "commission_disputed" | "commission_paid" | "payout_completed" | "renewal" | "renewal_confirmed"
  | "payment_failed" | "customer_lost";
export type NotificationStatus = "unread" | "read" | "archived";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired" | "incomplete" | "unpaid" | "paused";
export type FraudType =
  | "duplicate_lead" | "self_referral" | "suspicious_traffic" | "bot_traffic"
  | "abnormal_clicks" | "duplicate_account" | "commission_dispute" | "manual_review";
export type FraudStatus = "open" | "reviewing" | "dismissed" | "confirmed";

export const PROSPECT_STAGES: ProspectStage[] = ["new", "contacted", "replied", "qualified", "appointment", "proposal", "checkout", "won", "lost"];
export const STAFF_ROLES: Role[] = ["super_admin", "admin"];

export interface Session {
  userId: string;
  email: string;
  role: Role;
  fullName: string;
  displayName: string | null;
  locale: Locale;
  leaderboardOptIn: boolean;
  affiliate: Affiliate | null;
  isDemo: boolean;
}

export interface Affiliate {
  id: string;
  code: string;
  slug: string | null;
  status: AffiliateStatus;
  commissionRate: number;
  onboardingStep: number;
  onboardingCompletedAt: string | null;
  monthlyGoalSales: number | null;
  payoutProvider: string | null;
  payoutAccountRef: string | null;
  createdAt: string;
  sponsorId: string | null;
}

export interface Settings {
  attributionWindowDays: number;
  attributionModel: AttributionModel;
  commissionValidationDays: number;
  payoutMinimumCents: number;
  leaderboardEnabled: boolean;
  autoApprove: boolean;
  refundPartialPolicy: "manual_review" | "proportional" | "full_reversal";
  billingEmailsOwner: "stripe" | "studio";
  connectEnabled: boolean;
  checkoutEnabled: boolean;
  /** referrals.sponsor_rate — share of an eligible payment paid to the seller's direct sponsor. */
  sponsorRate: number;
}

export interface Offer {
  id: string;
  productId: string;
  productName: string;
  /** Studio One / Pro / Premium, from the offer's Stripe lookup key. */
  tier: OfferTier;
  priceCents: number;
  currency: string;
  interval: "month" | "year" | "one_time";
  commissionRate: number;
  recurring: boolean;
}

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface EarningsPoint {
  date: string; // YYYY-MM-DD
  cents: number;
}

export interface Overview {
  balances: Balances;
  activeClients: number;
  opportunities: number;
  clicks: number;
  earnings: EarningsPoint[];
  activity: ActivityEvent[];
  nextActions: Prospect[];
  goal: { target: number | null; current: number };
}

export interface TrackingLink {
  id: string;
  code: string;
  name: string;
  campaignId: string | null;
  campaignName: string | null;
  source: string | null;
  marketId: string | null;
  isDefault: boolean;
  createdAt: string;
  stats: LinkStats;
  pageId?: string | null;
  channel?: string | null;
}

export interface LinkStats {
  clicks: number;
  uniqueVisitors: number;
  leads: number;
  conversions: number;
  revenueCents: number;
  commissionCents: number;
}

export interface PrivatePage {
  id: string;
  slug: string;
  affiliateId: string;
  marketId: string | null;
  campaignId: string | null;
  locale: Locale;
  pitchVariant: "default" | "premium" | "automation";
  ctaVariant: "request" | "call";
  displayName: string | null;
  visibility: "private" | "unlisted" | "public";
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  // V0.3 — affiliate sales pages (/a/{affiliate}/{pathKey})
  pathKey: string | null;
  templateKey: string | null;
  angleKey: string | null;
  productId: string | null;
  ctaMode: CtaMode;
  showAdvisor: boolean;
  advisor: Record<string, string>;
  indexable: boolean;
  archivedAt: string | null;
}

export interface SalesPageInput {
  marketId: string | null;
  pathKey: string;
  locale: Locale;
  templateKey: string;
  angleKey: string | null;
  ctaMode: CtaMode;
  showAdvisor: boolean;
  advisor: Record<string, string>;
  campaignId: string | null;
}

/** Funnel row from public.affiliate_performance — each stage from its own source. */
export interface PerformanceRow {
  dimension: "total" | "page" | "link" | "campaign";
  refId: string | null;
  clicks: number;
  visitors: number;
  ctaClicks: number;
  leads: number;
  checkouts: number;
  sales: number;
  revenueCents: number;
  /** Non-reversed commissions, INCLUDING pending ones (see commissionPendingCents). */
  commissionCents: number;
  commissionPendingCents: number;
}

export interface ProductView {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  offer: { priceCents: number; currency: string; interval: "month" | "year" | "one_time"; checkoutReady: boolean } | null;
}

export interface SalesEventInput {
  event: "cta_click" | "content_view" | "content_copy" | "page_share" | "start_selling" | "playbook_open";
  affiliateId: string | null;
  visitorId?: string | null;
  privatePageId?: string | null;
  linkId?: string | null;
  campaignId?: string | null;
  contentKind?: string | null;
  contentKey?: string | null;
  targetKey?: string | null;
  channel?: string | null;
  meta?: Record<string, string | number | boolean>;
}

export interface SalesContentInput {
  kind: ContentKind;
  key: string;
  locale: Locale;
  title: string;
  summary: string | null;
  targetKey: string | null;
  channel: Channel | null;
  stage: FunnelStage | null;
  tags: string[];
  sort: number;
  body: unknown;
}

export interface SalesAnalytics {
  content: { kind: string; key: string; views: number; copies: number; affiliates: number }[];
  targets: { target: string; pages: number; visitors: number; leads: number }[];
  pages: { id: string; slug: string; path_key: string | null; template_key: string | null; target: string | null; cta_mode: string; visitors: number; leads: number; checkouts: number; sales: number }[];
  campaigns: { id: string; name: string; source: string | null; target: string | null; leads: number; sales: number }[];
  objections: { key: string; views: number }[];
}

export interface Prospect {
  id: string;
  name: string;
  company: string | null;
  profession: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  source: string | null;
  campaignId: string | null;
  marketId: string | null;
  stage: ProspectStage;
  nextAction: string | null;
  nextActionAt: string | null;
  potentialValueCents: number | null;
  createdAt: string;
  stageChangedAt?: string | null;
  leadId?: string | null;
}

export type ProspectInput = Omit<Prospect, "id" | "createdAt" | "stageChangedAt" | "leadId">;

export interface SaleRow {
  id: string;
  ref: string;
  customerRef: string;
  customerName: string | null;
  product: string;
  date: string;
  status: SaleStatus;
  kind: "new" | "renewal" | "upgrade" | "downgrade";
  amountCents: number;
  commissionCents: number | null;
  commissionStatus: CommissionStatus | null;
  renewalDate: string | null;
  source: string | null;
  campaign: string | null;
  isDemo?: boolean;
}

export interface CommissionRow {
  id: string;
  kind?: "new" | "renewal" | "upgrade" | "downgrade" | null;
  saleRef: string;
  customerRef: string;
  grossCents: number;
  amountCents: number;
  status: CommissionStatus;
  validatedAt: string | null;
  holdUntil: string | null;
  expectedPaymentDate: string | null;
  paidAt: string | null;
  reversalReason: string | null;
  createdAt: string;
}

/** One attributed contract. Every "next"/"projected" value is a projection, never earned money. */
export interface RecurringContract {
  subscriptionId: string;
  customerRef: string;
  customerName: string | null;
  productName: string;
  startedAt: string;
  renewalDate: string;
  annualCents: number;
  currency: string;
  status: SubscriptionStatus;
  /** Cancellation scheduled: will not renew. */
  cancelling: boolean;
  ruleLabel: string | null;
  ruleRate: number | null;
  ruleDurationMonths: number | null;
  nextCommissionEligible: boolean;
  nextCommissionReason: string | null;
  /** Potential commission on the next renewal payment (0 when not eligible). */
  nextCommissionCents: number;
  projected12mCents: number;
  renewalsCount: number;
  lastPaidAt: string | null;
  /** Renewal due within 60 days (computed server-side). */
  renewsSoon?: boolean;
}

export interface RecurringBook {
  contracts: RecurringContract[];
  currency: string;
  activeCount: number;
  annualRevenueCents: number;
  potentialRenewalCommissionsCents: number;
  upcoming60dCount: number;
  renewedCount: number;
  cancelledCount: number;
  earnedCents: number;
}

/** "What did I sell, generate, earn, get paid — and what might renew?" */
export interface FinancialOverview {
  currency: string;
  /** Collected revenue of the affiliate's sales (refunded / charged-back sales excluded). */
  revenueGeneratedCents: number;
  balances: Balances;
  recurringContracts: number;
  /** Mathematical projection of known renewals over 12 months. NOT guaranteed. */
  potentialNext12mCents: number;
  latestSale: { ref: string; kind: "new" | "renewal" | "upgrade" | "downgrade"; grossCents: number; commissionCents: number | null; commissionStatus: CommissionStatus | null; at: string } | null;
}

export interface ConnectStatus {
  enabled: boolean;
  providerConfigured: boolean;
  accountConnected: boolean;
  onboardingStatus: "not_started" | "pending" | "complete" | "restricted";
  payoutsEnabled: boolean;
  requirementsStatus: string | null;
  updatedAt: string | null;
}

export interface Payout {
  id: string;
  ref: string;
  amountCents: number;
  status: PayoutStatus;
  scheduledFor: string;
  paidAt: string | null;
  documentPath: string | null;
}

export interface Notification {
  id: string;
  type: string;
  titleKey: string;
  params: Record<string, string | number>;
  href: string | null;
  readAt: string | null;
  status: NotificationStatus;
  createdAt: string;
}

export interface LeaderboardRow {
  rank: number;
  displayName: string;
  sales: number;
  isMe: boolean;
}

export interface AnalyticsData {
  funnel: { visitors: number; leads: number; appointments: number; sales: number };
  byCampaign: { name: string; clicks: number; leads: number; sales: number }[];
  byCountry: { key: string; clicks: number }[];
  byDevice: { key: string; clicks: number }[];
}

export interface ReferralTarget {
  affiliateId: string;
  affiliateCode: string;
  linkId: string | null;
  linkCode: string | null;
  campaignId: string | null;
  displayName: string | null;
  active: boolean;
}

export interface ReferralDashboard {
  code: string;
  slug: string | null;
  sponsor: { name: string } | null;
  recruits: {
    id: string;
    name: string;
    status: AffiliateStatus;
    joinedAt: string;
    sales: number;
    commissionCents: number;
  }[];
  totalCommissionCents: number;
  pendingCommissionCents: number;
  availableCommissionCents: number;
}

export interface LeadInput {
  fullName: string;
  company: string | null;
  profession: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  message: string | null;
  locale: Locale;
  affiliateId: string | null;
  linkId: string | null;
  campaignId: string | null;
  privatePageId: string | null;
  visitorId: string | null;
  attributionModel: AttributionModel | null;
  firstClickAt: string | null;
  lastClickAt: string | null;
  utm: Record<string, string>;
  /** V0.3: what the visitor asked for on a sales page. */
  requestType?: "info" | "call" | "question" | "quote" | null;
  /** V0.3: explicit consent to be contacted by the page's advisor → lead reaches the affiliate CRM. */
  advisorConsent?: boolean;
}

export interface ClickInput {
  affiliateId: string;
  /** Code the visitor came through (link code or affiliate code). */
  referralCode?: string;
  linkId: string | null;
  campaignId: string | null;
  privatePageId: string | null;
  visitorId: string;
  landingPath: string;
  utm: Record<string, string>;
  referrerHost: string | null;
  country: string | null;
  deviceType: string;
  ipHash: string | null;
  uaHash: string | null;
  isBot: boolean;
}

// ----------------------------------------------------------------- admin
export interface AdminOverview {
  affiliates: number;
  applications: number;
  clicks30d: number;
  leads: number;
  sales: number;
  revenueCents: number;
  commissionsOwedCents: number;
  paidOutCents: number;
  renewals60d: number;
  openFraudFlags: number;
}

export interface AdminAffiliateRow {
  id: string;
  name: string;
  email: string;
  code: string;
  status: AffiliateStatus;
  country: string | null;
  sales: number;
  availableCents: number;
  createdAt: string;
  application: Record<string, unknown>;
}

export interface AdminCommissionRow extends CommissionRow {
  affiliateId: string;
  affiliateName: string;
  kind: "new" | "renewal" | "upgrade" | "downgrade" | null;
  currency: string;
  disputeReason: string | null;
  recoveryStatus: "required" | "recovered" | "written_off" | null;
}

export interface AdminFinanceFilters {
  from?: string | null;
  to?: string | null;
  affiliateId?: string | null;
  productId?: string | null;
  status?: string | null;
  country?: string | null;
  campaignId?: string | null;
  currency?: string;
}

export interface AdminFinanceSummary {
  currency: string;
  grossRevenueCents: number;
  attributedRevenueCents: number;
  salesCount: number;
  renewalsCount: number;
  pendingCommissionsCents: number;
  disputedCommissionsCents: number;
  availableCommissionsCents: number;
  paidCommissionsCents: number;
  reversedCommissionsCents: number;
  recoveryRequiredCount: number;
  refundsCents: number;
  chargebacksCount: number;
  chargebacksCents: number;
  openDisputesCount: number;
  activeSubscriptions: number;
  upcomingRenewals60d: number;
  cancellingSubscriptions: number;
  webhooksFailed: number;
  webhooksLastReceivedAt: string | null;
  emailsFailed: number;
}

export interface AdminFinanceOptions {
  affiliates: { id: string; name: string }[];
  products: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
  countries: string[];
}

export interface AdminSaleRow extends SaleRow {
  affiliateId: string | null;
  affiliateName: string | null;
}

export interface FraudFlag {
  id: string;
  type: FraudType;
  severity: 1 | 2 | 3;
  affiliateName: string | null;
  entity: string | null;
  entityId: string | null;
  signals: Record<string, unknown>;
  status: FraudStatus;
  decisionNote: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  reason: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface AdminLeadRow {
  id: string;
  fullName: string;
  company: string | null;
  profession: string | null;
  email: string;
  affiliateId: string | null;
  affiliateName: string | null;
  status: string;
  createdAt: string;
}

export interface AdminPayoutCandidate {
  affiliateId: string;
  affiliateName: string;
  availableCents: number;
}

export type { Market, SalesAsset };
