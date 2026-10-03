import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import type { ActivationFunnel as Funnel } from "@/lib/data/types";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { FUNNEL_EVENTS } from "@/lib/analytics/events";

/**
 * Activation funnel (staff): the main metric is not sign-ups but what happens
 * next — link copied, first prospect, first hand-over, opportunities → sales.
 */
export function ActivationFunnel({ t, locale, data, days }: { t: Dictionary; locale: Locale; data: Funnel; days: number }) {
  const A = t.hc.admin;
  const pct = (n: number, of: number) => (of > 0 ? formatPercent(n / of, locale, 0) : A.none);
  const delay = (h: number | null) => (h === null ? A.none : h >= 48 ? fmt(A.days, { n: formatNumber(Math.round(h / 24), locale) }) : fmt(A.hours, { n: formatNumber(h, locale) }));
  const rows: [string, string, string?][] = [
    [A.signups, formatNumber(data.signups, locale)],
    [A.linkCopied, pct(data.link_copied, data.signups), formatNumber(data.link_copied, locale)],
    [A.firstProspect, pct(data.first_prospect, data.signups), formatNumber(data.first_prospect, locale)],
    [A.firstHandoff, pct(data.first_handoff, data.signups), formatNumber(data.first_handoff, locale)],
    [A.opportunities, pct(data.opportunities_won, data.opportunities), `${formatNumber(data.opportunities_won, locale)} / ${formatNumber(data.opportunities, locale)}`],
    [A.medianAction, delay(data.median_hours_first_action)],
    [A.medianProspect, delay(data.median_hours_first_prospect)],
    [A.revenuePerActive, data.active_ambassadors > 0 ? formatMoney(Math.round(data.revenue_cents / data.active_ambassadors), locale) : A.none,
      fmt(A.activeHint, { n: formatNumber(data.active_ambassadors, locale) })],
  ];
  return (
    <section>
      <h2 className="font-semibold">{A.title}</h2>
      <p className="mt-1 text-[13px] text-muted">{fmt(A.subtitle, { days })}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {rows.map(([label, value, hint]) => (
          <div key={label} className="card p-4">
            <dt className="text-[12.5px] text-muted">{label}</dt>
            <dd className="tabular mt-1 text-[22px] font-semibold tracking-[-0.02em]">{value}</dd>
            {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
          </div>
        ))}
      </dl>
      <details className="mt-3">
        <summary className="cursor-pointer text-[13px] font-medium text-muted">{A.events}</summary>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {FUNNEL_EVENTS.map((e) => (
            <li key={e} className="rounded-full border border-line px-2.5 py-1 font-mono text-[12px]">{e}: {formatNumber(data.events[e] ?? 0, locale)}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
