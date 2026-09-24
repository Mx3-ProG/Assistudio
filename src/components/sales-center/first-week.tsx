"use client";
import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Notice, Progress } from "@/components/ui/primitives";
import { fmt } from "@/i18n/format";
import type { JourneyBody } from "@/lib/sales/content";
import { setProgress } from "@/app/actions/sales-center";
import { cn } from "@/lib/cn";

export const taskKey = (journey: string, day: number, i: number) => `${journey}.d${day}.t${i}`;

export function FirstWeek({ journeyKey, body, done, compact = false }: { journeyKey: string; body: JourneyBody; done: string[]; compact?: boolean }) {
  const { t } = useI18n();
  const [state, toggle] = useOptimistic(new Set(done), (cur: Set<string>, k: string) => {
    const n = new Set(cur);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });
  const [, start] = useTransition();
  const all = body.days.flatMap((d) => d.tasks.map((_, i) => taskKey(journeyKey, d.day, i)));
  const count = all.filter((k) => state.has(k)).length;
  const days = compact ? body.days.filter((d) => d.tasks.some((_, i) => !state.has(taskKey(journeyKey, d.day, i)))).slice(0, 1) : body.days;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Progress value={count} max={all.length} className="flex-1" />
        <span className="tabular text-[13px] text-muted">{fmt(t.sc.firstWeek.progress, { done: count, total: all.length })}</span>
      </div>
      <ol className="grid gap-3">
        {days.map((d) => (
          <li key={d.day} className={cn(!compact && "card p-4 sm:p-5")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{fmt(t.sc.firstWeek.day, { n: d.day })}</p>
            <p className="mt-0.5 text-[16px] font-semibold">{d.title}</p>
            {!compact && <p className="mt-1 text-[14px] text-fg-2">{d.body}</p>}
            <ul className="mt-3 grid gap-1.5">
              {d.tasks.map((task, i) => {
                const k = taskKey(journeyKey, d.day, i);
                const on = state.has(k);
                return (
                  <li key={k}>
                    <button type="button" aria-pressed={on} onClick={() => start(async () => { toggle(k); await setProgress(k, !on); })}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start text-[14.5px] hover:bg-surface-2">
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border-2", on ? "border-success bg-success text-white" : "border-line")}>
                        {on && <Check className="size-3" />}
                      </span>
                      <span className={cn(on && "text-muted line-through")}>{task}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      {!compact && <Notice>{body.disclaimer}</Notice>}
    </div>
  );
}
