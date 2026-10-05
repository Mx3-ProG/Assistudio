import { LayoutDashboard, UserPlus, ListChecks, BadgeCheck, Wallet, PlayCircle } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { TrackedLink } from "./tracked-link";

const ICONS = [LayoutDashboard, UserPlus, ListChecks, BadgeCheck, Wallet];

/**
 * Hero visual: the real path inside the partner space, dashboard → commission.
 * A diagram of the steps, never fake screens or figures. When the recorded tour
 * exists (src/content/partner-demo.ts), a button leads to it (#demo).
 */
export function PartnerJourney({ t, demoHref }: { t: Dictionary; demoHref?: string }) {
  const D = t.hc.hero.demo;
  return (
    <figure className="glass relative overflow-hidden rounded-[28px] p-5 shadow-soft sm:p-7">
      <div className="pointer-events-none absolute -end-20 -top-24 size-64 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <figcaption className="relative">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{D.label}</p>
        <p className="mt-1.5 text-[19px] font-semibold leading-snug tracking-[-0.01em] sm:text-[21px]">{D.title}</p>
      </figcaption>
      <ol className="relative mt-5 grid gap-1">
        {D.steps.map((s, i) => {
          const Icon = ICONS[i] ?? LayoutDashboard;
          const last = i === D.steps.length - 1;
          return (
            <li key={s.title} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${last ? "bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_10px_24px_-12px_var(--accent)]" : "bg-accent-soft text-accent"}`}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                {!last && <span className="my-1 w-px flex-1 bg-gradient-to-b from-accent/40 to-line" aria-hidden />}
              </div>
              <div className={`min-w-0 ${last ? "" : "pb-3"} pt-1`}>
                <p className="text-[15px] font-semibold leading-tight">{s.title}</p>
                <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {demoHref && (
        <div className="relative mt-5">
          <TrackedLink href={demoHref} event="see_product_click" placement="hero_demo" variant="secondary" size="md" className="w-full">
            <PlayCircle className="size-4" aria-hidden />{D.watch}
          </TrackedLink>
        </div>
      )}
    </figure>
  );
}
