import { localeMeta, type Locale } from "@/i18n/config";

/**
 * Unknown segments (e.g. /sw.js) reach [locale] metadata before the layout
 * 404s: never let a formatter crash on them.
 */
const intl = (locale: Locale) => localeMeta[locale]?.intl ?? "en-GB";

/** All amounts are integer minor units (cents). Never use floats for money. */
export function formatMoney(cents: number, locale: Locale, currency = "EUR", opts: { compact?: boolean } = {}) {
  return new Intl.NumberFormat(intl(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 || opts.compact ? 0 : 2,
    notation: opts.compact && Math.abs(cents) >= 1_000_000_00 ? "compact" : "standard",
  }).format(cents / 100);
}

export function formatNumber(n: number, locale: Locale) {
  return new Intl.NumberFormat(intl(locale)).format(n);
}

export function formatPercent(ratio: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(intl(locale), {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(ratio);
}

export function formatDate(d: string | Date | null | undefined, locale: Locale, style: "short" | "medium" = "medium") {
  if (!d) return "—";
  return new Intl.DateTimeFormat(intl(locale), { dateStyle: style }).format(new Date(d));
}

export function formatRelative(d: string | Date, locale: Locale, now = Date.now()) {
  const diff = (new Date(d).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intl(locale), { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(d, locale);
}
