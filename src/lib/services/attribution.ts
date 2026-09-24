import "server-only";
import { supabaseService } from "@/lib/supabase/server";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { log } from "@/lib/log";

/**
 * AttributionService — who gets credit for a conversion (checkout, lead).
 *
 * Never trusts the browser: the visitor cookie only carries an opaque session
 * key; the touches behind it were recorded server-side by /s/{code}. The model
 * (first click / last click / manual) and the window come from settings and
 * are applied in SQL (public.resolve_attribution). An explicit context — a
 * private sales page — wins, but only for an approved affiliate.
 */
export type AttributionSource = "private_page" | "first_click" | "last_click" | "manual" | "none";

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
