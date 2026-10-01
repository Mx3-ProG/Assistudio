/**
 * Copilot sector search — pure (unit-tested, no framework imports).
 *
 * The ambassador types the prospect's job ("hôtel", "pizzeria", "coach
 * sportif") and gets the matching sector sheets. Nothing is hardcoded per job:
 * a sector is a `markets` row, and its names + `keywords` (synonyms, any
 * language, admin-editable) are what this matcher reads. Accent-, case- and
 * plural-insensitive.
 */
import { normalize } from "./search.ts";

export interface SectorLike {
  slug: string;
  content: Record<string, { name: string; who?: string; keywords?: string[] } | undefined>;
}

export interface SectorMatch<M> { market: M; score: number }

/** Crude plural folding, good enough for FR/EN job names ("hôtels" → "hotel", "chevaux" stays). */
const stem = (w: string) => (w.length > 3 && /[sx]$/.test(w) ? w.slice(0, -1) : w);
const tokens = (s: string) => normalize(s).split(" ").filter((w) => w.length > 1).map(stem);

export function matchSectors<M extends SectorLike>(query: string, markets: M[], limit = 5): SectorMatch<M>[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const qs = q.split(" ").map(stem).join(" ");
  const qTokens = tokens(query);
  const out: SectorMatch<M>[] = [];

  for (const m of markets) {
    const locales = Object.values(m.content).filter((c): c is NonNullable<typeof c> => !!c);
    const names = [...new Set(locales.map((c) => tokens(c.name).join(" ")).concat(tokens(m.slug.replace(/-/g, " ")).join(" ")))];
    const keywords = [...new Set(locales.flatMap((c) => c.keywords ?? []).map((k) => tokens(k).join(" ")))].filter(Boolean);
    const who = new Set(locales.flatMap((c) => tokens(c.who ?? "")));
    const nameTokens = new Set(names.flatMap((n) => n.split(" ")));
    const keywordTokens = new Set(keywords.flatMap((k) => k.split(" ")));

    let score = 0;
    if (names.includes(qs)) score += 20;
    if (keywords.includes(qs)) score += 15;
    if (qs.length >= 4 && [...names, ...keywords].some((x) => x !== qs && x.includes(qs))) score += 6;
    let hits = 0;
    for (const w of qTokens) {
      const prefix = (set: Set<string>) => w.length >= 3 && [...set].some((x) => x.startsWith(w));
      const s = nameTokens.has(w) ? 6 : keywordTokens.has(w) ? 5 : prefix(nameTokens) || prefix(keywordTokens) ? 3 : who.has(w) ? 1 : 0;
      if (s) hits++;
      score += s;
    }
    // A sector must match a name or a synonym — a word buried in the description is not enough.
    if (score >= 3 && hits > 0) out.push({ market: m, score });
  }
  return out.sort((a, b) => b.score - a.score || a.market.slug.localeCompare(b.market.slug)).slice(0, limit);
}

/**
 * Items relevant to a sector: explicitly linked (`targetKey`) first, then
 * items whose tags hit the sector's slug or synonyms. Generic items are left
 * to the caller (they are shown after, never mixed in).
 */
export function relatedToSector<T extends { targetKey: string | null; tags: string[]; sort: number }>(
  items: T[], sector: SectorLike,
): T[] {
  const words = new Set([sector.slug, ...Object.values(sector.content).flatMap((c) => c?.keywords ?? [])].map((k) => tokens(k).join(" ")));
  const linked = items.filter((x) => x.targetKey === sector.slug);
  const tagged = items.filter((x) => x.targetKey !== sector.slug && x.tags.some((t) => words.has(tokens(t).join(" "))));
  return [...linked.sort((a, b) => a.sort - b.sort), ...tagged.sort((a, b) => a.sort - b.sort)];
}
