import Link from "next/link";
import { ExternalLink, FolderOpen } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { marketContent } from "@/content/markets";
import { salesContext, ofKind } from "@/lib/sales/server";
import { relatedToSector } from "@/lib/sales/sectors";
import { PageHeader, EmptyState, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { FavoriteButton } from "@/components/sales-center/favorite-button";
import { CaseStudyCard } from "@/components/copilot/case-study-card";
import { ProductShowcaseGallery } from "@/components/marketing/product-showcase-gallery";
import { DemoLibrarySection } from "@/components/dashboard/demo-library-section";
import { cn } from "@/lib/cn";

/** "What can I send?" — projects & demos to show (filterable by sector), then the other sales assets. */
export default async function Assets({ params, searchParams }: PageProps<"/[locale]/dashboard/sales-center/assets">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]);
  const C = t.cp.caseStudy;
  const sector = ctx.marketBySlug(typeof sp.target === "string" ? sp.target : null);
  const all = ofKind(ctx.content, "case_study");
  const cases = sector ? relatedToSector(all, sector) : all;
  // Only sectors that actually have projects become filter chips.
  const withProjects = ctx.markets.filter((m) => relatedToSector(all, m).length > 0);
  const assets = ofKind(ctx.content, "asset");
  const href = (slug?: string) => `/${locale}/dashboard/sales-center/assets${slug ? `?target=${slug}` : ""}`;
  const chip = (active: boolean) => cn("inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px]", active ? "bg-fg text-bg" : "bg-surface-2 hover:bg-surface-3");
  return (
    <div className="space-y-6">
      <PageHeader title={t.cp.intents.send.title} subtitle={t.cp.sheet.showHint} />
      <DemoLibrarySection locale={locale} />
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href()} className={chip(!sector)}>{C.filterAll}</Link>
        {withProjects.map((m) => <Link key={m.slug} href={href(m.slug)} className={chip(sector?.slug === m.slug)}>{marketContent(m, locale).name}</Link>)}
      </nav>
      <ProductShowcaseGallery t={t} compact />
      <section>
        <h2 className="mb-3 text-[17px] font-semibold">{C.projectsTitle}</h2>
        {cases.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((x) => <CaseStudyCard key={x.id} t={t} item={x} link={ctx.urlForTarget(sector?.slug ?? x.targetKey)} favorite={ctx.favorites.has(`case_study:${x.key}`)} />)}
          </div>
        ) : <div className="card"><EmptyState title={C.empty} /></div>}
      </section>
      <section>
        <h2 className="mb-3 text-[17px] font-semibold">{C.otherAssets}</h2>
        {assets.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {assets.map((x) => (
              <li key={x.id} id={x.key} className="card p-5">
                <div className="flex items-start gap-3">
                  <FolderOpen className="size-5 text-accent" />
                  <div className="min-w-0 flex-1"><h3 className="font-semibold">{x.title}</h3><Badge className="mt-2">{t.sc.assets.categories[x.body.category]}</Badge></div>
                  <FavoriteButton kind="asset" contentKey={x.key} initial={ctx.favorites.has(`asset:${x.key}`)} />
                </div>
                {x.body.description && <p className="mt-3 text-[14px] text-fg-2">{x.body.description}</p>}
                <a href={x.body.url} target="_blank" rel="noopener" className={buttonClass("secondary", "md", "mt-4")}><ExternalLink className="size-4" />{t.sc.open}</a>
              </li>
            ))}
          </ul>
        ) : <div className="card"><EmptyState title={t.sc.empty} /></div>}
      </section>
    </div>
  );
}
