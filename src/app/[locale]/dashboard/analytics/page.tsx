import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo, type Range } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/money";
import { PageHeader, Card, Notice } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const RANGES: Range[] = ["7d", "30d", "90d", "1y", "all"];

export default async function Analytics({ params, searchParams }: PageProps<"/[locale]/dashboard/analytics">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const range: Range = RANGES.includes(sp.range as Range) ? (sp.range as Range) : "90d";
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const a = await repo().getAnalytics(s, range);
  const A = t.dash.analytics;
  const steps = [
    [A.visitors, a.funnel.visitors], [A.leads, a.funnel.leads], [A.appointments, a.funnel.appointments], [A.sales, a.funnel.sales],
  ] as const;
  const top = Math.max(a.funnel.visitors, 1);

  return (
    <>
      <PageHeader
        title={A.title}
        subtitle={A.subtitle}
        action={
          <div className="inline-flex rounded-full bg-surface-2 p-0.5">
            {RANGES.map((r) => (
              <Link key={r} href={`?range=${r}`} scroll={false} className={cn("h-8 rounded-full px-3 text-[12px] font-medium leading-8", r === range ? "bg-surface shadow-sm" : "text-muted")}>
                {t.dash.ranges[r]}
              </Link>
            ))}
          </div>
        }
      />
      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">{A.funnel}</h2>
        <ol className="mt-5 grid gap-3">
          {steps.map(([label, n], i) => (
            <li key={label} className="grid grid-cols-[110px_1fr] items-center gap-4 sm:grid-cols-[140px_1fr]">
              <span className="text-[14px] text-fg-2">{label}</span>
              <div className="flex items-center gap-3">
                <div className="h-10 rounded-xl bg-gradient-to-r from-accent to-accent-2" style={{ width: `${Math.max(4, (n / top) * 100)}%`, opacity: 1 - i * 0.15 }} />
                <span className="tabular shrink-0 text-[14px] font-semibold">{formatNumber(n, locale)}</span>
                {i > 0 && <span className="tabular shrink-0 text-[12px] text-muted">{formatPercent(steps[i - 1][1] ? n / steps[i - 1][1] : 0, locale)}</span>}
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          <h2 className="text-[15px] font-semibold">{A.byCampaign}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="text-[12px] text-muted"><tr className="border-b border-line">
                <th className="py-2 text-start font-medium">{t.dash.campaigns.name}</th>
                <th className="py-2 text-end font-medium">{t.dash.campaigns.clicks}</th>
                <th className="py-2 text-end font-medium">{t.dash.campaigns.leads}</th>
                <th className="py-2 text-end font-medium">{t.dash.campaigns.sales}</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {a.byCampaign.map((c) => (
                  <tr key={c.name}><td className="py-2.5">{c.name}</td><td className="tabular text-end">{c.clicks}</td><td className="tabular text-end">{c.leads}</td><td className="tabular text-end">{c.sales}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Bars title={A.byCountry} rows={a.byCountry} locale={locale} />
        <Bars title={A.byDevice} rows={a.byDevice} locale={locale} />
        <div className="grid content-start"><Notice>{A.privacyNote}</Notice></div>
      </div>
    </>
  );
}

function Bars({ title, rows, locale }: { title: string; rows: { key: string; clicks: number }[]; locale: Locale }) {
  const max = Math.max(...rows.map((r) => r.clicks), 1);
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <ul className="mt-4 grid gap-2.5">
        {rows.slice(0, 8).map((r) => (
          <li key={r.key} className="grid grid-cols-[80px_1fr_48px] items-center gap-3 text-[13px]">
            <span className="truncate capitalize text-fg-2">{r.key}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-3"><span className="block h-full rounded-full bg-accent" style={{ width: `${(r.clicks / max) * 100}%` }} /></span>
            <span className="tabular text-end text-muted">{formatNumber(r.clicks, locale)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
