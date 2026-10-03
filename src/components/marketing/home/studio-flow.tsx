import { Globe, Inbox, Users, CalendarDays, Mail, Repeat, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/i18n/types";

const ICONS = [Globe, Inbox, Users, CalendarDays, Mail, Repeat, BarChart3];

/** Studio in 30 seconds: one chain from the website to the signed client. Vertical on mobile, one row on desktop. */
export function StudioFlow({ t }: { t: Dictionary }) {
  const S = t.hc.sell;
  return (
    <figure className="card overflow-hidden p-4 sm:p-6">
      <figcaption className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{S.flowLabel}</figcaption>
      <ol className="grid gap-1 lg:grid-cols-7 lg:gap-2">
        {S.flow.map((step, i) => {
          const Icon = ICONS[i] ?? Globe;
          const last = i === S.flow.length - 1;
          return (
            <li key={step.title} className="relative flex gap-3 lg:flex-col lg:gap-0">
              <div className="flex flex-col items-center lg:flex-row">
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${last ? "bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_10px_24px_-12px_var(--accent)]" : "bg-accent-soft text-accent"}`}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                {!last && (
                  <>
                    <ChevronDown className="my-0.5 size-4 text-muted/60 lg:hidden" aria-hidden />
                    <span className="mx-1 hidden h-px flex-1 bg-gradient-to-r from-accent/40 to-line lg:block" aria-hidden />
                    <ChevronRight className="flip-rtl hidden size-4 shrink-0 text-muted/60 lg:block" aria-hidden />
                  </>
                )}
              </div>
              <div className="min-w-0 pb-2 pt-1.5 lg:pe-2 lg:pt-3">
                <p className="text-[15px] font-semibold leading-tight">{step.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
