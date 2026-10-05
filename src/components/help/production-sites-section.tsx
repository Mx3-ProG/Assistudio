import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { Session } from "@/lib/data/types";
import { salesContext, ofKind } from "@/lib/sales/server";
import { CaseStudyCard } from "@/components/copilot/case-study-card";
import { EmptyState } from "@/components/ui/primitives";

const LIMIT = 6;

/** "Sites in production" in Documents: published projects with a live URL, and the way to the full assets page. */
export async function ProductionSitesSection({ t, locale, session }: { t: Dictionary; locale: Locale; session: Session }) {
  if (!session.affiliate) return null;
  const ctx = await salesContext(session as Session & { affiliate: NonNullable<Session["affiliate"]> }, locale);
  const live = ofKind(ctx.content, "case_study").filter((x) => x.body.url);
  const L = t.hp.library;
  return (
    <section aria-labelledby="production-sites-title" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"><Globe className="size-4" />{L.sitesEyebrow}</p>
          <h2 id="production-sites-title" className="mt-1 text-[19px] font-semibold tracking-tight">{L.sitesTitle}</h2>
          <p className="mt-1 text-sm text-muted">{L.sitesSubtitle}</p>
        </div>
        <Link href={`/${locale}/dashboard/sales-center/assets`} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent hover:underline">{L.sitesAll}<ArrowRight className="flip-rtl size-4" /></Link>
      </div>
      {live.length ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {live.slice(0, LIMIT).map((x) => <CaseStudyCard key={x.id} t={t} item={x} link={ctx.urlForTarget(x.targetKey)} favorite={ctx.favorites.has(`case_study:${x.key}`)} compact />)}
        </div>
      ) : <div className="mt-4"><EmptyState icon={<Globe />} title={L.sitesEmpty} /></div>}
    </section>
  );
}
