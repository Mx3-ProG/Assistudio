import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import type { AdminFinanceFilters } from "@/lib/data/types";
import { formatMoney, formatNumber, formatRelative } from "@/lib/money";
import { PageHeader, Card, Stat, Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { requeueFailedEmails } from "@/app/actions/admin";

const SALE_STATUSES = ["paid", "partially_refunded", "disputed", "refunded", "chargeback"] as const;
const str = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Global view of money confirmed by Stripe and of every commission bucket. Filters are plain GET params. */
export default async function AdminFinance({ params, searchParams }: PageProps<"/[locale]/admin/finance">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const F = t.admin.finance;
  const filters: AdminFinanceFilters = {
    from: str(sp.from), to: str(sp.to), affiliateId: str(sp.affiliate), productId: str(sp.product),
    status: SALE_STATUSES.find((x) => x === sp.status) ?? null, country: str(sp.country)?.slice(0, 2) ?? null,
    campaignId: str(sp.campaign), currency: "EUR",
  };
  const [sum, opt] = await Promise.all([repo().adminFinanceSummary(s, filters), repo().adminFinanceOptions(s)]);
  const m = (c: number) => formatMoney(c, locale, sum.currency);
  const select = (name: string, value: string | null | undefined, items: { id: string; name: string }[]) => (
    <select name={name} defaultValue={value ?? ""} className={`${inputClass} appearance-none`}>
      <option value="">{t.common.all}</option>
      {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
    </select>
  );

  return (
    <>
      <PageHeader title={F.title} subtitle={F.subtitle} />
      <Card className="mb-6 p-4 sm:p-5">
        <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 lg:items-end">
          <Field label={F.from}><input type="date" name="from" defaultValue={filters.from ?? ""} className={inputClass} /></Field>
          <Field label={F.to}><input type="date" name="to" defaultValue={filters.to ?? ""} className={inputClass} /></Field>
          <Field label={t.admin.affiliate}>{select("affiliate", filters.affiliateId, opt.affiliates)}</Field>
          <Field label={F.product}>{select("product", filters.productId, opt.products)}</Field>
          <Field label={F.status}>{select("status", filters.status, SALE_STATUSES.map((x) => ({ id: x, name: t.dash.sales.statuses[x] })))}</Field>
          <Field label={F.country}>{select("country", filters.country, opt.countries.map((c) => ({ id: c, name: c })))}</Field>
          <Field label={F.campaign}>{select("campaign", filters.campaignId, opt.campaigns)}</Field>
          <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-7">
            <button className={buttonClass("primary", "sm")}>{F.apply}</button>
            <Link href={`/${locale}/admin/finance`} className={buttonClass("ghost", "sm")}>{F.reset}</Link>
          </div>
        </form>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={F.gross} value={m(sum.grossRevenueCents)} hint={fmt(F.sales, { n: sum.salesCount, r: sum.renewalsCount })} />
        <Stat label={F.attributed} value={m(sum.attributedRevenueCents)} />
        <Stat label={F.refunds} value={m(sum.refundsCents)} />
        <Stat label={F.chargebacks} value={m(sum.chargebacksCents)} hint={`${formatNumber(sum.chargebacksCount, locale)} · ${F.openDisputes}: ${formatNumber(sum.openDisputesCount, locale)}`} />
      </section>
      <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={F.pending} value={m(sum.pendingCommissionsCents)} tone="warning" />
        <Stat label={F.disputed} value={m(sum.disputedCommissionsCents)} tone="warning" />
        <Stat label={F.available} value={m(sum.availableCommissionsCents)} tone="accent" />
        <Stat label={F.paid} value={m(sum.paidCommissionsCents)} tone="success" />
        <Stat label={F.reversed} value={m(sum.reversedCommissionsCents)} hint={`${F.recovery}: ${formatNumber(sum.recoveryRequiredCount, locale)}`} />
      </section>
      <section className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label={F.activeSubscriptions} value={formatNumber(sum.activeSubscriptions, locale)} />
        <Stat label={F.upcomingRenewals} value={formatNumber(sum.upcomingRenewals60d, locale)} />
        <Stat label={F.cancelling} value={formatNumber(sum.cancellingSubscriptions, locale)} />
      </section>

      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">{F.health}</h2>
        <dl className="mt-3 grid gap-3 text-[14px] sm:grid-cols-3">
          <div><dt className="text-muted">{F.webhooksFailed}</dt><dd className={`tabular text-[20px] font-semibold ${sum.webhooksFailed ? "text-danger" : ""}`}>{sum.webhooksFailed}</dd></div>
          <div><dt className="text-muted">{F.lastWebhook}</dt><dd className="text-[16px] font-medium">{sum.webhooksLastReceivedAt ? formatRelative(sum.webhooksLastReceivedAt, locale) : "—"}</dd></div>
          <div><dt className="text-muted">{F.emailsFailed}</dt><dd className={`tabular text-[20px] font-semibold ${sum.emailsFailed ? "text-danger" : ""}`}>{sum.emailsFailed}</dd></div>
        </dl>
        {sum.emailsFailed > 0 && (
          <form action={requeueFailedEmails} className="mt-4">
            <button className={buttonClass("secondary", "md")}>{F.retryFailedEmails}</button>
          </form>
        )}
      </Card>
    </>
  );
}
