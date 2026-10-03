import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { marketContent } from "@/content/markets";
import { formatMoney } from "@/lib/money";
import { salesContext, ofKind, salesPageUrl } from "@/lib/sales/server";
import { SalesOnboarding } from "@/components/sales-center/sales-onboarding";
import { getDictionary } from "@/i18n";
import { isStaff } from "@/lib/auth";

/**
 * First run, shown as a five-item start-up checklist ("Goal: your first recommendation"):
 * understand → sector (+ what to say) → link & code → message → prospect.
 */
export default async function Welcome({ params, searchParams }: PageProps<"/[locale]/dashboard/welcome">) {
  const { locale } = (await params) as { locale: Locale };
  const { next: nextParam } = await searchParams;
  // Only in-app destinations (set by sign-up from a home CTA).
  const next = typeof nextParam === "string" && nextParam.startsWith(`/${locale}/dashboard`) ? nextParam : undefined;
  const s = await requireAffiliate(locale);
  const [ctx, offer, t] = await Promise.all([salesContext(s, locale), repo().getOffer(), getDictionary(locale)]);
  const knowledge = ofKind(ctx.content, "knowledge");
  const pitch = ofKind(ctx.content, "pitch")[0];
  const productLine = pitch?.body.oneLiner ?? knowledge.find((x) => x.body.section === "what_it_is")?.body.items[0]?.body ?? offer.productName;
  const template = ofKind(ctx.content, "page_template")[0];
  const pageBase = `${env.siteUrl}/a/${s.affiliate.slug ?? s.affiliate.code}`;
  const existingPages = Object.fromEntries(ctx.pages.filter((p) => p.pathKey).map((p) => [ctx.markets.find((m) => m.id === p.marketId)?.slug ?? "", salesPageUrl(s.affiliate, p.pathKey)]));
  return <div className="py-4 sm:py-10"><SalesOnboarding productLine={productLine} pitch={pitch?.body.short ?? null} link={ctx.defaultLink} code={s.affiliate.code} offerLine={`${formatMoney(offer.priceCents, locale, offer.currency)} ${t.sc.product.perInterval.year}`}
    targets={ctx.markets.map((m) => ({ id: m.id, slug: m.slug, icon: m.icon, relevance: m.relevance ?? 3, c: marketContent(m, locale) }))}
    messages={ofKind(ctx.content, "message")} templateKey={template?.key ?? null} pageBase={pageBase} existingPages={existingPages}
    startStep={s.affiliate.onboardingCompletedAt ? 0 : s.affiliate.onboardingStep} pending={s.affiliate.status !== "approved" && !isStaff(s) && s.role === "affiliate"} advisorName={ctx.advisorName} next={next}/></div>;
}
