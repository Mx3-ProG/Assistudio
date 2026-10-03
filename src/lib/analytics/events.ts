/**
 * Activation funnel events — pure, framework-free, unit-tested.
 * Mirrors the `funnel_events.event` check in
 * supabase/migrations/20261010000001_funnel_events.sql: keep them in sync.
 *
 * Privacy: public events carry no visitor identifier (aggregate counts only,
 * no cookie, no consent needed). Ambassador events carry the affiliate id.
 */
export const FUNNEL_EVENTS = [
  "home_view", "hero_signup_click", "see_product_click", "studio_demo_click",
  "commission_simulator_interaction", "sales_center_click", "first_prospect_cta", "cta_click",
  "signup_started", "signup_completed", "onboarding_started", "onboarding_completed",
  "affiliate_link_copied", "sales_script_copied", "prospect_added", "prospect_submitted",
] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

/** Events a browser may send to /api/events. The others are recorded server-side only, where they happen. */
export const CLIENT_EVENTS = [
  "home_view", "hero_signup_click", "see_product_click", "studio_demo_click",
  "commission_simulator_interaction", "sales_center_click", "first_prospect_cta", "cta_click",
  "affiliate_link_copied", "sales_script_copied",
] as const satisfies readonly FunnelEvent[];
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

/** Client events that only make sense for a signed-in ambassador (dropped when anonymous). */
export const AMBASSADOR_CLIENT_EVENTS: readonly ClientEvent[] = ["affiliate_link_copied", "sales_script_copied"];

export function isClientEvent(x: unknown): x is ClientEvent {
  return typeof x === "string" && (CLIENT_EVENTS as readonly string[]).includes(x);
}

const PLACEMENT = /^[a-z0-9_]{1,40}$/;
const META_KEY = /^[a-z_]{1,24}$/;

export interface FunnelPayload {
  event: ClientEvent;
  placement: string | null;
  locale: string | null;
  meta: Record<string, string | number | boolean>;
}

/**
 * Validates an untrusted beacon body. Unknown events are rejected; free text
 * is never stored (placement is a slug, meta keeps ≤ 6 short scalar values).
 */
export function parseFunnelPayload(body: unknown): FunnelPayload | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (!isClientEvent(b.event)) return null;
  const placement = typeof b.placement === "string" && PLACEMENT.test(b.placement) ? b.placement : null;
  const locale = typeof b.locale === "string" && /^[a-z]{2}$/.test(b.locale) ? b.locale : null;
  const meta: Record<string, string | number | boolean> = {};
  if (typeof b.meta === "object" && b.meta !== null && !Array.isArray(b.meta)) {
    for (const [k, v] of Object.entries(b.meta).slice(0, 6)) {
      if (!META_KEY.test(k)) continue;
      if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) meta[k] = v;
      else if (typeof v === "string" && /^[\w.-]{1,40}$/.test(v)) meta[k] = v;
    }
  }
  return { event: b.event, placement, locale, meta };
}
