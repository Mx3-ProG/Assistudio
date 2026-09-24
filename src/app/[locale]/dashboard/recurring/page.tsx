import { Repeat } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney, formatRelative } from "@/lib/money";
import { PageHeader, Card, EmptyState, Notice, Badge } from "@/components/ui/primitives";

const YEARS = 5;

/**
 * Question: "What can renew?"
 * Earned (validated) vs projected (renewals of current contracts) vs potential —
 * always visually and verbally distinct. Nothing future is presented as guaranteed.
 */
export default async function Recurring({ params }: PageProps<"/[locale]/dashboard/recurring">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const book = await repo().getRecurringBook(s);
  const R = t.dash.recurring;
  const active = book.contracts.filter((c) => c.status === "active");
  const annual = book.potentialAnnualCents;
  const years = Array.from({ length: YEARS }, (_, i) => ({ year: i + 1, cumulative: book.earnedCents + annual * (i + 1) }));
  const max = Math.max(book.earnedCents + annual * YEARS, 1);

  return (
    <>
      <PageHeader title={R.title} subtitle={R.subtitle} />
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -bottom-24 -end-24 size-80 rounded-full bg-accent/20 blur-3xl" />
        <p className="relative text-[15px] text-muted">{fmt(R.contracts, { n: active.length })}</p>
        <p className="tabular relative mt-2 text-[44px] font-semibold tracking-[-0.04em] sm:text-[64px]">{formatMoney(annual, locale)}</p>
        <p className="relative text-[15px] text-fg-2">{R.potential}</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold">{R.projectedTitle}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{R.projectedHint}</p>
          <div className="mt-6 flex h-56 items-end gap-3" role="img" aria-label={R.projectedTitle}>
            {years.map((y) => (
              <div key={y.year} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="tabular text-[11px] font-medium text-fg-2 sm:text-[12px]">{formatMoney(y.cumulative, locale, "EUR", { compact: true })}</span>
                <div className="flex w-full flex-col-reverse overflow-hidden rounded-xl" style={{ height: `${(y.cumulative / max) * 100}%` }}>
                  <div className="bg-success" style={{ height: `${(book.earnedCents / y.cumulative) * 100}%` }} />
                  <div className="bg-[repeating-linear-gradient(135deg,var(--accent-soft)_0_6px,transparent_6px_10px)] ring-1 ring-inset ring-accent/40" style={{ flex: 1 }} />
                </div>
                <span className="text-[11px] text-muted">{fmt(R.yearN, { n: y.year })}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-[12px] text-muted">
            <span className="flex items-center gap-2"><span className="size-3 rounded bg-success" />{R.legendEarned}</span>
            <span className="flex items-center gap-2"><span className="size-3 rounded bg-[repeating-linear-gradient(135deg,var(--accent-soft)_0_3px,transparent_3px_5px)] ring-1 ring-accent/40" />{R.legendProjected}</span>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{R.current}</h2>
          {book.contracts.length === 0 ? <EmptyState icon={<Repeat className="size-5" />} title={R.empty} /> : (
            <ul className="mt-3 divide-y divide-line">
              {book.contracts.map((c) => (
                <li key={c.subscriptionId} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.customerName ?? c.customerRef}</p>
                    <p className="text-[12px] text-muted">{R.renewalDate}: {formatDate(c.renewalDate, locale)} · {formatRelative(c.renewalDate, locale)}</p>
                  </div>
                  <div className="text-end">
                    <p className="tabular font-semibold">{formatMoney(c.commissionCents, locale)}</p>
                    <Badge tone={c.status === "active" ? "accent" : "neutral"} className="mt-1">{R.legendPotential}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="mt-6"><Notice tone="warning">{R.warning}</Notice></div>
    </>
  );
}
