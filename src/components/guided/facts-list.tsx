"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge, inputClass } from "@/components/ui/primitives";
import { normalize } from "@/lib/sales/search";
import { cn } from "@/lib/cn";

export interface FactItem { key: string; category: string; question: string; answer: string; level: number }
const TONE = { 1: "success", 2: "accent", 3: "warning" } as const;

/** Official answers, filterable in the browser, each with its answer level. */
export function FactsList({ facts }: { facts: FactItem[] }) {
  const { t } = useI18n();
  const F = t.gd.facts;
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const n = normalize(q);
    return n.length < 2 ? facts : facts.filter((f) => normalize(`${f.question} ${f.answer}`).includes(n));
  }, [facts, q]);
  return (
    <div className="grid gap-3">
      <label className="relative">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={F.search} aria-label={F.search} className={cn(inputClass, "h-12 rounded-2xl ps-11")} />
      </label>
      <ul className="grid gap-3 md:grid-cols-2">
        {shown.map((f) => {
          const level = (f.level as 1 | 2 | 3) ?? 1;
          return (
            <li key={f.key} id={f.key} className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{F.categories[f.category as keyof typeof F.categories] ?? f.category}</Badge>
                <Badge tone={TONE[level]}>{level}. {F.levels[level]}</Badge>
              </div>
              <h3 className="mt-2 font-semibold">{f.question}</h3>
              <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-fg-2">{f.answer}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
