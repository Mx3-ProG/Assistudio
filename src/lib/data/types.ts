import type { CommissionStatus, SaleStatus, Balances } from "@/lib/commission";
import type { AttributionModel } from "@/lib/attribution";
import type { Market } from "@/content/markets";
import type { SalesAsset } from "@/content/sales-kit";
import type { Locale } from "@/i18n/config";

export type Role = "super_admin" | "admin" | "affiliate_manager" | "agency" | "sales_closer" | "affiliate";
export type AffiliateStatus = "pending" | "approved" | "rejected" | "suspended";
export type ProspectStage = "new" | "contacted" | "interested" | "appointment" | "proposal" | "won" | "lost";
export type PayoutStatus = "scheduled" | "processing" | "paid" | "failed" | "cancelled";
export type ActivityType =
  | "click" | "visitor" | "lead" | "appointment" | "sale_pending" | "payment_confirmed"
  | "commission_validated" | "commission_paid" | "renewal" | "customer_lost";
export type FraudType =
  | "duplicate_lead" | "self_referral" | "suspicious_traffic" | "bot_traffic"
  | "abnormal_clicks" | "duplicate_account" | "commission_dispute" | "manual_review";
export type FraudStatus = "open" | "reviewing" | "dismissed" | "confirmed";

export const PROSPECT_STAGES: ProspectStage[] = ["new", "contacted", "interested", "appointment", "proposal", "won", "lost"];
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
}

export interface Settings {
  attributionWindowDays: number;
  attributionModel: AttributionModel;
  commissionValidationDays: number;
  payoutMinimumCents: number;
  leaderboardEnabled: boolean;
  autoApprove: boolean;
}

export interface Offer {
  id: string;
  productId: string;
  productName: string;
  priceCents: number;
  currency: string;
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
}

export type ProspectInput = Omit<Prospect, "id" | "createdAt">;

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

export interface RecurringContract {
  subscriptionId: string;
  customerRef: string;
  customerName: string | null;
  startedAt: string;
  renewalDate: string;
  annualCents: number;
  commissionCents: number;
  status: "active" | "past_due" | "cancelled" | "expired";
}

export interface RecurringBook {
  contracts: RecurringContract[];
  earnedCents: number;
  potentialAnnualCents: number;
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
}

export interface ClickInput {
  affiliateId: string;
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
