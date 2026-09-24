import "server-only";
import { cache } from "react";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import type { Session, PrivatePage, Market } from "@/lib/data/types";
import { marketContent } from "@/content/markets";
import type { Locale } from "@/i18n/config";
import { pickLocale, contentText, isKind, type SalesContent, type ContentKind } from "./content";
import type { SearchDoc } from "./search";

type AffiliateSession = Session & { affiliate: NonNullable<Session["affiliate"]> };

export const GENERAL_PATH = "general";

/** Public URL of an affiliate sales page. The proxy adds the visitor's locale; the page renders in its own. */
export function salesPageUrl(affiliate: { slug: string | null; code: string }, pathKey: string | null) {
  return `${env.siteUrl}/a/${affiliate.slug ?? affiliate.code}${pathKey && pathKey !== GENERAL_PATH ? `/${pathKey}` : ""}`;
}

/**
 * Everything a Sales Center page needs, deduplicated per request. Content is
 * resolved to the viewer's locale with an explicit English fallback flag.
 */
export const salesContext = cache(async (s: AffiliateSession, locale: Locale) => {
  const r = repo();
  const [raw, markets, favorites, allPages, products] = await Promise.all([
    r.listSalesContent(s), r.listMarkets(), r.listFavorites(s), r.listPrivatePages(s), r.listProducts(),
  ]);
  const content = pickLocale(raw, locale).sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
  const pages = allPages.filter((p) => !p.archivedAt && p.pathKey);
  const marketById = new Map(markets.map((m) => [m.id, m]));
  const pageForTarget = (slug: string | null): PrivatePage | null =>
    pages.find((p) => (slug ? marketById.get(p.marketId ?? "")?.slug === slug : p.pathKey === GENERAL_PATH)) ?? null;
  const defaultLink = `${env.siteUrl}/s/${s.affiliate.slug ?? s.affiliate.code}`;
  return {
    content,
    markets: [...markets].sort((a, b) => (b.relevance ?? 3) - (a.relevance ?? 3) || a.sort - b.sort),
    favorites: new Set(favorites.map((f) => `${f.kind}:${f.key}`)),
    pages,
    products,
    defaultLink,
    advisorName: (s.displayName || s.fullName).split(" ")[0],
    pageForTarget,
    /** Best link to send for a target: its sales page, else the personal link. */
    urlForTarget: (slug: string | null) => {
      const p = pageForTarget(slug) ?? pageForTarget(null);
      return p ? salesPageUrl(s.affiliate, p.pathKey) : defaultLink;
    },
    marketBySlug: (slug: string | null | undefined): Market | null => markets.find((m) => m.slug === slug) ?? null,
  };
});

export function ofKind<K extends ContentKind>(content: SalesContent[], kind: K): (SalesContent<K> & { fallback?: boolean })[] {
  return content.filter((c): c is SalesContent<K> => isKind(c, kind));
}

const SECTION_OF: Partial<Record<ContentKind, string>> = {
  playbook: "playbooks", call_script: "calls", message: "messages", email_template: "emails",
  objection: "objections", knowledge: "product", asset: "assets", journey: "first-week",
};

/** Compact search index shipped to the browser (instant, offline-tolerant). */
export function searchDocs(content: SalesContent[], markets: Market[], locale: Locale): SearchDoc[] {
  const base = `/${locale}/dashboard/sales-center`;
  const docs: SearchDoc[] = [];
  for (const c of content) {
    const section = SECTION_OF[c.kind];
    if (!section) continue;
    const href = c.kind === "playbook" ? `${base}/playbooks/${c.key}` : c.kind === "call_script" ? `${base}/calls/${c.key}`
      : `${base}/${section}#${c.key}`;
    docs.push({ id: c.id, kind: c.kind, key: c.key, title: c.title, tags: c.tags, text: contentText(c).slice(0, 4000), href });
  }
  for (const m of markets) {
    const mc = marketContent(m, locale);
    docs.push({
      id: m.id, kind: "target", key: m.slug, title: mc.name, tags: [m.slug],
      text: [mc.who, mc.problem, mc.angle, ...(mc.pains ?? []), ...(mc.outcomes ?? [])].join(" \n "), href: `${base}/targets/${m.slug}`,
    });
  }
  return docs;
}
