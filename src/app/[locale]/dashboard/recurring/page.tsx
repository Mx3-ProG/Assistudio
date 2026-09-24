import { Repeat } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import type { RecurringContract } from "@/lib/data/types";
import { formatDate, formatMoney, formatNumber, formatPercent, formatRelative } from "@/lib/money";
import { PageHeader, Card, EmptyState, Notice, Badge, Stat } from "@/components/ui/primitives";

/**
 * Question: "What can renew?"
 * Earned money comes from the ledger only. Every future amount on this page is
 * labelled Potential: a renewal commission exists only once Stripe confirms the
 * renewal payment. Cancelled or cancelling contracts project nothing.
 */
export default async function Recurring({ params }: PageProps<"/[locale]/dashboard/recurring">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const book = await repo().getRecurringBook(s);
  const R = t.dash.recurring;
  const cur = book.currency;

  const ruleText = (c: RecurringContract) => {
    if (c.ruleRate === null) return c.ruleLabel ?? "—";
    const rate = fmt(R.ruleRate, { rate: formatPercent(c.ruleRate, locale, 2) });
    return `${rate} · ${c.ruleDurationMonths ? fmt(R.ruleDuration, { n: c.ruleDurationMonths }) : R.ruleLifetime}`;
  };
  const statusOf = (c: RecurringContract) => (c.cancelling && c.status === "active" ? R.cancelling : R.subStatuses[c.status]);
  const toneOf = (c: RecurringContract) =>
    c.cancelling || c.status === "cancelled" || c.status === "expired" ? "neutral" as const
      : c.status === "active" ? "success" as const : "warning" as const;
  const potential = (c: RecurringContract) => c.nextCommissionEligible
    ? <><span className="tabular font-semibold">{formatMoney(c.nextCommissionCents, locale, c.currency)}</span><Badge tone="accent" className="ms-2">{R.legendPotential}</Badge></>
    : <span className="text-[13px] text-muted">{R.reasons[c.nextCommissionReason as keyof typeof R.reasons] ?? R.noCommission}</span>;

  return (
    <>
      <PageHeader title={R.title} subtitle={R.subtitle} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label={R.kpiActive} value={formatNumber(book.activeCount, locale)} />
        <Stat label={R.kpiAnnual} value={formatMoney(book.annualRevenueCents, locale, cur)} />
        <Stat label={R.kpiPotential} value={formatMoney(book.potentialRenewalCommissionsCents, locale, cur)} tone="accent"
          hint={R.legendPotential} className="border-dashed" />
        <Stat label={R.kpiUpcoming} value={formatNumber(book.upcoming60dCount, locale)} />
        <Stat label={R.kpiRenewed} value={formatNumber(book.renewedCount, locale)} tone="success" />
        <Stat label={R.kpiCancelled} value={formatNumber(book.cancelledCount, locale)} />
      </section>

      <Card className="mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{R.current}</h2>
        {book.contracts.length === 0 ? <EmptyState icon={<Repeat className="size-5" />} title={R.empty} /> : (
          <>
            <ul className="mt-3 divide-y divide-line lg:hidden">
              {book.contracts.map((c) => (
                <li key={c.subscriptionId} className="space-y-1.5 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">{c.customerName ?? c.customerRef}</p>
                    <Badge tone={toneOf(c)}>{statusOf(c)}</Badge>
                  </div>
                  <p className="text-[12px] text-muted">
                    {c.productName} · {formatMoney(c.annualCents, locale, c.currency)} {t.common.perYear} · {R.colNext}: {formatDate(c.renewalDate, locale, "short")}
                  </p>
                  <p className="text-[12px] text-muted">{ruleText(c)}</p>
                  <div>{potential(c)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 hidden overflow-x-auto lg:block">
              <table className="w-full text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-y border-line">
                    {[R.colCustomer, R.colProduct, R.colStart, R.colNext, R.colAnnual, R.colRule, R.colPotential, R.colStatus].map((h, i) => (
                      <th key={h} className={`whitespace-nowrap px-4 py-3 font-medium ${i === 4 ? "text-end" : "text-start"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {book.contracts.map((c) => (
                    <tr key={c.subscriptionId}>
                      <td className="px-4 py-3 font-medium">{c.customerName ?? c.customerRef}<div className="text-[12px] font-normal text-muted">{c.customerRef}</div></td>
                      <td className="px-4 py-3 text-fg-2">{c.productName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(c.startedAt, locale, "short")}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-fg-2">
                        {c.cancelling || c.status === "cancelled" ? "—" : <>{formatDate(c.renewalDate, locale, "short")}{c.renewsSoon && <div className="text-[12px] text-muted">{formatRelative(c.renewalDate, locale)}</div>}</>}
                      </td>
                      <td className="tabular px-4 py-3 text-end">{formatMoney(c.annualCents, locale, c.currency)}</td>
                      <td className="px-4 py-3 text-[13px] text-fg-2">{ruleText(c)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{potential(c)}</td>
                      <td className="px-4 py-3"><Badge tone={toneOf(c)}>{statusOf(c)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
      <div className="mt-6"><Notice tone="warning">{R.warning}</Notice></div>
    </>
  );
}
