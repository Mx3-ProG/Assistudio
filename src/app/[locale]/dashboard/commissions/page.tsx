import { Wallet } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { PageHeader, Stat, Badge, EmptyState, Notice } from "@/components/ui/primitives";
import { commissionTone } from "@/components/dashboard/status";

/** Question: "How much did I earn?" — a real ledger, never optimistic. */
export default async function Commissions({ params }: PageProps<"/[locale]/dashboard/commissions">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [rows, b] = await Promise.all([repo().listCommissions(s), repo().getBalances(s)]);
  const C = t.dash.commissions;

  const pipeline: [keyof typeof C.statuses, number][] = [
    ["pending", b.pendingPaymentCents], ["in_validation", b.inValidationCents], ["available", b.availableCents], ["paid", b.paidCents],
  ];

  return (
    <>
      <PageHeader title={C.title} subtitle={C.subtitle} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={C.available} value={formatMoney(b.availableCents, locale)} tone="accent" />
        <Stat label={C.pending} value={formatMoney(b.pendingPaymentCents + b.inValidationCents, locale)} tone="warning" />
        <Stat label={C.paid} value={formatMoney(b.paidCents, locale)} tone="success" />
        <Stat label={C.lifetime} value={formatMoney(b.lifetimeEarnedCents, locale)} />
      </section>

      {/* The lifecycle, made visible */}
      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {pipeline.map(([k, cents], i) => (
          <li key={k} className="relative rounded-2xl border border-line bg-surface-2/60 p-4">
            <span className="tabular text-[11px] font-semibold text-muted">0{i + 1}</span>
            <p className="mt-1 text-[13px] font-medium">{C.statuses[k]}</p>
            <p className="tabular mt-1 text-[17px] font-semibold">{formatMoney(cents, locale)}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4"><Notice>{C.explainer}</Notice></div>

      <section className="card mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{C.historyTitle}</h2>
        {rows.length === 0 ? <EmptyState icon={<Wallet className="size-5" />} title={C.empty} /> : (
          <>
            <ul className="mt-3 divide-y divide-line md:hidden">
              {rows.map((c) => (
                <li key={c.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.saleRef} <span className="text-muted">· {c.customerRef}</span></p>
                    <p className="text-[12px] text-muted">{C.expectedPayment}: {formatDate(c.expectedPaymentDate, locale, "short")}</p>
                  </div>
                  <div className="text-end">
                    <p className="tabular font-semibold">{formatMoney(c.amountCents, locale)}</p>
                    <Badge tone={commissionTone[c.status]} className="mt-1">{C.statuses[c.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 hidden overflow-x-auto md:block">
              <table className="w-full text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-y border-line">
                    {[C.sale, C.customerId, C.gross, C.eligible, C.status, C.validationDate, C.expectedPayment, C.paymentDate].map((h, i) => (
                      <th key={h} className={`whitespace-nowrap px-4 py-3 font-medium ${i === 2 || i === 3 ? "text-end" : "text-start"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium">{c.saleRef}</td>
                      <td className="px-4 py-3 text-fg-2">{c.customerRef}</td>
                      <td className="tabular px-4 py-3 text-end text-fg-2">{formatMoney(c.grossCents, locale)}</td>
                      <td className="tabular px-4 py-3 text-end font-semibold">{formatMoney(c.amountCents, locale)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={commissionTone[c.status]}>{C.statuses[c.status]}</Badge>
                        {c.reversalReason && <span className="ms-2 text-[12px] text-muted">{c.reversalReason}</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(c.holdUntil, locale, "short")}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(c.expectedPaymentDate, locale, "short")}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(c.paidAt, locale, "short")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
