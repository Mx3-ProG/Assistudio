import "server-only";
import { supabaseService } from "@/lib/supabase/server";
import { repo } from "@/lib/data";
import { isValidCode, withAmbassadorCode } from "@/lib/attribution";
import { resolveAmbassadorCode, type ResolvedPromo } from "@/lib/services/promo";
import { log } from "@/lib/log";

/**
 * AttributionService — who gets credit for a conversion (checkout, lead).
 *
 * Never trusts the browser: the visitor cookie only carries an opaque session
 * key; the touches behind it were recorded server-side by /s/{code}. The model
 * (first click / last click / manual) and the window come from settings and
 * are applied in SQL (public.resolve_attribution). An explicit context — a
 * private sales page — wins, but only for an approved affiliate. A code typed
 * by the customer (`manual`) only attributes when nothing else does.
 */
export type AttributionSource = "private_page" | "affiliate_link" | "first_click" | "last_click" | "manual" | "none";

export interface ResolvedAttribution {
  affiliateId: string | null;
  referralSessionId: string | null;
  linkId: string | null;
  campaignId: string | null;
  privatePageId: string | null;
  source: AttributionSource;
}

const NONE: ResolvedAttribution = {
  affiliateId: null, referralSessionId: null, linkId: null, campaignId: null, privatePageId: null, source: "none",
};

async function affiliateDisplayName(affiliateId: string | null) {
  if (!affiliateId) return null;
  const { data, error } = await supabaseService().from("affiliates")
    .select("profile:profiles!affiliates_profile_id_fkey(display_name, full_name)")
    .eq("id", affiliateId).maybeSingle();
  if (error) {
    log.warn("attribution", "affiliate display name unavailable", { affiliateId, error: error.message });
    return null;
  }
  const profile = (data as { profile?: { display_name: string | null; full_name: string | null } | null } | null)?.profile;
  return profile?.display_name || (profile?.full_name ?? "").split(" ")[0] || null;
}

export async function resolveForConversion(input: { sessionKey: string | null; privatePageSlug?: string | null }): Promise<ResolvedAttribution> {
  const sb = supabaseService();

  if (input.privatePageSlug && isValidCode(input.privatePageSlug)) {
    const page = await repo().getPrivatePage(input.privatePageSlug);
    if (page?.referral.active) {
      return {
        affiliateId: page.referral.affiliateId, referralSessionId: null, linkId: page.referral.linkId,
        campaignId: page.campaignId ?? page.referral.campaignId, privatePageId: page.id, source: "private_page",
      };
    }
  }

  if (!input.sessionKey || !/^[0-9a-f-]{36}$/.test(input.sessionKey)) return NONE;

  const [{ data, error }, settings] = await Promise.all([
    sb.rpc("resolve_attribution", { p_session_key: input.sessionKey }),
    repo().getSettings(),
  ]);
  if (error) {
    log.error("attribution", "resolution failed", { error: error.message });
    return NONE;
  }
  const row = data as { id: string | null; affiliate_id: string | null; link_id: string | null; campaign_id: string | null } | null;
  if (!row?.id || !row.affiliate_id) return NONE;
  return {
    affiliateId: row.affiliate_id, referralSessionId: row.id, linkId: row.link_id, campaignId: row.campaign_id,
    privatePageId: null, source: settings.attributionModel,
  };
}

export type CodeStatus = "none" | "applied" | "attributed" | "ignored" | "invalid";

/**
 * Attribution for a purchase, including a code the customer typed (promo
 * code or ambassador code). The tracked click / private page wins; the code
 * only fills an empty attribution (withAmbassadorCode). A promo discount is
 * granted only when its owner is the attributed ambassador.
 *   applied    — promo code of the attributed ambassador (discount)
 *   attributed — ambassador code recognised, no discount
 *   ignored    — valid ambassador code, but another ambassador brought the customer
 *   invalid    — unknown code, or a promo code of another ambassador
 */
export async function resolveCheckoutAttribution(input: { sessionKey: string | null; privatePageSlug?: string | null; referralCode?: string | null; code: string | null }):
  Promise<{ attribution: ResolvedAttribution; promo: ResolvedPromo | null; code: CodeStatus; advisor: string | null }> {
  const [resolved, owner, fallback] = await Promise.all([
    resolveForConversion({ sessionKey: input.sessionKey, privatePageSlug: input.privatePageSlug }),
    resolveAmbassadorCode(input.code),
    input.referralCode && isValidCode(input.referralCode) ? repo().resolveReferral(input.referralCode) : Promise.resolve(null),
  ]);
  const tracked = !resolved.affiliateId && fallback?.active ? {
    affiliateId: fallback.affiliateId,
    referralSessionId: null,
    linkId: fallback.linkId,
    campaignId: fallback.campaignId,
    privatePageId: null,
    source: "affiliate_link" as const,
  } : resolved;
  const trackedAdvisor = await affiliateDisplayName(tracked.affiliateId);
  if (!input.code) return { attribution: tracked, promo: null, code: "none", advisor: trackedAdvisor };
  if (!owner) return { attribution: tracked, promo: null, code: "invalid", advisor: trackedAdvisor };
  const d = withAmbassadorCode(tracked.affiliateId, owner.affiliateId);
  if (d.conflict) return { attribution: tracked, promo: null, code: owner.promo ? "invalid" : "ignored", advisor: trackedAdvisor };
  const attribution: ResolvedAttribution = d.byCode
    ? { affiliateId: owner.affiliateId, referralSessionId: null, linkId: owner.linkId, campaignId: null, privatePageId: null, source: "manual" }
    : tracked;
  return { attribution, promo: owner.promo, code: owner.promo ? "applied" : "attributed", advisor: owner.displayName ?? trackedAdvisor };
}
