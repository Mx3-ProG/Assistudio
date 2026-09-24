/**
 * Referral attribution — pure logic, shared by the proxy (capture), the
 * /s/[code] redirect, private pages and lead/sale conversion.
 *
 * The cookie stores BOTH the first and the last touch; which one wins, and
 * for how long, is decided at conversion time from admin settings
 * (`attribution.model`, `attribution.window_days`). Nothing is hardcoded here.
 */

export const REF_COOKIE = "studio_ref";
export const VISITOR_COOKIE = "studio_vid";
/** Technical lifetime of the cookie. The business window is enforced server-side. */
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export type AttributionModel = "first_click" | "last_click";

export interface Touch {
  /** Affiliate referral code (?ref=) */
  ref: string;
  /** Tracking link code, when the click came through a campaign link */
  link?: string;
  /** Private sales page slug */
  page?: string;
  at: string;
  utm?: Partial<Record<"source" | "medium" | "campaign" | "content" | "term", string>>;
}

export interface RefCookie {
  v: 1;
  first: Touch;
  last: Touch;
}

const CODE_RE = /^[A-Za-z0-9-]{3,40}$/;

export function isValidCode(code: string | null | undefined): code is string {
  return !!code && CODE_RE.test(code);
}

export function encodeRefCookie(c: RefCookie): string {
  return encodeURIComponent(JSON.stringify(c));
}

export function decodeRefCookie(raw: string | undefined | null): RefCookie | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as RefCookie;
    if (c?.v !== 1 || !isValidCode(c.first?.ref) || !isValidCode(c.last?.ref)) return null;
    return c;
  } catch {
    return null;
  }
}

export function recordTouch(existing: RefCookie | null, touch: Touch): RefCookie {
  if (!existing) return { v: 1, first: touch, last: touch };
  return { v: 1, first: existing.first, last: touch };
}

export function utmFromSearchParams(sp: URLSearchParams): Touch["utm"] {
  const utm: NonNullable<Touch["utm"]> = {};
  for (const k of ["source", "medium", "campaign", "content", "term"] as const) {
    const v = sp.get(`utm_${k}`);
    if (v) utm[k] = v.slice(0, 120);
  }
  return Object.keys(utm).length ? utm : undefined;
}

/**
 * Returns the touch that gets credit for a conversion happening at `now`,
 * or null when the winning touch is outside the attribution window.
 */
export function resolveAttribution(
  cookie: RefCookie | null,
  model: AttributionModel,
  windowDays: number,
  now: Date = new Date(),
): Touch | null {
  if (!cookie) return null;
  const touch = model === "first_click" ? cookie.first : cookie.last;
  const age = now.getTime() - new Date(touch.at).getTime();
  if (Number.isNaN(age) || age < 0 || age > windowDays * 86_400_000) return null;
  return touch;
}

/** Very light bot heuristic. Probabilistic signal only — never blocks a user. */
export function looksLikeBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|curl|wget|python-requests/i.test(userAgent);
}

export function deviceType(userAgent: string | null): "mobile" | "tablet" | "desktop" | "bot" | "unknown" {
  if (!userAgent) return "unknown";
  if (looksLikeBot(userAgent)) return "bot";
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}
