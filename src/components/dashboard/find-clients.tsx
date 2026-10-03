"use client";
import Link from "next/link";
import { useState } from "react";
import { useStored } from "@/lib/hooks/use-stored";
import { Search, Lightbulb, ListChecks, ExternalLink, Plug, Users, Check } from "lucide-react";
import { useI18n } from "@/components/providers";
import { CopyButton } from "@/components/ui/copy-button";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { marketContent, type Market } from "@/content/markets";
import { cn } from "@/lib/cn";

export function FindClients({ markets, savedCount }: { markets: Market[]; savedCount: number }) {
  const { t, locale } = useI18n();
  const F = t.dash.find;
  const [active, setActive] = useState(markets[0]?.id);
  const [raw, setRaw] = useStored("studio-checklist", "[]");
  const m = markets.find((x) => x.id === active) ?? markets[0];
  const c = m ? marketContent(m, locale) : null;

  let done: number[] = [];
  try { done = JSON.parse(raw ?? "[]"); } catch {}
  const toggle = (i: number) => setRaw(JSON.stringify(done.includes(i) ? done.filter((x) => x !== i) : [...done, i]));

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="mb-3 text-[15px] font-semibold">{F.marketsTitle}</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {markets.map((x) => (
            <button key={x.id} onClick={() => setActive(x.id)} aria-pressed={active === x.id}
              className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition",
                active === x.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-fg-2 hover:text-fg")}>
              <MarketIcon name={x.icon} className="size-4" />
              {marketContent(x, locale).name}
            </button>
          ))}
        </div>
      </section>

      {m && c && (
        <section className="card grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><MarketIcon name={m.icon} className="size-5" /></span>
              <h3 className="text-[20px] font-semibold tracking-tight">{c.name}</h3>
            </div>
            <dl className="mt-5 grid gap-4">
              {([[t.home.marketWho, c.who], [t.home.marketWhy, c.why], [t.home.marketProblem, c.problem], [t.home.marketAngle, c.angle]] as const).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{k}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-fg-2">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid content-start gap-5">
            <div className="rounded-2xl bg-surface-2 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{t.home.marketMessage}</span>
                <CopyButton track="sales_script_copied" value={c.message} />
              </div>
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{c.message}</p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-[13px] font-semibold"><Search className="size-4 text-accent" />{F.searchTitle}</p>
              <p className="mt-0.5 text-[12px] text-muted">{F.searchHint}</p>
              <ul className="mt-3 grid gap-2">
                {c.searches.map((s) => (
                  <li key={s} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                    <code className="min-w-0 flex-1 truncate text-[13px]">{s}</code>
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(s.replace(/\[[^\]]*\]/g, "").trim())}`} target="_blank" rel="noopener noreferrer"
                      className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg" aria-label="Google Maps">
                      <ExternalLink className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Lightbulb className="size-4 text-accent" />{F.ideasTitle}</h2>
          <ul className="mt-4 grid gap-3">
            {F.ideas.map((i) => <li key={i} className="rounded-xl bg-surface-2 p-3 text-[14px] leading-relaxed text-fg-2">{i}</li>)}
          </ul>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><ListChecks className="size-4 text-accent" />{F.checklistTitle}</h2>
          <ul className="mt-4 grid gap-1">
            {F.checklist.map((item, i) => (
              <li key={item}>
                <button onClick={() => toggle(i)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-surface-2">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", done.includes(i) ? "border-success bg-success text-white" : "border-line-strong")}>
                    {done.includes(i) && <Check className="size-3.5" />}
                  </span>
                  <span className={cn("text-[14px]", done.includes(i) && "text-muted line-through")}>{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link href={`/${locale}/dashboard/prospects`} className="card flex items-center gap-4 p-5 transition hover:shadow-md">
          <Users className="size-5 text-accent" />
          <span className="flex-1 text-[14px] font-medium">{F.savedTitle}</span>
          <span className="tabular text-[20px] font-semibold">{savedCount}</span>
        </Link>
        <div className="card flex items-center gap-4 border-dashed p-5">
          <Plug className="size-5 text-muted" />
          <span className="text-[13px] text-muted">{F.providersNote}</span>
        </div>
      </div>
    </div>
  );
}
