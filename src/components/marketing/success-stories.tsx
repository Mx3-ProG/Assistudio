import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { computeCommissionCents } from "@/lib/commission";
import { formatMoney } from "@/lib/money";

/**
 * Seven illustrative partner scenarios. Every amount is computed from the
 * offer (sales × commission) — the copy only carries the number of sales.
 * Each card is labelled as illustrative: these are not customer testimonials.
 */
export function SuccessStories({ t, locale, priceCents, rate }: { t: Dictionary; locale: Locale; priceCents: number; rate: number }) {
  const H = t.home;
  const commission = computeCommissionCents(priceCents, rate);
  const money = (c: number) => formatMoney(c, locale);

  return (
    <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {H.stories.map((s, i) => {
        const total = s.sales * commission;
        const suffix = s.period === "month" ? ` ${H.storiesPerMonth}` : s.period === "year" ? ` ${H.storiesPerYear}` : "";
        const initials = s.name.split(/[\s,]+/)[0].slice(0, 1);
        return (
          <li key={s.name} className={`card flex flex-col p-6 sm:p-7 ${i === 6 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[16px] font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{s.name}</p>
                <p className="truncate text-[12px] text-muted">{s.role}</p>
              </div>
            </div>
            <h3 className="mt-5 text-[19px] font-semibold leading-snug tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-2 flex-1 text-[14px] leading-relaxed text-fg-2">
              {fmt(s.body, { commission: money(commission), total: money(total) })}
            </p>
            <div className="mt-5 rounded-2xl bg-surface-2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{H.storiesMath}</p>
              <p className="tabular mt-1 text-[14px] text-fg-2">
                {s.sales} × {money(commission)} ={" "}
                <span className="text-[20px] font-semibold tracking-[-0.02em] text-fg">{money(total)}</span>
                <span className="text-muted">{suffix}</span>
              </p>
              {s.period === "month" && (
                <p className="tabular mt-0.5 text-[12px] text-muted">{fmt(H.storiesYearly, { amount: money(total * 12) })}</p>
              )}
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted">{H.storiesBadge}</p>
          </li>
        );
      })}
    </ul>
  );
}
