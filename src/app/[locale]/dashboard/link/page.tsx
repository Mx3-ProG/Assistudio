import QRCode from "qrcode";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { PageHeader, Card, Notice } from "@/components/ui/primitives";
import { SharePanel } from "@/components/dashboard/share-panel";
import { SlugForm, PrivatePages } from "@/components/dashboard/link-forms";
import { CopyButton } from "@/components/ui/copy-button";
import { LinkForm } from "@/components/sales-center/link-form";
import { marketContent } from "@/content/markets";

/** Question: "Where is my traffic coming from?" */
export default async function MyLink({ params }: PageProps<"/[locale]/dashboard/link">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const r = repo();
  const [stats, pages, markets, links] = await Promise.all([r.getLinkStats(s), r.listPrivatePages(s), r.listMarkets(), r.listLinks(s)]);
  const url = `${env.siteUrl}/s/${s.affiliate.slug ?? s.affiliate.code}`;
  // Dashboard CTA: the click is recorded by /s/, then the visitor lands on checkout.
  const checkoutUrl = `${url}?to=${encodeURIComponent(`/${locale}/buy?via=dashboard`)}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 336, color: { dark: "#111114", light: "#ffffff" } });
  const L = t.dash.link.stats;
  const cells = [
    [L.clicks, formatNumber(stats.clicks, locale)],
    [L.visitors, formatNumber(stats.uniqueVisitors, locale)],
    [L.leads, formatNumber(stats.leads, locale)],
    [L.conversions, formatNumber(stats.conversions, locale)],
    [L.conversionRate, formatPercent(stats.uniqueVisitors ? stats.conversions / stats.uniqueVisitors : 0, locale)],
    [L.revenue, formatMoney(stats.revenueCents, locale)],
    [L.commission, formatMoney(stats.commissionCents, locale)],
  ];

  return (
    <>
      <PageHeader title={t.sc.links.title} subtitle={t.sc.links.subtitle} action={<LinkForm pages={pages.filter((p) => !p.archivedAt).map((p) => ({ id: p.id, label: p.pathKey ?? p.slug }))} targets={markets.map((m) => ({ id: m.id, name: marketContent(m, locale).name }))} />} />
      {s.affiliate.status !== "approved" && <div className="mb-6"><Notice tone="warning">{t.dash.onboarding.pendingNote}</Notice></div>}
      <SharePanel url={url} qrDataUrl={qr} />
      <Card className="mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold">{t.dash.link.checkoutTitle}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{t.dash.link.checkoutHint}</p>
          <p className="mt-2 truncate font-mono text-[12px] text-fg-2">{checkoutUrl}</p>
        </div>
        <CopyButton value={checkoutUrl} />
      </Card>
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {cells.map(([label, value]) => (
          <div key={label} className="card p-4">
            <div className="tabular text-[22px] font-semibold tracking-[-0.03em]">{value}</div>
            <div className="mt-1.5 text-[12px] text-muted">{label}</div>
          </div>
        ))}
      </section>
      {links.length > 0 && <Card className="mt-6 overflow-hidden"><ul className="divide-y divide-line">{links.map((l) => <li key={l.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium">{l.name}</p><p className="truncate font-mono text-[12px] text-muted">{env.siteUrl}/s/{l.code}</p></div><span className="text-[12px] text-muted">{l.stats.uniqueVisitors} {t.sc.links.funnel.visitors} · {l.stats.conversions} {t.sc.links.funnel.sales}</span><CopyButton value={`${env.siteUrl}/s/${l.code}`} /></li>)}</ul></Card>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5 sm:p-6"><SlugForm current={s.affiliate.slug} siteUrl={env.siteUrl} /></Card>
        <Card className="p-5 sm:p-6">
          <PrivatePages pages={pages} markets={markets} campaigns={links.filter((l) => l.campaignId).map((l) => ({ id: l.campaignId!, name: l.name }))} siteUrl={env.siteUrl} />
        </Card>
      </div>
    </>
  );
}
