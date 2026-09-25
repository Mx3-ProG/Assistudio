import { Check, Minus } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { Offer } from "@/lib/data/types";
import { fmt } from "@/i18n/format";
import { formatMoney, formatPercent } from "@/lib/money";
import { firstSaleCommissionCents, maxEarningOffer, renews } from "@/lib/offers";
import { cn } from "@/lib/cn";
import { HoloCard } from "./holo-card";

/** Glow and tint of each card (the cards are always dark, see .holo-card). */
const HOLO: Record<Offer["tier"], { glow: string; gradient: string }> = {
  one: { glow: "rgb(113 196 255 / 0.45)", gradient: "linear-gradient(145deg, rgb(71 85 105 / 0.45) 0%, rgb(113 196 255 / 0.12) 100%)" },
  pro: { glow: "rgb(91 124 255 / 0.75)", gradient: "linear-gradient(145deg, rgb(96 73 110 / 0.55) 0%, rgb(91 124 255 / 0.35) 100%)" },
  premium: { glow: "rgb(168 132 255 / 0.5)", gradient: "linear-gradient(145deg, rgb(88 60 130 / 0.5) 0%, rgb(113 196 255 / 0.18) 100%)" },
};

/**
 * The three offers side by side: One · Pro · Premium, with Pro in the middle
 * and larger. Prices come from the offers, never from copy.
 */
export function PricingPlans({ t, locale, offers, page, requestHref, requestLabel }: {
  t: Dictionary;
  locale: Locale;
  offers: Offer[];
  /** Private sales page slug, carried to checkout for attribution. */
  page?: string;
  requestHref: string;
  requestLabel: string;
}) {
  const P = t.pricing;
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.2fr_1fr] lg:gap-5">
      {offers.map((o) => {
        const plan = P.plans[o.tier];
        const featured = o.tier === "pro";
        const buy = `/${locale}/buy?offer=${o.tier}${page ? `&page=${page}` : ""}`;
        return (
          <HoloCard key={o.id} glow={HOLO[o.tier].glow} gradient={HOLO[o.tier].gradient}
            className={cn(featured ? "lg:z-10" : "lg:my-10")}>
            <article className={cn("flex h-full flex-col", featured ? "p-8 sm:p-10" : "p-7 sm:p-8")}>
              <p className={cn("w-fit rounded-full px-3 py-1 text-[12px] font-semibold",
                featured ? "bg-accent text-accent-fg" : "border border-white/15 bg-white/10 text-white/85")}>{plan.badge}</p>
              <h3 className={cn("mt-5 font-semibold tracking-tight", featured ? "text-[30px]" : "text-[24px]")}>{plan.name}</h3>
              <p className="mt-2 min-h-[3em] text-[14px] leading-relaxed text-white/70">{plan.tagline}</p>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <span className={cn("tabular font-semibold tracking-[-0.04em]", featured ? "text-[56px]" : "text-[44px]")}>
                  {formatMoney(o.priceCents, locale, o.currency)}
                </span>
                <span className="text-white/65">{renews(o) ? P.perYear : P.oneTime}</span>
              </p>
              <div className="holo-frame mt-6 p-5">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[15px] text-white/90">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
                {plan.excluded.length > 0 && (
                  <>
                    <p className="mt-5 border-t border-white/10 pt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">{P.notIncluded}</p>
                    <ul className="mt-3 space-y-3">
                      {plan.excluded.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-[14px] text-white/70">
                          <Minus className="mt-0.5 size-4 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="mt-auto pt-8">
                <a href={buy}
                  className={cn("flex h-12 items-center justify-center rounded-full text-[15px] font-medium transition",
                    featured ? "bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] hover:brightness-110" : "bg-white text-black hover:bg-white/90")}>
                  {fmt(P.choose, { name: plan.name })}
                </a>
                <a href={requestHref} className="mt-3 flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[15px] font-medium text-white backdrop-blur hover:bg-white/10">
                  {requestLabel}
                </a>
              </div>
            </article>
          </HoloCard>
        );
      })}
    </div>
  );
}

/**
 * What each offer pays a partner under the existing rules: the direct rate and
 * the direct-sponsor rate, applied to each offer's price. Annual offers pay it
 * again on each paid renewal; the one-time offer pays once.
 */
export function PartnerCommissionTable({ t, locale, offers, directRate, sponsorRate }: {
  t: Dictionary;
  locale: Locale;
  offers: Offer[];
  directRate: number;
  sponsorRate: number;
}) {
  const P = t.pricing;
  const pct = (r: number) => formatPercent(r, locale, 0);
  const best = maxEarningOffer(offers).id;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-start text-[14px]">
        <thead>
          <tr className="border-b border-line text-[12px] uppercase tracking-[0.1em] text-muted">
            <th className="px-5 py-4 text-start font-semibold">{P.colOffer}</th>
            <th className="px-5 py-4 text-end font-semibold">{P.colPrice}</th>
            <th className="px-5 py-4 text-end font-semibold">{fmt(P.colDirect, { rate: pct(directRate) })}</th>
            <th className="px-5 py-4 text-end font-semibold">{fmt(P.colSponsor, { rate: pct(sponsorRate) })}</th>
            <th className="px-5 py-4 text-start font-semibold">{P.colRenewal}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {offers.map((o) => (
            <tr key={o.id} className={cn(o.id === best && "bg-accent-soft/60")}>
              <td className="px-5 py-4 font-semibold">
                {P.plans[o.tier].name}
                {o.id === best && <span className="ms-2 inline-block whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg">{P.maxBadge}</span>}
              </td>
              <td className="tabular whitespace-nowrap px-5 py-4 text-end">
                {formatMoney(o.priceCents, locale, o.currency)} <span className="text-muted">{renews(o) ? P.perYear : P.oneTime}</span>
              </td>
              <td className="tabular px-5 py-4 text-end text-[16px] font-semibold">{formatMoney(firstSaleCommissionCents(o, directRate), locale, o.currency)}</td>
              <td className="tabular whitespace-nowrap px-5 py-4 text-end">{formatMoney(firstSaleCommissionCents(o, sponsorRate), locale, o.currency)}</td>
              <td className="px-5 py-4 text-muted">{renews(o) ? P.renewalEach : P.renewalNone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
