import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { TrackedLink } from "./tracked-link";

/** "Your first commission starts with a conversation." Six steps; durations only for what the ambassador controls. */
export function FirstCommission({ t, ctaHref }: { t: Dictionary; ctaHref: string }) {
  const F = t.hc.first;
  return (
    <>
      <ol className="relative mt-8 grid gap-2.5 sm:mt-10 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
        {F.steps.map((s, i) => {
          const last = i === F.steps.length - 1;
          return (
            <li key={i} className={`card relative overflow-hidden p-4 sm:p-6 ${last ? "border-accent/40 bg-accent-soft/50" : ""}`}>
              <span className="tabular absolute -end-1 -top-5 hidden text-[96px] font-bold leading-none tracking-tighter text-fg/[0.04] sm:block" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <div className="flex items-center gap-3">
                <span className={`tabular grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${last ? "bg-gradient-to-br from-accent to-accent-2 text-white" : "bg-surface-2 text-fg"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{s.when}</span>
              </div>
              <p className="relative mt-2.5 text-[15.5px] font-medium leading-snug sm:mt-4 sm:text-[16.5px]">{s.body}</p>
            </li>
          );
        })}
      </ol>
      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted">{F.note}</p>
        <TrackedLink href={ctaHref} event="cta_click" placement="timeline" className="w-full shrink-0 sm:w-auto">
          {F.cta} <ArrowRight className="flip-rtl size-4" />
        </TrackedLink>
      </div>
    </>
  );
}
