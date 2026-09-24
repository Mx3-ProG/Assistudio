/**
 * Affiliate sales page composition — pure (unit-tested).
 *
 * A page is ASSEMBLED, never authored by the affiliate:
 *   brand-controlled   template (structure + copy), target variant, sales angle,
 *                      product knowledge ("what's included"), objections (FAQ),
 *                      offer & price (read from the catalog at render time)
 *   affiliate choices  target, angle among published ones, CTA among the
 *                      template's allowed modes, optional advisor block
 * No testimonial or statistic is ever generated: sections only render content
 * that exists in the database.
 */
import type {
  CtaMode, PageSection, PageTemplateBody, PageVariantBody, SalesAngleBody,
} from "./content.ts";

export interface TargetCopy {
  name: string;
  who?: string;
  problem?: string;
  pains?: string[];
  outcomes?: string[];
}

export interface OfferView {
  productName: string;
  priceCents: number;
  currency: string;
  interval: "month" | "year" | "one_time";
}

export interface Advisor {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
}

export type LandingSection =
  | { type: "problem"; title: string; body: string; points: string[] }
  | { type: "solution"; title: string; body: string }
  | { type: "value"; title: string; items: string[] }
  | { type: "how"; title: string; steps: { title: string; body: string }[] }
  | { type: "benefits"; title: string; items: { title: string; body: string }[] }
  | { type: "included"; title: string; items: string[] }
  | { type: "who"; title: string; body: string; audience: string | null }
  | { type: "faq"; title: string; items: { q: string; a: string }[] }
  | { type: "offer"; title: string; note: string; offer: OfferView | null }
  | { type: "cta"; title: string; body: string };

export interface LandingModel {
  hero: { eyebrow: string | null; title: string; subtitle: string };
  sections: LandingSection[];
  cta: CtaMode;
  advisor: Advisor | null;
}

export interface LandingInput {
  template: PageTemplateBody;
  variant?: PageVariantBody | null;
  angle?: SalesAngleBody | null;
  target?: TargetCopy | null;
  offer: OfferView | null;
  /** Published "what's included" items; falls back to the template's value items. */
  included: string[];
  faq: { q: string; a: string }[];
  requestedCta: CtaMode;
  /** Buying online needs an active offer AND checkout enabled. */
  canBuy: boolean;
  advisor?: Advisor | null;
}

export function resolveCta(requested: CtaMode, allowed: CtaMode[], fallback: CtaMode, canBuy: boolean): CtaMode {
  const ok = (m: CtaMode) => allowed.includes(m) && (m !== "buy" || canBuy);
  if (ok(requested)) return requested;
  if (ok(fallback)) return fallback;
  return allowed.find(ok) ?? "lead";
}

/** Only the professional fields the affiliate is allowed to show, trimmed. */
export function cleanAdvisor(raw: unknown): Advisor | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const s = (k: string, max: number) => (typeof r[k] === "string" && (r[k] as string).trim() ? (r[k] as string).trim().slice(0, max) : undefined);
  const name = s("name", 80);
  if (!name) return null;
  const email = s("email", 200);
  const photo = s("photoUrl", 500);
  return {
    name,
    title: s("title", 80),
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
    phone: s("phone", 40)?.replace(/[^\d+ ().-]/g, ""),
    photoUrl: photo && photo.startsWith("https://") ? photo : undefined,
  };
}

export function composeLanding(i: LandingInput): LandingModel {
  const t = i.template;
  const v = i.variant ?? null;
  const target = i.target ?? null;

  const hero = {
    eyebrow: target?.name ?? null,
    title: i.angle?.heroTitle || v?.heroTitle || t.heroTitle,
    subtitle: i.angle?.heroSubtitle || v?.heroSubtitle || t.heroSubtitle,
  };

  const build: Record<Exclude<PageSection, "hero">, () => LandingSection | null> = {
    problem: () => ({
      type: "problem",
      title: v?.problemTitle || t.problemTitle,
      body: v?.problemBody || target?.problem || t.problemBody,
      points: target?.pains ?? [],
    }),
    solution: () => ({ type: "solution", title: t.solutionTitle, body: t.solutionBody }),
    value: () => ({ type: "value", title: t.valueTitle, items: target?.outcomes?.length ? target.outcomes : t.valueItems }),
    how: () => (t.howSteps.length ? { type: "how", title: t.howTitle, steps: t.howSteps } : null),
    benefits: () => {
      const items = v?.benefits?.length ? v.benefits : t.benefits;
      return items.length ? { type: "benefits", title: t.benefitsTitle, items } : null;
    },
    included: () => {
      const items = i.included.length ? i.included : t.valueItems;
      return items.length ? { type: "included", title: t.includedTitle, items } : null;
    },
    who: () => ({ type: "who", title: t.whoTitle, body: t.whoBody, audience: target?.who ?? null }),
    faq: () => (i.faq.length ? { type: "faq", title: t.faqTitle, items: i.faq } : null),
    offer: () => ({ type: "offer", title: t.offerTitle, note: t.offerNote, offer: i.offer }),
    cta: () => ({ type: "cta", title: v?.ctaTitle || t.ctaTitle, body: v?.ctaBody || t.ctaBody }),
  };

  const sections = t.sections
    .filter((s): s is Exclude<PageSection, "hero"> => s !== "hero")
    .map((s) => build[s]())
    .filter((s): s is LandingSection => s !== null);

  return {
    hero,
    sections,
    cta: resolveCta(i.requestedCta, t.ctaModes, t.defaultCta, i.canBuy && i.offer !== null),
    advisor: i.advisor ?? null,
  };
}
