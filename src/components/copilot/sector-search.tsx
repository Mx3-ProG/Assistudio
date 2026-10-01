"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Briefcase } from "lucide-react";
import { useI18n } from "@/components/providers";
import { inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { matchSectors, type SectorLike } from "@/lib/sales/sectors";
import { cn } from "@/lib/cn";

export interface SectorOption extends SectorLike { icon: string; name: string }

/**
 * "What is your prospect's job?" — instant suggestions in the browser (names +
 * admin-editable synonyms of every sector); Enter opens the resolver page.
 */
export function SectorSearch({ sectors, popular, autoFocus, initial = "" }: {
  sectors: SectorOption[]; popular: SectorOption[]; autoFocus?: boolean; initial?: string;
}) {
  const { t, locale } = useI18n();
  const S = t.cp.sector;
  const [q, setQ] = useState(initial);
  const matches = useMemo(() => matchSectors(q, sectors, 4), [q, sectors]);
  const base = `/${locale}/dashboard/sales-center`;
  return (
    <div>
      <form action={`${base}/sector`} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">{S.label}</span>
          <Briefcase className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input
            name="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={S.placeholder}
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="go"
            className={cn(inputClass, "h-13 rounded-2xl ps-11 text-[16px] shadow-sm")}
          />
        </label>
        <button className={buttonClass("accent", "lg", "h-13 rounded-2xl")}>{S.go}<ArrowRight className="flip-rtl size-4" /></button>
      </form>
      {q.trim().length >= 2 && matches.length > 0 ? (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {matches.map(({ market: m }) => (
            <li key={m.slug}>
              <Link href={`${base}/targets/${m.slug}`} className="card flex items-center gap-3 p-3 transition hover:shadow-md">
                <MarketIcon name={m.icon} className="size-5 shrink-0 text-accent" />
                <span className="flex-1 text-[15px] font-medium">{m.name}</span>
                <ArrowRight className="flip-rtl size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      ) : popular.length > 0 && (
        <div className="no-scrollbar -mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 sm:flex-wrap">
          <span className="shrink-0 text-[12px] text-muted">{S.popular}</span>
          {popular.map((m) => (
            <Link key={m.slug} href={`${base}/targets/${m.slug}`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[13px] hover:bg-surface-3">
              <MarketIcon name={m.icon} className="size-3.5 text-accent" />{m.name}
            </Link>
          ))}
          <Link href={`${base}/targets`} className="shrink-0 text-[13px] font-medium text-accent hover:underline">{S.all} →</Link>
        </div>
      )}
    </div>
  );
}
