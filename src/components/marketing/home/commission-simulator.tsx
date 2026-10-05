"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers";
import { computeCommissionCents } from "@/lib/commission";
import { formatMoney, formatNumber } from "@/lib/money";
import { convertCurrency } from "@/i18n/currency";
import { fmt } from "@/i18n/format";
import { trackOnce } from "@/lib/analytics/client";
import type { OfferTier } from "@/lib/offers";
import { cn } from "@/lib/cn";
import { TrackedLink } from "./tracked-link";

/** An annual or one-time offer, as listed by repo().listOffers(). */
export interface SimOffer {
  tier: OfferTier;
  name: string;
  priceCents: number;
  currency: string;
  interval: "month" | "year" | "one_time";
  rate: number;
}

const CLIENTS = [1, 3, 5, 10, 20];

/**
 * Commission simulator: offer × number of clients → value of the sales, commissions on the
 * first payment and the yearly recurring commission (annual offers only).
 * Pure arithmetic from `public.offers`; never a promise.
 */
export function CommissionSimulator({ offers, ctaHref }: { offers: SimOffer[]; ctaHref: string }) {
  const { t, locale, currency } = useI18n();
  const S = t.hc.sim;
  const [tier, setTier] = useState<OfferTier>(offers.at(-1)?.tier ?? "premium");
  const [clients, setClients] = useState(3);
  const offer = offers.find((o) => o.tier === tier) ?? offers[0];
  if (!offer) return null;

  const money = (cents: number) => formatMoney(convertCurrency(cents, offer.currency, currency), locale, currency);
  // Annual offers pay the same commission again on each paid renewal; a one-time offer never renews.
  const perSale = computeCommissionCents(offer.priceCents, offer.rate);
  const recurring = offer.interval !== "one_time";
  const interact = () => trackOnce("simulator", "commission_simulator_interaction", { placement: "simulator" });
  const chip = (on: boolean) => cn(
    "h-11 rounded-full border px-4 text-[14px] font-medium transition",
    on ? "border-accent bg-accent text-accent-fg shadow-[0_8px_20px_-10px_var(--accent)]" : "border-line bg-surface hover:bg-surface-2",
  );

  return (
    <div className="card p-4 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset>
          <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{S.offerLabel}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {offers.map((o) => (
              <button key={o.tier} type="button" aria-pressed={o.tier === tier} className={chip(o.tier === tier)}
                onClick={() => { setTier(o.tier); interact(); }}>
                {o.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{S.clientsLabel}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {CLIENTS.map((n) => (
              <button key={n} type="button" aria-pressed={n === clients} className={cn(chip(n === clients), "tabular min-w-11 px-3")}
                onClick={() => { setClients(n); interact(); }}>
                {formatNumber(n, locale)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <dl aria-live="polite" className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-3">
        <div className="rounded-2xl bg-surface-2 p-4 sm:p-5">
          <dt className="text-[13px] text-muted">{S.salesValue}</dt>
          <dd className="tabular mt-1 text-[24px] font-semibold tracking-[-0.03em] sm:text-[30px]">{money(clients * offer.priceCents)}</dd>
          <p className="mt-1 text-[12px] text-muted">{fmt(S.salesHint, { n: formatNumber(clients, locale), offer: offer.name })}</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-4 sm:p-5">
          <dt className="text-[13px] text-muted">{S.commission}</dt>
          <dd className="tabular mt-1 text-[24px] font-semibold tracking-[-0.03em] sm:text-[30px]">{money(clients * perSale)}</dd>
          <p className="mt-1 text-[12px] text-muted">{S.commissionHint}</p>
        </div>
        <div className={cn("col-span-2 rounded-2xl p-4 sm:col-span-1 sm:p-5", recurring ? "bg-gradient-to-br from-accent to-accent-2 text-white" : "bg-surface-2")}>
          <dt className={cn("text-[13px]", recurring ? "text-white/80" : "text-muted")}>{S.recurrence}</dt>
          {recurring ? (
            <>
              <dd className="tabular mt-1 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">{money(clients * perSale)}<span className="text-[15px] font-medium opacity-80"> {S.perYear}</span></dd>
              <p className="mt-1 text-[12px] text-white/80">{S.recurrenceHint}</p>
            </>
          ) : <dd className="mt-2 text-[15px] font-medium text-fg-2">{S.recurrenceNone}</dd>}
        </div>
      </dl>

      {/* The original ladder, kept as a visual: the selected count stands out. */}
      <div className="mt-6 hidden grid-cols-5 items-end gap-2 sm:grid sm:gap-3" aria-hidden>
        {CLIENTS.map((n) => {
          const h = 8 + (n / CLIENTS.at(-1)!) * 92; // linear: the bars show proportionality, not a curve
          return (
            <div key={n} className="flex flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end sm:h-32">
                <div className={cn("w-full rounded-xl bg-gradient-to-t from-accent to-accent-2 transition-[height,opacity] duration-500", n === clients ? "opacity-100" : "opacity-30")} style={{ height: `${h}%` }} />
              </div>
              <span className={cn("tabular text-[12px]", n === clients ? "font-semibold" : "text-muted")}>{formatNumber(n, locale)}</span>
            </div>
          );
        })}
      </div>

      <div data-cta className="mt-8 flex flex-col items-start gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[12.5px] leading-relaxed text-muted">{S.disclaimer}</p>
        <TrackedLink href={ctaHref} event="cta_click" placement="simulator" className="w-full shrink-0 sm:w-auto">
          {t.hc.cta} <ArrowRight className="flip-rtl size-4" />
        </TrackedLink>
      </div>
    </div>
  );
}
