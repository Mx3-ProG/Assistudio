import type {
  Session, Settings, Offer, Overview, TrackingLink, LinkStats, PrivatePage, Prospect, ProspectInput,
  SaleRow, CommissionRow, RecurringBook, Payout, Notification, NotificationStatus, LeaderboardRow, AnalyticsData,
  FinancialOverview, ConnectStatus, AdminFinanceFilters, AdminFinanceSummary, AdminFinanceOptions,
  ReferralTarget, ReferralDashboard, LeadInput, ClickInput, Market, SalesAsset, AdminOverview, AdminAffiliateRow,
  AdminCommissionRow, AdminSaleRow, AdminLeadRow, FraudFlag, FraudStatus, AuditLog, AdminPayoutCandidate, AffiliateStatus,
  SalesPageInput, PerformanceRow, ProductView, SalesEventInput, SalesContentInput, SalesAnalytics,
  PromoCode,
} from "./types";
import type { SalesContent, ContentKind, ContentStatus } from "@/lib/sales/content";
import type { Balances } from "@/lib/commission";
import type { Locale } from "@/i18n/config";
import type { CodePurpose } from "@/lib/auth-code";
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
export type IssueCodeResult = "issued" | "no_account" | "too_soon" | "rate_limited";
export type SignInWithCodeResult =
  | { status: "ok"; isNew: boolean; role: Session["role"] }
  | { status: "invalid" | "expired" | "too_many_attempts" }
  /** Technical failure after a valid code; `detail` is short and non-sensitive (src/lib/auth-errors.ts). */
  | { status: "failed"; detail?: string; retrySameCode?: boolean };
/** Sign-up form data, stored with the code and given to handle_new_user() as user metadata. */
export interface SignupData {
  full_name: string;
  locale: Locale;
  country: string | null;
  sponsor_code: string | null;
  application: { channels: string; terms_accepted_at: string };
}

export interface Repo {
  // ------------------------------------------------------------- public
  getSettings(): Promise<Settings>;
  /** The offer paying the highest commission (Studio Premium): the maximum an affiliate can earn per sale. */
  getOffer(): Promise<Offer>;
  /** The three active Studio ATS offers, One → Pro → Premium. */
  listOffers(): Promise<Offer[]>;
  listMarkets(): Promise<Market[]>;
  resolveReferral(codeOrSlug: string): Promise<ReferralTarget | null>;
  getPrivatePage(slug: string): Promise<(PrivatePage & { referral: ReferralTarget }) | null>;
  recordClick(input: ClickInput): Promise<void>;
  recordPrivatePageView(pageId: string): Promise<void>;
  createLead(input: LeadInput): Promise<{ id: string }>;
  /** Catalog with the active offer of each product (prices are never stored on content or pages). */
  listProducts(): Promise<ProductView[]>;
  /** Active sales page by affiliate slug/code + path key (null = the affiliate's general page). */
  getSalesPage(affiliate: string, pathKey: string | null): Promise<(PrivatePage & { referral: ReferralTarget }) | null>;
  /** Published content for rendering public sales pages (no session needed; active rows only). */
  listPublishedContent(kinds: ContentKind[]): Promise<SalesContent[]>;
  /** Usage / funnel events (service role). No personal data. */
  recordSalesEvent(e: SalesEventInput): Promise<void>;
  /** Sales Center rules read from settings (CRM thresholds, page options). */
  getSalesSettings(): Promise<{ followUpDays: number; checkoutCheckInDays: number; allowIndexing: boolean; advisorEnabled: boolean }>;

  // ------------------------------------------------------------- session
  getSession(): Promise<Session | null>;

  // ------------------------------------------------------------- passwordless sign-in (email codes)
  /**
   * Stores a new one-time code (its hash only — see src/lib/auth-code.ts).
   * A login request for an address without an account returns `no_account`
   * and stores nothing; the caller answers the same way (no user enumeration).
   */
  issueSignInCode(input: { email: string; purpose: CodePurpose; codeHash: string; signup: SignupData | null; ipHash: string | null }): Promise<IssueCodeResult>;
  /** Checks the code; on success opens the session, creating the account on a first sign-up. */
  signInWithCode(input: { email: string; codeHash: string }): Promise<SignInWithCodeResult>;

  // ------------------------------------------------------------- affiliate
  getOverview(s: Session, range: Range): Promise<Overview>;
  getBalances(s: Session): Promise<Balances>;
  getFinancialOverview(s: Session): Promise<FinancialOverview>;
  getDefaultLink(s: Session): Promise<TrackingLink>;
  getLinkStats(s: Session): Promise<LinkStats>;
  listLinks(s: Session): Promise<TrackingLink[]>;
  createCampaignLink(s: Session, input: { name: string; source: string | null; marketId: string | null; pageId?: string | null; messageKey?: string | null }): Promise<TrackingLink>;
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
  getReferralDashboard(s: Session): Promise<ReferralDashboard>;
  listSalesAssets(s: Session, locale: Locale): Promise<SalesAsset[]>;
  setMonthlyGoal(s: Session, target: number): Promise<void>;
  listPromoCodes(s: Session): Promise<PromoCode[]>;
  createPromoCode(s: Session, input: { code: string; discountRate: number }): Promise<PromoCode>;
  setPromoCodeActive(s: Session, id: string, active: boolean): Promise<void>;

  // ------------------------------------------------------------- sales center (affiliate)
  /** Active content, every locale (the caller resolves locale fallback with pickLocale). */
  listSalesContent(s: Session, kinds?: ContentKind[]): Promise<SalesContent[]>;
  listFavorites(s: Session): Promise<{ kind: string; key: string }[]>;
  setFavorite(s: Session, kind: string, key: string, on: boolean): Promise<void>;
  listProgress(s: Session): Promise<string[]>;
  setProgress(s: Session, itemKey: string, done: boolean): Promise<void>;
  getPerformance(s: Session): Promise<PerformanceRow[]>;
  createSalesPage(s: Session, input: SalesPageInput): Promise<PrivatePage>;
  updateSalesPage(s: Session, id: string, input: SalesPageInput): Promise<void>;
  archiveSalesPage(s: Session, id: string): Promise<void>;
  createLink(s: Session, input: { name: string; pageId: string | null; marketId: string | null; channel: string | null }): Promise<TrackingLink>;
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
  adminListSalesContent(s: Session): Promise<SalesContent[]>;
  adminGetSalesContent(s: Session, id: string): Promise<SalesContent | null>;
  /** Insert a new draft (no id) or update an existing DRAFT. Published rows are immutable. */
  adminSaveSalesContent(s: Session, id: string | null, input: SalesContentInput): Promise<{ id: string }>;
  adminSetSalesContentStatus(s: Session, id: string, status: Exclude<ContentStatus, "draft">, reason: string | null): Promise<void>;
  adminNewSalesContentVersion(s: Session, id: string, locale: Locale | null): Promise<{ id: string }>;
  adminDeleteSalesContentDraft(s: Session, id: string): Promise<void>;
  adminSalesAnalytics(s: Session, sinceDays: number): Promise<SalesAnalytics>;
  adminListSalesPages(s: Session): Promise<(PrivatePage & { affiliateName: string | null })[]>;
  adminSetSalesPageActive(s: Session, id: string, active: boolean, reason: string): Promise<void>;
}
