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

/** Question: "Where is my traffic coming from?" */
export default async function MyLink({ params }: PageProps<"/[locale]/dashboard/link">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const r = repo();
  const [stats, pages, markets, links] = await Promise.all([r.getLinkStats(s), r.listPrivatePages(s), r.listMarkets(), r.listLinks(s)]);
  const url = `${env.siteUrl}/s/${s.affiliate.slug ?? s.affiliate.code}`;
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
      <PageHeader title={t.dash.nav.link} subtitle={t.dash.link.subtitle} />
      {s.affiliate.status !== "approved" && <div className="mb-6"><Notice tone="warning">{t.dash.onboarding.pendingNote}</Notice></div>}
      <SharePanel url={url} qrDataUrl={qr} />
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {cells.map(([label, value]) => (
          <div key={label} className="card p-4">
            <div className="tabular text-[22px] font-semibold tracking-[-0.03em]">{value}</div>
            <div className="mt-1.5 text-[12px] text-muted">{label}</div>
          </div>
        ))}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5 sm:p-6"><SlugForm current={s.affiliate.slug} siteUrl={env.siteUrl} /></Card>
        <Card className="p-5 sm:p-6">
          <PrivatePages pages={pages} markets={markets} campaigns={links.filter((l) => l.campaignId).map((l) => ({ id: l.campaignId!, name: l.name }))} siteUrl={env.siteUrl} />
        </Card>
      </div>
    </>
  );
}
