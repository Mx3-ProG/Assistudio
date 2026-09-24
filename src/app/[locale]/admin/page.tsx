import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatNumber, formatRelative } from "@/lib/money";
import { PageHeader, Card, CardHeader, Badge } from "@/components/ui/primitives";

export default async function AdminHome({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const r = repo();
  const [o, affiliates, flags] = await Promise.all([r.adminOverview(s), r.adminListAffiliates(s), r.adminListFraudFlags(s)]);
  const K = t.admin.kpi;
  const base = `/${locale}/admin`;
  const kpis: [string, string, string][] = [
    [K.affiliates, formatNumber(o.affiliates, locale), `${base}/affiliates`],
    [K.applications, formatNumber(o.applications, locale), `${base}/affiliates`],
    [K.traffic, formatNumber(o.clicks30d, locale), base],
    [K.leads, formatNumber(o.leads, locale), base],
    [K.sales, formatNumber(o.sales, locale), `${base}/sales`],
    [K.revenue, formatMoney(o.revenueCents, locale), `${base}/sales`],
    [K.commissions, formatMoney(o.commissionsOwedCents, locale), `${base}/commissions`],
    [K.payouts, formatMoney(o.paidOutCents, locale), `${base}/payouts`],
    [K.renewals, formatNumber(o.renewals60d, locale), `${base}/sales`],
    [K.fraud, formatNumber(o.openFraudFlags, locale), `${base}/fraud`],
  ];
  const pending = affiliates.filter((a) => a.status === "pending");
  const open = flags.filter((f) => f.status === "open" || f.status === "reviewing");

  return (
    <>
      <PageHeader title={t.admin.title} />
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(([label, value, href]) => (
          <Link key={label} href={href} className="card p-4 transition hover:shadow-md">
            <div className="tabular text-[22px] font-semibold tracking-[-0.03em]">{value}</div>
            <div className="mt-1.5 text-[12px] text-muted">{label}</div>
          </Link>
        ))}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={K.applications} action={<Link href={`${base}/affiliates`} className="text-[13px] text-accent">{t.common.viewAll}</Link>} />
          <ul className="mt-3 divide-y divide-line">
            {pending.length === 0 && <li className="px-6 py-8 text-center text-[14px] text-muted">{t.common.empty}</li>}
            {pending.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <div><p className="font-medium">{a.name}</p><p className="text-[12px] text-muted">{a.email}</p></div>
                <span className="text-[12px] text-muted">{formatRelative(a.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={K.fraud} action={<Link href={`${base}/fraud`} className="text-[13px] text-accent">{t.common.viewAll}</Link>} />
          <ul className="mt-3 divide-y divide-line">
            {open.length === 0 && <li className="px-6 py-8 text-center text-[14px] text-muted">{t.common.empty}</li>}
            {open.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <div><p className="font-medium">{f.type.replace(/_/g, " ")}</p><p className="text-[12px] text-muted">{f.affiliateName ?? "—"}</p></div>
                <Badge tone={f.severity >= 2 ? "danger" : "warning"}>S{f.severity}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
