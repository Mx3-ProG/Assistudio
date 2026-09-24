import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { computeCommissionCents } from "@/lib/commission";
import { formatMoney, formatPercent } from "@/lib/money";

/** Revenue steps shown (cents). Commission is computed, never written in copy. */
const REVENUE_STEPS = [60_000_00, 300_000_00, 1_000_000_00];

export function UncappedBand({ t, locale, rate }: { t: Dictionary; locale: Locale; rate: number }) {
  const H = t.home;
  const money = (c: number) => formatMoney(c, locale);
  const top = REVENUE_STEPS[REVENUE_STEPS.length - 1];

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-fg px-6 py-14 text-bg sm:px-12 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_100%_0%,var(--accent),transparent)] opacity-60" />
      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] opacity-60">{H.uncappedEyebrow}</p>
          <h2 className="display mt-3 text-[38px] sm:text-[60px]">
            {H.uncappedTitle}
            <br />
            <span className="opacity-60">{H.uncappedTitle2}</span>
          </h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed opacity-75">
            {fmt(H.uncappedSubtitle, { rate: formatPercent(rate, locale, 0) })}
          </p>
        </div>
        <div>
          <ul className="grid gap-2">
            {REVENUE_STEPS.map((rev) => {
              const isTop = rev === top;
              return (
                <li
                  key={rev}
                  className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${isTop ? "bg-bg text-fg" : "bg-bg/10"}`}
                >
                  <div>
                    <p className={`text-[11px] uppercase tracking-[0.12em] ${isTop ? "text-muted" : "opacity-60"}`}>{H.uncappedYouBring}</p>
                    <p className="tabular text-[18px] font-semibold sm:text-[22px]">{money(rev)}</p>
                  </div>
                  <div className="text-end">
                    <p className={`text-[11px] uppercase tracking-[0.12em] ${isTop ? "text-muted" : "opacity-60"}`}>{H.uncappedYouKeep}</p>
                    <p className={`tabular font-semibold tracking-[-0.03em] ${isTop ? "text-gradient text-[30px] sm:text-[38px]" : "text-[22px] sm:text-[26px]"}`}>
                      {money(computeCommissionCents(rev, rate))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-[15px] font-medium">
            {fmt(H.uncappedHeadline, { revenue: money(top), commission: money(computeCommissionCents(top, rate)) })}
          </p>
        </div>
      </div>
      <p className="relative mt-10 max-w-2xl text-[11px] leading-relaxed opacity-50">{t.common.illustrationOnly}</p>
    </div>
  );
}
