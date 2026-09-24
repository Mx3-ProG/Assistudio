import "server-only";
import en from "./dictionaries/en";
import type { Dictionary, PartialDictionary } from "./types";
import { isLocale, defaultLocale, type Locale } from "./config";

const loaders: Record<Locale, () => Promise<{ default: Dictionary | PartialDictionary }>> = {
  en: async () => ({ default: en }),
  fr: () => import("./dictionaries/fr"),
  de: () => import("./dictionaries/de"),
  es: () => import("./dictionaries/es"),
  pt: () => import("./dictionaries/pt"),
  it: () => import("./dictionaries/it"),
  nl: () => import("./dictionaries/nl"),
  ar: () => import("./dictionaries/ar"),
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Key-by-key fallback to English. Arrays are replaced wholesale. */
function merge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) return (override ?? base) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? merge(out[k], v) : v;
  }
  return out as T;
}

const cache = new Map<Locale, Dictionary>();

export async function getDictionary(requested: Locale): Promise<Dictionary> {
  // Unknown segments (e.g. /sw.js) reach [locale] metadata before the layout 404s.
  const locale = isLocale(requested) ? requested : defaultLocale;
  const hit = cache.get(locale);
  if (hit) return hit;
  const { default: dict } = await loaders[locale]();
  const merged = locale === "en" ? en : merge(en, dict);
  cache.set(locale, merged);
  return merged;
}
