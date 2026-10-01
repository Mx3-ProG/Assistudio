"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useI18n } from "@/components/providers";
import { inputClass } from "@/components/ui/primitives";
import { normalize } from "@/lib/sales/search";
import { fmt } from "@/i18n/format";
import type { SalesContent } from "@/lib/sales/content";

export function SignalLibrary({ items }: { items: SalesContent<"signal">[] }) {
  const { t } = useI18n();
  const S = t.cp.signals;
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const words = normalize(q).split(" ").filter(Boolean);
    if (!words.length) return items;
    return items.filter((x) => {
      const hay = normalize([x.title, ...x.tags, ...Object.values(x.body)].join(" "));
      return words.every((word) => hay.includes(word));
    });
  }, [items, q]);
  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.search} aria-label={S.search}
          className={`${inputClass} h-13 rounded-2xl ps-11 text-[16px]`} />
      </div>
      <p className="text-[12px] text-muted">{fmt(S.count, { n: shown.length })}</p>
      {shown.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((x) => (
            <details key={x.id} id={x.key} className="card group p-5 open:border-accent/30">
              <summary className="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><ArrowRight className="size-4 transition group-open:rotate-90" /></span>
                <span className="pt-1 text-[16px] font-semibold leading-snug">{x.body.signal}</span>
              </summary>
              <dl className="mt-5 grid gap-4 border-t border-line pt-4 text-[14px]">
                {([[S.problem, x.body.problem], [S.question, x.body.question], [S.studio, x.body.studio], [S.proof, x.body.proof], [S.next, x.body.next]] as const).map(([label, value]) => (
                  <div key={label}><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt><dd className="mt-1 leading-relaxed text-fg-2">{value}</dd></div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      ) : <div className="card p-6 text-[14px] text-muted">{S.empty}</div>}
    </>
  );
}
