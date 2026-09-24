"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, RotateCcw, UserPlus } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Progress } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmt } from "@/i18n/format";
import type { CallScriptBody } from "@/lib/sales/content";
import { personalize } from "@/lib/sales/personalize";
import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  opening: "text-accent", question: "text-accent", listen: "text-muted", problem: "text-danger",
  response: "text-success", objection: "text-warning", answer: "text-success", cta: "text-accent",
};

/** Readable during a live call: one short line per step, big tap targets, local ticks only. */
export function CallScript({ body, advisorName, prospectHref }: { body: CallScriptBody; advisorName: string; prospectHref: string }) {
  const { t } = useI18n();
  const C = t.sc.calls;
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setDone((d) => { const n = new Set(d); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const labels = t.sc.messages.vars;
  return (
    <div className="grid gap-4">
      <div className="card sticky top-16 z-20 flex items-center gap-3 p-3 sm:p-4">
        <Progress value={done.size} max={body.steps.length} className="flex-1" />
        <span className="tabular shrink-0 text-[13px] text-muted">{fmt(C.progress, { done: done.size, total: body.steps.length })}</span>
        <button type="button" onClick={() => setDone(new Set())} className={buttonClass("ghost", "sm")} aria-label={C.reset}><RotateCcw className="size-4" /></button>
      </div>
      {body.intro && <p className="text-[14px] text-muted">{body.intro}</p>}
      <ol className="grid gap-2">
        {body.steps.map((s, i) => (
          <li key={i}>
            <button type="button" onClick={() => toggle(i)} aria-pressed={done.has(i)}
              className={cn("card flex w-full items-start gap-3 p-4 text-start transition sm:p-5", done.has(i) && "opacity-55")}>
              <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", done.has(i) ? "border-success bg-success text-white" : "border-line")}>
                {done.has(i) && <Check className="size-3.5" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[11px] font-semibold uppercase tracking-[0.12em]", TONE[s.type])}>{C.types[s.type]}</span>
                <span className="mt-1 block text-[17px] leading-snug" dir="auto">{personalize(s.text, { advisorName }, labels).text}</span>
                {s.hint && <span className="mt-1 block text-[13px] text-muted">{s.hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <p className="flex-1 text-[14px] font-medium">{C.after}</p>
        <Link href={prospectHref} className={buttonClass("primary", "md")}><UserPlus className="size-4" />{C.logProspect}</Link>
      </div>
    </div>
  );
}
