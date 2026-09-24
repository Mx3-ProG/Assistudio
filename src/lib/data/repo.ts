import type {
  Session, Settings, Offer, Overview, TrackingLink, LinkStats, PrivatePage, Prospect, ProspectInput,
  SaleRow, CommissionRow, RecurringBook, Payout, Notification, NotificationStatus, LeaderboardRow, AnalyticsData,
  FinancialOverview, ConnectStatus, AdminFinanceFilters, AdminFinanceSummary, AdminFinanceOptions,
  ReferralTarget, LeadInput, ClickInput, Market, SalesAsset, AdminOverview, AdminAffiliateRow,
  AdminCommissionRow, AdminSaleRow, AdminLeadRow, FraudFlag, FraudStatus, AuditLog, AdminPayoutCandidate, AffiliateStatus,
} from "./types";
import type { Balances } from "@/lib/commission";
import type { Locale } from "@/i18n/config";
import type { MarketContent } from "@/content/markets";

export type Range = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * The single data-access contract. Two implementations:
 *   - supabase.ts: production (RLS enforces tenant isolation server-side)
 *   - demo.ts:     development only, in-memory, fake data flagged as such
 *
 * Affiliate-scoped methods take the affiliate id from the *session*, never
 * from user input; the Supabase implementation additionally relies on RLS.
 */
export interface Repo {
  // ------------------------------------------------------------- public
  getSettings(): Promise<Settings>;
  getOffer(): Promise<Offer>;
  listMarkets(): Promise<Market[]>;
  resolveReferral(codeOrSlug: string): Promise<ReferralTarget | null>;
  getPrivatePage(slug: string): Promise<(PrivatePage & { referral: ReferralTarget }) | null>;
  recordClick(input: ClickInput): Promise<void>;
  recordPrivatePageView(pageId: string): Promise<void>;
  createLead(input: LeadInput): Promise<{ id: string }>;

  // ------------------------------------------------------------- session
  getSession(): Promise<Session | null>;

  // ------------------------------------------------------------- affiliate
  getOverview(s: Session, range: Range): Promise<Overview>;
  getBalances(s: Session): Promise<Balances>;
  getFinancialOverview(s: Session): Promise<FinancialOverview>;
  getDefaultLink(s: Session): Promise<TrackingLink>;
  getLinkStats(s: Session): Promise<LinkStats>;
  listLinks(s: Session): Promise<TrackingLink[]>;
  createCampaignLink(s: Session, input: { name: string; source: string | null; marketId: string | null }): Promise<TrackingLink>;
  setSlug(s: Session, slug: string): Promise<void>;
  listPrivatePages(s: Session): Promise<PrivatePage[]>;
  createPrivatePage(s: Session, input: Pick<PrivatePage, "marketId" | "campaignId" | "locale" | "pitchVariant" | "ctaVariant" | "displayName" | "visibility">): Promise<PrivatePage>;
  listProspects(s: Session): Promise<Prospect[]>;
  createProspect(s: Session, input: ProspectInput): Promise<Prospect>;
  updateProspect(s: Session, id: string, patch: Partial<ProspectInput>): Promise<void>;
  deleteProspect(s: Session, id: string): Promise<void>;
  listSales(s: Session): Promise<SaleRow[]>;
  listCommissions(s: Session): Promise<CommissionRow[]>;
  getRecurringBook(s: Session): Promise<RecurringBook>;
  listPayouts(s: Session): Promise<Payout[]>;
  listNotifications(s: Session, status?: NotificationStatus | "inbox"): Promise<Notification[]>;
  markNotificationsRead(s: Session): Promise<void>;
  setNotificationStatus(s: Session, id: string, status: NotificationStatus): Promise<void>;
  getConnectStatus(s: Session): Promise<ConnectStatus>;
  getLeaderboard(s: Session): Promise<LeaderboardRow[]>;
  getAnalytics(s: Session, range: Range): Promise<AnalyticsData>;
  listSalesAssets(s: Session, locale: Locale): Promise<SalesAsset[]>;
  setMonthlyGoal(s: Session, target: number): Promise<void>;
  updateProfile(s: Session, patch: { fullName?: string; displayName?: string | null; leaderboardOptIn?: boolean }): Promise<void>;
  setOnboardingStep(s: Session, step: number, completed?: boolean): Promise<void>;
  exportMyData(s: Session): Promise<Record<string, unknown>>;
  requestErasure(s: Session): Promise<void>;

  // ------------------------------------------------------------- admin (staff only)
  adminOverview(s: Session): Promise<AdminOverview>;
  adminListAffiliates(s: Session): Promise<AdminAffiliateRow[]>;
  adminSetAffiliateStatus(s: Session, affiliateId: string, status: AffiliateStatus, reason: string): Promise<void>;
  adminListLeads(s: Session): Promise<AdminLeadRow[]>;
  adminCreateSaleFromLead(s: Session, leadId: string, reason: string): Promise<void>;
  adminListSales(s: Session): Promise<AdminSaleRow[]>;
  adminSetSaleStatus(s: Session, saleId: string, status: "paid" | "refunded" | "chargeback" | "cancelled" | "failed", reason: string): Promise<void>;
  adminCorrectAttribution(s: Session, saleId: string, affiliateId: string, reason: string): Promise<void>;
  adminListCommissions(s: Session): Promise<AdminCommissionRow[]>;
  adminHoldCommission(s: Session, id: string, hold: boolean, reason: string): Promise<void>;
  adminReverseCommission(s: Session, id: string, reason: string): Promise<void>;
  adminReleaseDue(s: Session): Promise<number>;
  adminValidateCommission(s: Session, id: string, reason: string): Promise<void>;
  adminAdjustLedger(s: Session, affiliateId: string, amountCents: number, currency: string, reason: string): Promise<void>;
  adminFinanceSummary(s: Session, filters: AdminFinanceFilters): Promise<AdminFinanceSummary>;
  adminFinanceOptions(s: Session): Promise<AdminFinanceOptions>;
  adminPayoutCandidates(s: Session): Promise<AdminPayoutCandidate[]>;
  adminListPayouts(s: Session): Promise<(Payout & { affiliateName: string })[]>;
  adminCreatePayout(s: Session, affiliateId: string): Promise<void>;
  adminMarkPayoutPaid(s: Session, payoutId: string, providerRef: string): Promise<void>;
  adminListFraudFlags(s: Session): Promise<FraudFlag[]>;
  adminReviewFraudFlag(s: Session, id: string, status: Exclude<FraudStatus, "open">, note: string): Promise<void>;
  adminListAuditLogs(s: Session): Promise<AuditLog[]>;
  adminUpdateSettings(s: Session, patch: Partial<Settings>): Promise<void>;
  adminListMarkets(s: Session): Promise<(Market & { active: boolean })[]>;
  adminUpdateMarket(s: Session, marketId: string, locale: Locale, content: MarketContent, isActive: boolean): Promise<void>;
}
