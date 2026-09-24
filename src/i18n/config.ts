/**
 * Locale registry. Adding a language = add an entry here + a dictionary file.
 * No business component needs to change.
 */
export const locales = ["en", "fr", "de", "es", "pt", "it", "nl", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; dir: "ltr" | "rtl"; intl: string }> = {
  en: { label: "English", dir: "ltr", intl: "en-GB" },
  fr: { label: "Français", dir: "ltr", intl: "fr-FR" },
  de: { label: "Deutsch", dir: "ltr", intl: "de-DE" },
  es: { label: "Español", dir: "ltr", intl: "es-ES" },
  pt: { label: "Português", dir: "ltr", intl: "pt-PT" },
  it: { label: "Italiano", dir: "ltr", intl: "it-IT" },
  nl: { label: "Nederlands", dir: "ltr", intl: "nl-NL" },
  ar: { label: "العربية", dir: "rtl", intl: "ar" },
};

/** Regional variants (ar-EG, pt-BR…) resolve to their base dictionary for now. */
export function resolveLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  const base = input.toLowerCase().split(/[-_]/)[0];
  return (locales as readonly string[]).includes(base) ? (base as Locale) : null;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const LOCALE_COOKIE = "NEXT_LOCALE";
