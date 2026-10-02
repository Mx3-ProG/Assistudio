import type { Locale } from "@/i18n/config";

/** Same-origin destination for a tracked referral link. */
export function referralDestination(
  locale: Locale,
  target: { affiliateCode: string; active: boolean } | null,
  requested: string | null,
): string {
  const safe = requested?.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\")
    ? requested
    : null;
  if (safe) return safe;
  return target?.active ? `/${locale}/a/${target.affiliateCode}` : `/${locale}/studio`;
}
