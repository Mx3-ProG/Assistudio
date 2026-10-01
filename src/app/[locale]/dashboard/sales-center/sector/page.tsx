import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { marketContent } from "@/content/markets";
import { salesContext, sectorOptions } from "@/lib/sales/server";
import { matchSectors } from "@/lib/sales/sectors";
import { PageHeader } from "@/components/ui/primitives";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { BackLink } from "@/components/sales-center/back-link";
import { SectorSearch } from "@/components/copilot/sector-search";

/** Resolver for "my prospect is a …": one clear match → its sheet; several → choose; none → the generic kit. */
export default async function SectorPage({ params, searchParams }: PageProps<"/[locale]/dashboard/sales-center/sector">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]);
  const base = `/${locale}/dashboard/sales-center`;
  const matches = matchSectors(q, ctx.markets, 6);
  if (matches.length === 1 || (matches.length > 1 && matches[0].score >= 2 * matches[1].score)) redirect(`${base}/targets/${matches[0].market.slug}`);
  const options = sectorOptions(ctx.markets, locale);
  const S = t.cp.sector;
  return (
    <div className="space-y-6">
      <BackLink href={base} label={t.cp.title} />
      <PageHeader title={q && matches.length ? fmt(S.resultsTitle, { q }) : S.label} />
      <SectorSearch sectors={options} popular={options.slice(0, 6)} initial={q} />
      {matches.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {matches.map(({ market: m }) => {
            const c = marketContent(m, locale);
            return (
              <li key={m.slug}>
                <Link href={`${base}/targets/${m.slug}`} className="card flex h-full items-start gap-3 p-4 transition hover:shadow-md">
                  <MarketIcon name={m.icon} className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1"><span className="block font-semibold">{c.name}</span><span className="mt-1 line-clamp-2 block text-[13px] text-muted">{c.who}</span></span>
                  <ArrowRight className="flip-rtl size-4 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : q ? (
        <section className="card p-5 sm:p-6">
          <p className="text-[15px]">{fmt(S.noMatch, { q })}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {([["pitch", t.cp.intents.understand.title], ["objections", t.cp.intents.objection.title], ["assets", t.cp.intents.send.title], ["messages", t.sc.sections.messages.title]] as const).map(([href, label]) => (
              <Link key={href} href={`${base}/${href}`} className="inline-flex h-9 items-center rounded-full bg-surface-2 px-4 text-[14px] hover:bg-surface-3">{label}</Link>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-muted">{S.noMatchHint}</p>
        </section>
      ) : null}
    </div>
  );
}
