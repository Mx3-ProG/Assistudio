"use client";
import { useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge, EmptyState, inputClass } from "@/components/ui/primitives";
import { formatDate, formatMoney } from "@/lib/money";
import type { SaleRow } from "@/lib/data/types";
import type { SaleStatus } from "@/lib/commission";
import { saleTone } from "./status";
import { cn } from "@/lib/cn";

export function SalesTable({ sales }: { sales: SaleRow[] }) {
  const { t, locale } = useI18n();
  const S = t.dash.sales;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SaleStatus | "all">("all");
  const rows = useMemo(() => sales.filter((s) =>
    (status === "all" || s.status === status) &&
    (!q || [s.ref, s.customerRef, s.customerName, s.campaign].some((v) => v?.toLowerCase().includes(q.toLowerCase())))), [sales, q, status]);

  if (!sales.length) return <div className="card"><EmptyState icon={<ShoppingBag className="size-5" />} title={S.empty} /></div>;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.searchPlaceholder} className={cn(inputClass, "h-10 ps-10")} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as SaleStatus | "all")} className={cn(inputClass, "h-10 appearance-none sm:w-52")} aria-label={S.status}>
          <option value="all">{t.common.all}</option>
          {(Object.keys(S.statuses) as SaleStatus[]).map((s) => <option key={s} value={s}>{S.statuses[s]}</option>)}
        </select>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{s.customerName ?? s.customerRef}</p>
              <p className="text-[12px] text-muted">{s.ref} · {formatDate(s.date, locale, "short")}</p>
            </div>
            <div className="text-end">
              <p className="tabular font-semibold">{s.commissionCents !== null ? formatMoney(s.commissionCents, locale) : "—"}</p>
              <Badge tone={saleTone[s.status]} className="mt-1">{S.statuses[s.status]}</Badge>
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-[14px]">
          <thead className="text-[12px] text-muted">
            <tr className="border-b border-line">
              {[S.customer, S.product, S.date, S.status, S.amount, S.commission, S.renewal, S.source, S.campaign].map((h, i) => (
                <th key={h} className={cn("whitespace-nowrap px-4 py-3 font-medium", i === 4 || i === 5 ? "text-end" : "text-start")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-3"><p className="font-medium">{s.customerName ?? "—"}</p><p className="text-[12px] text-muted">{s.customerRef} · {s.ref}</p></td>
                <td className="px-4 py-3">{s.product}{s.kind === "renewal" && <Badge className="ms-2">↻</Badge>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(s.date, locale, "short")}</td>
                <td className="px-4 py-3"><Badge tone={saleTone[s.status]}>{S.statuses[s.status]}</Badge></td>
                <td className="tabular px-4 py-3 text-end">{formatMoney(s.amountCents, locale)}</td>
                <td className="tabular px-4 py-3 text-end font-semibold">{s.commissionCents !== null ? formatMoney(s.commissionCents, locale) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(s.renewalDate, locale, "short")}</td>
                <td className="px-4 py-3 capitalize text-fg-2">{s.source ?? "—"}</td>
                <td className="px-4 py-3 text-fg-2">{s.campaign ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
