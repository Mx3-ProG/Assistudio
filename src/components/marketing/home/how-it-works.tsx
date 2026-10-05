import type { Dictionary } from "@/i18n/types";

/** "From sign-up to your first commission": four steps, no paragraphs. */
export function HowItWorks({ t }: { t: Dictionary }) {
  const H = t.hc.how;
  return (
    <>
      <ol className="relative mt-8 grid gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {H.steps.map((s, i) => {
          const last = i === H.steps.length - 1;
          return (
            <li key={s.title} className={`card relative overflow-hidden p-5 sm:p-6 ${last ? "border-accent/40 bg-accent-soft/50" : ""}`}>
              <span className="tabular absolute -end-1 -top-5 hidden text-[96px] font-bold leading-none tracking-tighter text-fg/[0.04] sm:block" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              <span className={`tabular grid size-9 place-items-center rounded-full text-[13px] font-semibold ${last ? "bg-gradient-to-br from-accent to-accent-2 text-white" : "bg-surface-2 text-fg"}`}>{String(i + 1).padStart(2, "0")}</span>
              <p className="relative mt-3 text-[17px] font-semibold leading-snug sm:mt-4">{s.title}</p>
              <p className="relative mt-1.5 text-[14.5px] leading-snug text-muted">{s.body}</p>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-muted">{H.note}</p>
    </>
  );
}
