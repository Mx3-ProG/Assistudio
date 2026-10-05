import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import type { PayoutStatus } from "@/lib/payouts";
import { createPayout } from "@/app/actions/admin";
import { PageHeader, Card, CardHeader, Badge, EmptyState } from "@/components/ui/primitives";
import { payoutTone } from "@/components/dashboard/status";
import { PayoutCreate } from "@/components/admin/payout-create";
import { cn } from "@/lib/cn";

type Filter = "all" | "requested" | "processing" | "paid" | "rejected" | "failed";
const FILTERS: Record<Filter, PayoutStatus[] | null> = {
  all: null,
  requested: ["requested", "scheduled"],
  processing: ["processing"],
  paid: ["paid"],
  rejected: ["rejected", "cancelled"],
  failed: ["failed"],
};

/** ADMIN → Partner payouts: requests to handle first, every payout one click away. */
export default async function AdminPayouts({ params, searchParams }: PageProps<"/[locale]/admin/payouts">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const A = t.po.admin;
  const filter: Filter = typeof sp.status === "string" && sp.status in FILTERS ? (sp.status as Filter) : "all";
  const [payouts, all, candidates] = await Promise.all([
    repo().adminListPayouts(s, FILTERS[filter] ?? undefined), repo().adminListPayouts(s), repo().adminPayoutCandidates(s),
  ]);
  const count = (f: Filter) => (FILTERS[f] ? all.filter((p) => FILTERS[f]!.includes(p.status)).length : all.length);
  const money = (c: number) => formatMoney(c, locale, "EUR");
  const base = `/${locale}/admin/payouts`;

  return (
    <>
      <PageHeader title={A.title} />
      <nav className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={A.title}>
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <Link key={f} href={f === "all" ? base : `${base}?status=${f}`} aria-current={f === filter ? "page" : undefined}
            className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium", f === filter ? "bg-fg text-bg" : "bg-surface-2 hover:bg-surface-3")}>
            {A.filters[f]}<span className={cn("tabular text-[12px]", f === filter ? "opacity-70" : "text-muted")}>{count(f)}</span>
          </Link>
        ))}
      </nav>

      <Card className="overflow-hidden">
        {payouts.length === 0 ? <EmptyState title={A.empty} /> : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {payouts.map((p) => (
                <li key={p.id}>
                  <Link href={`${base}/${p.id}`} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.affiliateName}</p>
                      <p className="tabular text-[12px] text-muted">{p.ref} · {formatDate(p.requestedAt, locale, "short")} · {A.methods[p.method]}</p>
                    </div>
                    <div className="text-end">
                      <p className="tabular font-semibold">{money(p.amountCents)}</p>
                      <Badge tone={payoutTone[p.status]} className="mt-1">{t.po.statuses[p.status]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-[14px]">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    {[A.partner, A.amount, A.date, A.method, A.ref, A.status, ""].map((h, i) => (
                      <th key={i} className={cn("whitespace-nowrap px-4 py-3 font-medium", i === 1 ? "text-end" : "text-start")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-2/50">
                      <td className="px-4 py-3 font-medium">{p.affiliateName}</td>
                      <td className="tabular px-4 py-3 text-end font-semibold">{money(p.amountCents)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(p.requestedAt, locale, "short")}</td>
                      <td className="px-4 py-3 text-muted">{A.methods[p.method]}</td>
                      <td className="tabular px-4 py-3">{p.ref}</td>
                      <td className="px-4 py-3"><Badge tone={payoutTone[p.status]}>{t.po.statuses[p.status]}</Badge></td>
                      <td className="px-4 py-3 text-end">
                        <Link href={`${base}/${p.id}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">{t.common.viewAll}<ArrowRight className="flip-rtl size-3.5" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Staff-initiated payout (whole balance), kept for exceptional cases. */}
      {candidates.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-[14px] font-semibold">{A.createTitle}</summary>
          <Card className="mt-3">
            <CardHeader title={A.createTitle} />
            <p className="px-5 pt-1 text-[13px] text-muted sm:px-6">{A.createHint}</p>
            <ul className="mt-3 divide-y divide-line">
              {candidates.map((c) => (
                <li key={c.affiliateId} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                  <span className="font-medium">{c.affiliateName}</span>
                  <span className="tabular">{money(c.availableCents)}</span>
                  <PayoutCreate action={createPayout} affiliateId={c.affiliateId} label={t.admin.createPayout} />
                </li>
              ))}
            </ul>
          </Card>
        </details>
      )}
    </>
  );
}
