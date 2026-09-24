import { Megaphone } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { marketContent } from "@/content/markets";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui/primitives";
import { CopyButton } from "@/components/ui/copy-button";
import { CampaignForm } from "@/components/dashboard/campaign-form";
import { salesContext, ofKind } from "@/lib/sales/server";

export default async function Campaigns({ params }: PageProps<"/[locale]/dashboard/campaigns">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [links, markets, ctx] = await Promise.all([repo().listLinks(s), repo().listMarkets(), salesContext(s, locale)]);
  const c = t.dash.campaigns;

  return (
    <>
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <div className="mb-6"><CampaignForm markets={markets} pages={ctx.pages.map((p) => ({ id: p.id, label: p.pathKey ?? p.slug }))} messages={ofKind(ctx.content, "message").map((m) => ({ key: m.key, title: m.title }))} /></div>
      <Card className="overflow-hidden">
        {links.length === 0 ? (
          <EmptyState icon={<Megaphone className="size-5" />} title={c.empty} />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="divide-y divide-line md:hidden">
              {links.map((l) => {
                const url = `${env.siteUrl}/s/${l.code}`;
                const m = markets.find((x) => x.id === l.marketId);
                return (
                  <li key={l.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{l.name}</p>
                        <p className="truncate font-mono text-[12px] text-muted" dir="ltr">/s/{l.code}</p>
                      </div>
                      <CopyButton value={url} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {l.source && <Badge className="capitalize">{l.source}</Badge>}
                      {m && <Badge tone="accent">{marketContent(m, locale).name}</Badge>}
                    </div>
                    <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {[[c.clicks, formatNumber(l.stats.clicks, locale)], [c.leads, l.stats.leads], [c.sales, l.stats.conversions], [c.commissions, formatMoney(l.stats.commissionCents, locale)]].map(([k, v]) => (
                        <div key={String(k)} className="rounded-xl bg-surface-2 py-2">
                          <dd className="tabular text-[14px] font-semibold">{v}</dd>
                          <dt className="text-[10.5px] text-muted">{k}</dt>
                        </div>
                      ))}
                    </dl>
                  </li>
                );
              })}
            </ul>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-[14px]">
                <thead className="text-start text-[12px] text-muted">
                  <tr className="border-b border-line">
                    {[c.name, c.source, c.market, c.created, c.clicks, c.leads, c.sales, c.commissions, ""].map((h, i) => (
                      <th key={i} className={`px-4 py-3 font-medium ${i >= 4 && i < 8 ? "text-end" : "text-start"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {links.map((l) => {
                    const m = markets.find((x) => x.id === l.marketId);
                    return (
                      <tr key={l.id} className="hover:bg-surface-2/50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{l.name}</p>
                          <p className="font-mono text-[12px] text-muted" dir="ltr">/s/{l.code}</p>
                        </td>
                        <td className="px-4 py-3 capitalize text-fg-2">{l.source ?? "—"}</td>
                        <td className="px-4 py-3 text-fg-2">{m ? marketContent(m, locale).name : "—"}</td>
                        <td className="px-4 py-3 text-fg-2">{formatDate(l.createdAt, locale, "short")}</td>
                        <td className="tabular px-4 py-3 text-end">{formatNumber(l.stats.clicks, locale)}</td>
                        <td className="tabular px-4 py-3 text-end">{l.stats.leads}</td>
                        <td className="tabular px-4 py-3 text-end">{l.stats.conversions}</td>
                        <td className="tabular px-4 py-3 text-end font-medium">{formatMoney(l.stats.commissionCents, locale)}</td>
                        <td className="px-4 py-3 text-end"><CopyButton value={`${env.siteUrl}/s/${l.code}`} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
