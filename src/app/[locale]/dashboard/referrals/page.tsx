import QRCode from "qrcode";
import { Network, Users } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { env } from "@/lib/env";
import { formatDate, formatMoney, formatNumber } from "@/lib/money";
import { PageHeader, Card, EmptyState, Stat, Badge, Notice } from "@/components/ui/primitives";
import { CopyButton } from "@/components/ui/copy-button";

export default async function Referrals({ params }: PageProps<"/[locale]/dashboard/referrals">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [t, data] = await Promise.all([getDictionary(locale), repo().getReferralDashboard(s)]);
  const R = t.dash.referrals;
  const code = data.slug ?? data.code;
  const url = `${env.siteUrl}/${locale}/register?sponsor=${encodeURIComponent(code)}`;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 280, color: { dark: "#111114", light: "#ffffff" } });

  return (
    <>
      <PageHeader title={R.title} subtitle={R.subtitle} />
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label={R.total} value={formatMoney(data.totalCommissionCents, locale)} tone="success" />
        <Stat label={R.pending} value={formatMoney(data.pendingCommissionCents, locale)} tone="warning" />
        <Stat label={R.available} value={formatMoney(data.availableCommissionCents, locale)} tone="accent" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold">{R.linkTitle}</h2>
          <p className="mt-1 text-[13px] text-muted">{R.linkHint}</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL is generated server-side. */}
            <img src={qr} alt="QR code" className="size-36 rounded-2xl border border-line bg-white p-2" />
            <div className="min-w-0 flex-1">
              <p className="break-all rounded-xl bg-surface-2 p-3 font-mono text-[12px]" dir="ltr">{url}</p>
              <CopyButton track="affiliate_link_copied" value={url} className="mt-3" />
            </div>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold"><Network className="size-5 text-accent" />{R.ruleTitle}</h2>
          <ul className="mt-4 grid gap-3 text-[14px]">
            <li className="rounded-xl bg-surface-2 p-3">{R.sellerRule}</li>
            <li className="rounded-xl bg-accent-soft p-3 text-accent">{R.sponsorRule}</li>
          </ul>
          <Notice>{R.directOnly}</Notice>
          <p className="mt-4 text-[13px] text-muted">{data.sponsor ? fmt(R.sponsor, { name: data.sponsor.name }) : R.noSponsor}</p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-6"><h2 className="text-[16px] font-semibold">{R.recruits}</h2></div>
        {data.recruits.length === 0 ? <EmptyState icon={<Users className="size-5" />} title={R.noRecruits} /> : (
          <ul className="divide-y divide-line">
            {data.recruits.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
                <div className="grid size-10 place-items-center rounded-full bg-surface-2 font-semibold">{x.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{x.name}</p>
                  <p className="text-[12px] text-muted">{formatDate(x.joinedAt, locale, "short")}</p>
                </div>
                <Badge tone={x.status === "approved" ? "success" : x.status === "pending" ? "warning" : "neutral"}>{R.statuses[x.status]}</Badge>
                <div className="min-w-20 text-end"><p className="tabular text-[14px] font-semibold">{formatNumber(x.sales, locale)}</p><p className="text-[11px] text-muted">{R.sales}</p></div>
                <div className="min-w-28 text-end"><p className="tabular text-[14px] font-semibold text-success">{formatMoney(x.commissionCents, locale)}</p><p className="text-[11px] text-muted">{R.generated}</p></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
