"use client";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/components/providers";
import { EmptyState, inputClass } from "@/components/ui/primitives";
import { fmt } from "@/i18n/format";
import type { SalesContent } from "@/lib/sales/content";
import { buildIndex, search } from "@/lib/sales/search";
import { contentText } from "@/lib/sales/content";
import { trackUsage } from "@/app/actions/sales-center";
import { FavoriteButton } from "./favorite-button";
import { TrackedCopy } from "./tracked-copy";
import { FallbackBadge } from "./fallback-badge";
import { cn } from "@/lib/cn";

type Item = SalesContent<"objection"> & { fallback?: boolean };

export function ObjectionLibrary({ items, favorites, initialQuery = "" }: { items: Item[]; favorites: string[]; initialQuery?: string }) {
  const { t } = useI18n();
  const O = t.sc.objections;
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState<string | null>(null);
  const index = useMemo(() => buildIndex(items.map((o) => ({ id: o.id, kind: o.kind, key: o.key, title: o.title, tags: o.tags, text: contentText(o), href: "" }))), [items]);
  const shown = useMemo(() => {
    if (q.trim().length < 2) return items;
    const ids = search(index, q, 50).map((d) => d.id);
    return ids.map((id) => items.find((o) => o.id === id)!).filter(Boolean);
  }, [items, index, q]);
  useEffect(() => {
    const h = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- open the objection targeted by a search result link
    if (h) setOpen(h);
  }, []);

  return (
    <div className="grid gap-4">
      <div className="sticky top-16 z-20 -mx-1 bg-bg/80 px-1 py-1 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={O.search} aria-label={O.search}
            enterKeyHint="search" className={cn(inputClass, "h-12 rounded-2xl ps-11 text-[16px]")} />
        </div>
        <p className="mt-1.5 px-1 text-[12px] text-muted">{fmt(O.count, { n: shown.length })}</p>
      </div>
      {shown.length === 0 && <div className="card"><EmptyState title={t.sc.searchEmpty} /></div>}
      <ul className="grid gap-2">
        {shown.map((o) => {
          const isOpen = open === o.key;
          return (
            <li key={o.id} id={o.key} className="card scroll-mt-32 overflow-hidden">
              <div className="flex items-center gap-2 pe-2">
                <button type="button" aria-expanded={isOpen}
                  onClick={() => { setOpen(isOpen ? null : o.key); if (!isOpen) void trackUsage("content_view", { kind: "objection", key: o.key }); }}
                  className="min-w-0 flex-1 p-4 text-start sm:p-5">
                  <span className="block text-[16px] font-semibold" dir="auto">{o.body.objection}</span>
                  <span className="mt-1 block text-[13.5px] text-fg-2" dir="auto">{o.body.short}</span>
                  <FallbackBadge show={o.fallback} label={t.sc.englishFallback} />
                </button>
                <FavoriteButton kind="objection" contentKey={o.key} initial={favorites.includes(`objection:${o.key}`)} />
              </div>
              {isOpen && (
                <div className="grid gap-4 border-t border-line p-4 text-[14.5px] sm:p-5" dir="auto">
                  <Block label={O.meaning}>{o.body.meaning}</Block>
                  <Block label={O.questions}>
                    <ul className="grid gap-1.5">{o.body.questions.map((x) => <li key={x} className="rounded-xl bg-surface-2 px-3 py-2">{x}</li>)}</ul>
                  </Block>
                  <Block label={O.short}>
                    <p className="font-medium">{o.body.short}</p>
                    <TrackedCopy value={o.body.short} kind="objection" contentKey={o.key} className="mt-2" />
                  </Block>
                  <Block label={O.long}>
                    <p className="leading-relaxed">{o.body.long}</p>
                    <TrackedCopy value={o.body.long} kind="objection" contentKey={o.key} className="mt-2" />
                  </Block>
                  {o.body.proof && <Block label={O.proof}>{o.body.proof}</Block>}
                  <Block label={O.next}><p className="text-accent">{o.body.nextStep}</p></Block>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</h4>
      {typeof children === "string" ? <p>{children}</p> : children}
    </section>
  );
}
