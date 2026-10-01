/**
 * Market and target cards in the other languages, keyed by slug. Same rules as
 * the English source: no invented figures, no promise of results. Search
 * suggestions are adapted to how people search in each language.
 */
import type { Locale } from "../../i18n/config.ts";
import type { MarketContent } from "../markets.ts";
import de from "./markets.de.ts";
import es from "./markets.es.ts";
import pt from "./markets.pt.ts";
import it from "./markets.it.ts";
import nl from "./markets.nl.ts";
import ar from "./markets.ar.ts";

export type MarketTranslations = Record<string, MarketContent>;

const byLocale: Partial<Record<Locale, MarketTranslations>> = { de, es, pt, it, nl, ar };

export function marketTranslations(slug: string): Partial<Record<Locale, MarketContent>> {
  return Object.fromEntries(Object.entries(byLocale).flatMap(([locale, all]) => (all?.[slug] ? [[locale, all[slug]]] : [])));
}
