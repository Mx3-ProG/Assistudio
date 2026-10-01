import "server-only";
import { supabaseService } from "@/lib/supabase/server";

export const PROMO_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,23}$/;

export interface ResolvedPromo {
  id: string;
  code: string;
  affiliateId: string;
  discountRate: number;
}

export function normalizePromoCode(value: unknown): string | null {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return PROMO_CODE_PATTERN.test(code) ? code : null;
}

/** A code is valid only inside the affiliate attribution that owns it. */
export async function resolvePromoCode(code: string | null, affiliateId: string | null): Promise<ResolvedPromo | null> {
  if (!code || !affiliateId) return null;
  const { data, error } = await supabaseService().from("affiliate_promo_codes")
    .select("id, code, affiliate_id, discount_rate, affiliates!inner(status, deleted_at)")
    .eq("code", code).eq("affiliate_id", affiliateId).eq("is_active", true)
    .eq("affiliates.status", "approved").is("affiliates.deleted_at", null).maybeSingle();
  if (error || !data) return null;
  const rate = Number(data.discount_rate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.2) return null;
  return { id: data.id, code: String(data.code), affiliateId: data.affiliate_id, discountRate: rate };
}

export function discountCents(catalogAmountCents: number, rate: number) {
  return Math.max(0, Math.min(catalogAmountCents, Math.round(catalogAmountCents * rate)));
}

export interface AmbassadorCode {
  affiliateId: string;
  /** Default tracked link of the ambassador (link statistics), when it exists. */
  linkId: string | null;
  displayName: string | null;
  /** Set when the code is one of the ambassador's promo codes (discount applies). */
  promo: ResolvedPromo | null;
}

/**
 * Who owns a code typed at checkout: an active promo code first, then the
 * ambassador's own code / slug. Only approved, non-deleted ambassadors.
 * Whether it may attribute is decided by withAmbassadorCode().
 */
export async function resolveAmbassadorCode(code: string | null): Promise<AmbassadorCode | null> {
  if (!code) return null;
  const sb = supabaseService();
  const { data: p } = await sb.from("affiliate_promo_codes")
    .select("id, code, affiliate_id, discount_rate, affiliates!inner(status, deleted_at)")
    .eq("code", code).eq("is_active", true).eq("affiliates.status", "approved").is("affiliates.deleted_at", null).maybeSingle();
  let affiliateId: string | null = p?.affiliate_id ?? null;
  let promo: ResolvedPromo | null = null;
  if (p) {
    const rate = Number(p.discount_rate);
    promo = Number.isFinite(rate) && rate >= 0 && rate <= 0.2 ? { id: p.id, code: String(p.code), affiliateId: p.affiliate_id, discountRate: rate } : null;
  } else {
    const { data: a } = await sb.from("affiliates").select("id")
      .or(`code.eq.${code.toUpperCase()},slug.eq.${code.toLowerCase()}`)
      .eq("status", "approved").is("deleted_at", null).maybeSingle();
    affiliateId = a?.id ?? null;
  }
  if (!affiliateId) return null;
  const [{ data: link }, { data: aff }] = await Promise.all([
    sb.from("affiliate_links").select("id").eq("affiliate_id", affiliateId).eq("is_default", true).maybeSingle(),
    sb.from("affiliates").select("profiles(display_name, full_name)").eq("id", affiliateId).maybeSingle(),
  ]);
  const prof = (aff as { profiles?: { display_name: string | null; full_name: string | null } | null } | null)?.profiles;
  return {
    affiliateId, linkId: link?.id ?? null, promo,
    displayName: prof?.display_name || (prof?.full_name ?? "").split(" ")[0] || null,
  };
}
