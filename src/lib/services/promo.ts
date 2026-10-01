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
