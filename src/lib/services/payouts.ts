import "server-only";
import { env, isStripeConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { repo } from "@/lib/data";
import type { Session } from "@/lib/data/types";
import { supabaseService } from "@/lib/supabase/server";
import { stripe } from "@/lib/services/stripe";
import { normalizeAccount } from "@/lib/stripe/normalize";

/**
 * PayoutService — Stripe Connect preparation.
 *
 * Sensitive onboarding (identity, bank account) happens entirely on Stripe's
 * hosted pages; Studio ATS only stores the connected account id and the status
 * fields that decide payout eligibility. Payouts themselves stay a deliberate
 * staff action after validation (staff_create_payout) — never automatic.
 */
export class PayoutUnavailableError extends Error {}

async function assertAvailable(s: Session) {
  if (!s.affiliate) throw new PayoutUnavailableError("no affiliate");
  if (s.affiliate.status !== "approved") throw new PayoutUnavailableError("affiliate not approved");
  const settings = await repo().getSettings();
  if (!settings.connectEnabled) throw new PayoutUnavailableError("connect disabled");
  if (!isStripeConfigured) throw new PayoutUnavailableError("stripe not configured");
}

async function connectedAccountId(affiliateId: string): Promise<string | null> {
  const { data } = await supabaseService().from("affiliates").select("stripe_connected_account_id").eq("id", affiliateId).single();
  return data?.stripe_connected_account_id ?? null;
}

/** Returns the Stripe-hosted onboarding URL (creates the connected account once). */
export async function connectOnboardingUrl(s: Session, locale: string): Promise<string> {
  await assertAvailable(s);
  const affiliateId = s.affiliate!.id;
  const st = stripe();
  let accountId = await connectedAccountId(affiliateId);
  if (!accountId) {
    const account = await st.accounts.create({
      type: "express",
      email: s.email || undefined,
      capabilities: { transfers: { requested: true } },
      metadata: { affiliate_id: affiliateId },
    }, { idempotencyKey: `connect-account:${affiliateId}` });
    accountId = account.id;
    // Service role: the affiliate cannot write Connect fields themselves (guard trigger).
    const { error } = await supabaseService().from("affiliates")
      .update({ stripe_connected_account_id: accountId, connect_onboarding_status: "pending", connect_updated_at: new Date().toISOString() })
      .eq("id", affiliateId).is("stripe_connected_account_id", null);
    if (error) throw new Error(`connect account link: ${error.message}`);
    log.info("payouts", "connected account created", { affiliate_id: affiliateId });
  }
  const base = `${env.siteUrl}/${locale}/dashboard/payouts/settings`;
  const link = await st.accountLinks.create({
    account: accountId, type: "account_onboarding", refresh_url: `${base}?refresh=1`, return_url: `${base}?returned=1`,
  });
  return link.url;
}

/** Express dashboard for an onboarded affiliate. */
export async function connectDashboardUrl(s: Session): Promise<string> {
  await assertAvailable(s);
  const accountId = await connectedAccountId(s.affiliate!.id);
  if (!accountId) throw new PayoutUnavailableError("no connected account");
  return (await stripe().accounts.createLoginLink(accountId)).url;
}

/** Pull the latest status (the `account.updated` webhook does the same asynchronously). */
export async function refreshConnectStatus(s: Session): Promise<void> {
  if (!s.affiliate || !isStripeConfigured) return;
  const accountId = await connectedAccountId(s.affiliate.id);
  if (!accountId) return;
  const account = await stripe().accounts.retrieve(accountId);
  await supabaseService().rpc("stripe_connect_account_sync", { p: normalizeAccount(account) });
}
