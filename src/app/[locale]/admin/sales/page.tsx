import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { setSaleStatus, correctAttribution } from "@/app/actions/admin";
import { PageHeader, Card, Badge, Notice } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";
import { saleTone, commissionTone } from "@/components/dashboard/status";
import { AttributionForm } from "@/components/admin/attribution-form";

export default async function AdminSales({ params }: PageProps<"/[locale]/admin/sales">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const [sales, affiliates] = await Promise.all([repo().adminListSales(s), repo().adminListAffiliates(s)]);
  const S = t.dash.sales;
  return (
    <>
      <PageHeader title={t.admin.nav.sales} />
      <div className="mb-4"><Notice>Payment status normally arrives from the payment provider webhook. Manual changes are for corrections only and are audit-logged.</Notice></div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {sales.map((x) => (
            <li key={x.id} className="grid gap-3 p-4 sm:px-6 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {x.ref} · {x.customerName ?? x.customerRef}
                  <Badge tone={saleTone[x.status]}>{S.statuses[x.status]}</Badge>
                  {x.isDemo && <Badge>demo</Badge>}
                </p>
                <p className="text-[12px] text-muted">{formatDate(x.date, locale, "short")} · {formatMoney(x.amountCents, locale)} · {x.affiliateName ?? "—"}</p>
              </div>
              <div className="text-[13px]">
                {x.commissionStatus && (
                  <span className="flex items-center gap-2">
                    <span className="tabular font-medium">{formatMoney(x.commissionCents ?? 0, locale)}</span>
                    <Badge tone={commissionTone[x.commissionStatus]}>{t.dash.commissions.statuses[x.commissionStatus]}</Badge>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {x.status === "pending" && <ReasonAction action={setSaleStatus} fields={{ id: x.id, status: "paid" }} label={S.statuses.paid} variant="primary" />}
                {x.status === "pending" && <ReasonAction action={setSaleStatus} fields={{ id: x.id, status: "failed" }} label={S.statuses.failed} />}
                {x.status === "paid" && <ReasonAction action={setSaleStatus} fields={{ id: x.id, status: "refunded" }} label={S.statuses.refunded} variant="danger" />}
                {x.status === "paid" && <ReasonAction action={setSaleStatus} fields={{ id: x.id, status: "chargeback" }} label={S.statuses.chargeback} variant="danger" />}
                <AttributionForm action={correctAttribution} saleId={x.id} current={x.affiliateId} affiliates={affiliates.filter((a) => a.status === "approved").map((a) => ({ id: a.id, name: a.name }))} label={t.admin.correctAttribution} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
