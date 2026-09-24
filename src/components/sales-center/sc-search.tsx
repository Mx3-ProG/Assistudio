"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { buildIndex, search, excerpt, type SearchDoc } from "@/lib/sales/search";
import { Badge, inputClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** Instant, client-side search across every published Sales Center item. */
export function SalesSearch({ docs, autoFocus }: { docs: SearchDoc[]; autoFocus?: boolean }) {
  const { t } = useI18n();
  const index = useMemo(() => buildIndex(docs), [docs]);
  const [q, setQ] = useState("");
  const results = useMemo(() => search(index, q, 12), [index, q]);
  const kinds = t.sc.kinds as Record<string, string>;
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.sc.searchPlaceholder}
        aria-label={t.sc.searchPlaceholder}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className={cn(inputClass, "h-13 rounded-2xl ps-11 pe-10 text-[16px] shadow-sm")}
      />
      {q && (
        <button type="button" onClick={() => setQ("")} className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-surface-2 text-muted" aria-label={t.common.close}>
          <X className="size-3.5" />
        </button>
      )}
      {q.trim().length >= 2 && (
        <div className="card absolute inset-x-0 top-full z-30 mt-2 max-h-[65dvh] overflow-y-auto p-1.5 shadow-lift">
          {results.length === 0 ? (
            <p className="p-4 text-[14px] text-muted">{t.sc.searchEmpty}</p>
          ) : (
            <ul className="grid gap-0.5">
              {results.map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="block rounded-xl px-3 py-2.5 hover:bg-surface-2">
                    <span className="flex items-center gap-2">
                      <Badge tone={r.kind === "objection" ? "warning" : "accent"}>{kinds[r.kind] ?? r.kind}</Badge>
                      <span className="truncate text-[14px] font-medium">{r.title}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[12.5px] text-muted">{excerpt(r.text, q)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
