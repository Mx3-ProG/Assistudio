import "server-only";
import { cache } from "react";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import type { Session, PrivatePage, Market } from "@/lib/data/types";
import { marketContent } from "@/content/markets";
import type { Locale } from "@/i18n/config";
import { pickLocale, contentText, isKind, type SalesContent, type ContentKind } from "./content";
import type { SearchDoc } from "./search";
import { followUpBoard } from "./follow-up";
import { recommend, guideFor } from "./guide";
import { personalize } from "./personalize";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { FollowUpItem } from "@/components/copilot/follow-up-list";

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
  case_study: "assets", pitch: "pitch", diagnostic: "pitch", sequence: "follow-ups",
  signal: "signals",
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

/**
 * Today's follow-ups computed on the CRM prospects + the published sequences,
 * with the message already personalised (prospect first name, company, the
 * best link for the prospect's sector). Shared by the hub badge and the page.
 */
export async function followUps(s: AffiliateSession, locale: Locale, t: Dictionary) {
  const [ctx, prospects] = await Promise.all([salesContext(s, locale), repo().listProspects(s)]);
  const sequences = ofKind(ctx.content, "sequence").map((x) => ({ key: x.key, stage: x.stage, steps: x.body.steps }));
  const markets = new Map(ctx.markets.map((m) => [m.id, m]));
  const board = followUpBoard(prospects, sequences, Date.now());
  const item = (r: (typeof board)[number]): FollowUpItem => {
    const p = r.prospect;
    const market = p.marketId ? markets.get(p.marketId) : undefined;
    const vars = {
      firstName: p.name.split(" ")[0], company: p.company, advisorName: ctx.advisorName,
      affiliateUrl: ctx.urlForTarget(market?.slug ?? null), sector: market ? marketContent(market, locale).name : null,
    };
    return {
      id: p.id, name: p.name, company: p.company, email: p.email, phone: p.phone,
      stageLabel: t.dash.prospects.stages[p.stage], daysSince: r.status.daysSince, sequenceKey: r.sequenceKey,
      step: r.step ? { ...r.step, text: personalize(r.step.text, vars, t.sc.messages.vars).text } : null,
      plannedAt: r.status.planned ? p.nextActionAt : r.status.next?.at ?? null,
      plannedLabel: r.status.planned ? p.nextAction : r.next ? `J+${r.next.day} · ${r.next.goal}` : null,
    };
  };
  return {
    due: board.filter((r) => r.status.due !== null).map(item),
    upcoming: board.filter((r) => r.status.due === null).map(item),
  };
}

/** Slim sector list for the browser-side matcher: names + synonyms only, every locale. */
export function sectorOptions(markets: Market[], locale: Locale) {
  return markets.map((m) => ({
    slug: m.slug, icon: m.icon, name: marketContent(m, locale).name,
    content: Object.fromEntries(Object.entries(m.content).map(([l, c]) => [l, c && { name: c.name, keywords: c.keywords }])),
  }));
}

/**
 * V0.5 guided pipeline: the next best action of every open prospect, most
 * urgent first (follow-up due → act now → wait). Shared by the home and the
 * prospects board.
 */
export async function nextActions(s: AffiliateSession, locale: Locale) {
  const [ctx, prospects] = await Promise.all([salesContext(s, locale), repo().listProspects(s)]);
  const guides = ofKind(ctx.content, "stage_guide");
  const sequences = ofKind(ctx.content, "sequence").map((x) => ({ key: x.key, stage: x.stage, steps: x.body.steps }));
  const slugOf = new Map(ctx.markets.map((m) => [m.id, m.slug]));
  const now = Date.now();
  const order = { follow_up: 0, act: 1, wait: 2 } as const;
  return prospects
    .filter((p) => p.stage !== "won" && p.stage !== "lost")
    .map((p) => {
      const sector = p.marketId ? slugOf.get(p.marketId) ?? null : null;
      const rec = recommend(p, sequences, now);
      const guide = guideFor(guides, p.stage, sector);
      const planned = p.nextActionAt && Date.parse(p.nextActionAt) > now ? p.nextActionAt : null;
      return { prospect: p, rec, guide, planned, label: rec.mode === "follow_up" && rec.step ? `J+${rec.step.day} · ${rec.step.goal}` : guide?.body.action ?? null };
    })
    .sort((a, b) => order[a.rec.mode] - order[b.rec.mode] || Date.parse(a.rec.waitUntil ?? a.prospect.createdAt) - Date.parse(b.rec.waitUntil ?? b.prospect.createdAt));
}
