import { Check, ChevronDown, Minus, Wrench } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { Offer } from "@/lib/data/types";
import { fmt } from "@/i18n/format";
import { formatPercent } from "@/lib/money";
import { Money } from "@/components/ui/money";
import { firstSaleCommissionCents, maxEarningOffer, renews } from "@/lib/offers";
import { cn } from "@/lib/cn";
import { HoloCard } from "./holo-card";

const HOLO: Record<Offer["tier"], { glow: string; gradient: string }> = {
  one: { glow: "rgb(113 196 255 / 0.45)", gradient: "linear-gradient(145deg, rgb(71 85 105 / 0.45) 0%, rgb(113 196 255 / 0.12) 100%)" },
  pro: { glow: "rgb(91 124 255 / 0.75)", gradient: "linear-gradient(145deg, rgb(96 73 110 / 0.55) 0%, rgb(91 124 255 / 0.35) 100%)" },
  premium: { glow: "rgb(168 132 255 / 0.5)", gradient: "linear-gradient(145deg, rgb(88 60 130 / 0.5) 0%, rgb(113 196 255 / 0.18) 100%)" },
};

function MoneyTemplate({ template, cents, currency }: { template: string; cents: number; currency: string }) {
  const [before, after = ""] = template.split("{price}");
  return <>{before}<Money cents={cents} sourceCurrency={currency} />{after}</>;
}

function OfferPrice({ offer, t, featured = false, dark = true }: {
  offer: Offer; locale: Locale; t: Dictionary; featured?: boolean; dark?: boolean;
}) {
  const P = t.pricing;
  if (!renews(offer)) {
    return <div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Money cents={offer.priceCents} sourceCurrency={offer.currency} className={cn("tabular font-semibold tracking-[-0.04em]", featured ? "text-[44px] sm:text-[56px]" : "text-[38px] sm:text-[44px]")} />
        <span className={dark ? "text-white/65" : "text-muted"}>{P.oneTime}</span>
      </p>
      <p className="mt-1 text-[13px] font-semibold text-emerald-400">{P.noSubscription}</p>
    </div>;
  }
  if (offer.interval === "month") {
    return <div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <Money cents={offer.priceCents} sourceCurrency={offer.currency} className={cn("tabular font-semibold tracking-[-0.04em]", featured ? "text-[44px] sm:text-[56px]" : "text-[38px] sm:text-[44px]")} />
        <span className={dark ? "text-white/65" : "text-muted"}>{P.perMonth}</span>
      </p>
      <p className={cn("mt-1 text-[13px]", dark ? "text-white/65" : "text-muted")}><MoneyTemplate template={P.billedMonthly} cents={offer.priceCents} currency={offer.currency} /></p>
    </div>;
  }
  const monthly = Math.round(offer.priceCents / 12);
  return <div>
    <p className="flex flex-wrap items-baseline gap-x-2">
      <Money cents={monthly} sourceCurrency={offer.currency} className={cn("tabular font-semibold tracking-[-0.04em]", featured ? "text-[44px] sm:text-[56px]" : "text-[38px] sm:text-[44px]")} />
      <span className={dark ? "text-white/65" : "text-muted"}>{P.perMonthEquivalent}</span>
    </p>
    <p className={cn("mt-1 text-[13px]", dark ? "text-white/65" : "text-muted")}><MoneyTemplate template={P.billedAnnually} cents={offer.priceCents} currency={offer.currency} /></p>
  </div>;
}

function DisclosureIcon() {
  return <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden />;
}

/** Outcome first, included capabilities next, exact technical characteristics last. */
export function PricingPlans({ t, locale, offers, page, promo, referral, requestHref, requestLabel, detailed = true }: {
  t: Dictionary; locale: Locale; offers: Offer[]; page?: string; promo?: string; referral?: string; requestHref: string; requestLabel: string; detailed?: boolean;
}) {
  const P = t.pricing;
  return <div>
    <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.08fr_1fr] lg:gap-5">
      {offers.map((o) => {
        const plan = P.plans[o.tier];
        const featured = o.tier === "premium";
        const buy = `/${locale}/buy?offer=${o.tier}${page ? `&page=${page}` : ""}${promo ? `&promo=${encodeURIComponent(promo)}` : ""}${referral ? `&referral=${encodeURIComponent(referral)}` : ""}`;
        return <HoloCard key={o.id} glow={HOLO[o.tier].glow} gradient={HOLO[o.tier].gradient} className={cn(featured ? "lg:z-10" : "lg:my-6")}>
          <article className={cn("flex h-full flex-col", featured ? "p-7 sm:p-9" : "p-7 sm:p-8")}>
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("w-fit rounded-full px-3 py-1 text-[12px] font-semibold", featured ? "bg-accent text-accent-fg" : "border border-white/15 bg-white/10 text-white/85")}>{plan.badge}</p>
              {o.tier === "one" && <p className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[12px] font-semibold text-emerald-300">{P.noSubscription}</p>}
            </div>
            <h3 className={cn("mt-5 font-semibold tracking-tight", featured ? "text-[30px]" : "text-[26px]")}>{plan.name}</h3>
            <p className="mt-2 text-[17px] font-medium leading-snug text-white">{plan.tagline}</p>
            <p className="mt-2 min-h-[4.5em] text-[14px] leading-relaxed text-white/65">{plan.subline}</p>
            <div className="mt-5"><OfferPrice offer={o} locale={locale} t={t} featured={featured} /></div>
            <p className="mt-5 border-s-2 border-white/25 ps-3 text-[14px] font-medium leading-relaxed text-white/90">{plan.promise}</p>
            <ul className="mt-6 space-y-3">{plan.features.slice(0, 4).map((f) => <li key={f} className="flex items-start gap-3 text-[14px] leading-relaxed text-white/90"><Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />{f}</li>)}</ul>

            <a href={buy} className={cn("mt-7 flex h-12 items-center justify-center rounded-full px-4 text-center text-[15px] font-medium transition", featured ? "bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] hover:brightness-110" : "bg-white text-black hover:bg-white/90")}>{fmt(P.choose, { name: plan.name })}</a>

            {detailed && <details className="group holo-frame mt-5">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[14px] font-semibold text-white/90">{P.exploreIncluded}<DisclosureIcon /></summary>
              <div className="border-t border-white/10 px-4 pb-5 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{P.forWhom}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/75">{plan.audience}</p>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">{P.whatYouGet}</p>
                  <ul className="mt-3 space-y-2">{plan.product.map((item) => <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-white/80"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />{item}</li>)}</ul>
                </div>
                {plan.services.length > 0 && <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-blue-200">{P.whatStudioDoes}</p>
                  <ul className="mt-3 space-y-2">{plan.services.map((item) => <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-white/85"><Check className="mt-0.5 size-3.5 shrink-0 text-blue-300" />{item}</li>)}</ul>
                </div>}
                <div className="mt-5 space-y-2">{plan.groups.map((group) => <details key={group.title} className="group rounded-2xl border border-white/10 bg-black/20">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[13px] font-semibold text-white/85"><span>{group.title}<span className="mt-0.5 block text-[12px] font-normal text-white/50">{group.summary}</span></span><DisclosureIcon /></summary>
                  <div className="border-t border-white/10 px-4 pb-4 pt-3">
                    <ul className="space-y-2">{group.items.map((item) => <li key={item} className="text-[12px] leading-relaxed text-white/70">• {item}</li>)}</ul>
                    {group.technical.length > 0 && <details className="group mt-3 border-t border-white/10 pt-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold text-white/60">{P.technicalDetails}<DisclosureIcon /></summary>
                      <ul className="mt-3 flex flex-wrap gap-1.5">{group.technical.map((item) => <li key={item} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">{item}</li>)}</ul>
                    </details>}
                  </div>
                </details>)}</div>
                {plan.excluded.length > 0 && <div className="mt-5 border-t border-white/10 pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{P.notIncluded}</p><ul className="mt-3 space-y-2">{plan.excluded.map((item) => <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-white/60"><Minus className="mt-0.5 size-3.5 shrink-0" />{item}</li>)}</ul></div>}
              </div>
            </details>}
            <a href={requestHref} className="mt-3 flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-center text-[14px] font-medium text-white/85 backdrop-blur hover:bg-white/10">{requestLabel}</a>
          </article>
        </HoloCard>;
      })}
    </div>

    {detailed && <><OfferComparison t={t} />
    <article className="card mt-12 grid overflow-hidden lg:grid-cols-[0.78fr_1.22fr]">
      <div className="bg-gradient-to-br from-accent-soft to-surface-2 p-7 sm:p-9">
        <div className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-fg"><Wrench className="size-5" /></div>
        <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{P.remix.badge}</p>
        <h3 className="mt-2 text-[28px] font-semibold tracking-tight">{P.remix.name}</h3>
        <p className="mt-3 text-[18px] font-medium leading-snug">{P.remix.tagline}</p>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">{P.remix.body}</p>
        <p className="mt-5 flex items-baseline gap-2"><span className="tabular text-[36px] font-semibold tracking-tight">{P.remix.price}</span><span className="text-[13px] text-muted">{P.remix.priceSuffix}</span></p>
        <a href={requestHref} className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-fg px-6 text-[14px] font-medium text-bg transition hover:opacity-90">{P.remix.cta}</a>
      </div>
      <div className="grid gap-3 p-7 sm:grid-cols-2 sm:p-9">
        <div className="rounded-2xl border border-line bg-surface-2/60 p-5"><p className="text-[15px] font-semibold">{P.remix.maintenanceTitle}</p><p className="mt-2 text-[14px] leading-relaxed text-muted">{P.remix.maintenanceBody}</p></div>
        <div className="rounded-2xl border border-accent/20 bg-accent-soft p-5"><p className="text-[15px] font-semibold">{P.remix.evolutionTitle}</p><p className="mt-2 text-[14px] leading-relaxed text-muted">{P.remix.evolutionBody}</p></div>
        <p className="text-[12px] leading-relaxed text-muted sm:col-span-2">{P.remix.note}</p>
      </div>
    </article></>}
  </div>;
}

function OfferComparison({ t }: { t: Dictionary }) {
  const C = t.pricing.comparison;
  return <section className="mt-16" aria-labelledby="offer-comparison-title">
    <div className="mx-auto max-w-2xl text-center"><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{C.eyebrow}</p><h3 id="offer-comparison-title" className="mt-2 text-[28px] font-semibold tracking-tight sm:text-[36px]">{C.title}</h3><p className="mt-3 text-[15px] leading-relaxed text-muted">{C.subtitle}</p></div>
    <div className="card mt-8 overflow-x-auto"><table className="w-full min-w-[620px] text-[14px]">
      <thead><tr className="border-b border-line bg-surface-2/60"><th className="px-5 py-4 text-start font-medium text-muted">{C.dimension}</th>{C.offers.map((name) => <th key={name} className="px-4 py-4 text-center font-semibold">{name}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{C.rows.map((row) => <tr key={row.label}><th className="px-5 py-4 text-start font-medium">{row.label}</th>{row.values.map((value, i) => <td key={`${row.label}-${i}`} className={cn("px-4 py-4 text-center", value === "—" ? "text-muted" : "font-medium")}>{value}</td>)}</tr>)}</tbody>
    </table></div>
    <details className="group card mt-3"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 text-[14px] font-semibold">{C.expand}<DisclosureIcon /></summary><div className="border-t border-line p-5"><div className="grid gap-3 md:grid-cols-3">{C.details.map((offer) => <div key={offer.name} className="rounded-2xl border border-line bg-surface-2/60 p-5"><p className="font-semibold">{offer.name}</p><ul className="mt-3 space-y-2">{offer.items.map((item) => <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-muted"><Check className="mt-0.5 size-3.5 shrink-0 text-success" />{item}</li>)}</ul></div>)}</div></div></details>
  </section>;
}

export function PartnerCommissionTable({ t, locale, offers, directRate, sponsorRate }: {
  t: Dictionary; locale: Locale; offers: Offer[]; directRate: number; sponsorRate: number;
}) {
  const P = t.pricing;
  const pct = (r: number) => formatPercent(r, locale, 0);
  const best = maxEarningOffer(offers).id;
  return <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-start text-[14px]">
    <thead><tr className="border-b border-line text-[12px] uppercase tracking-[0.1em] text-muted"><th className="px-5 py-4 text-start font-semibold">{P.colOffer}</th><th className="px-5 py-4 text-end font-semibold">{P.colPrice}</th><th className="px-5 py-4 text-end font-semibold">{fmt(P.colDirect, { rate: pct(directRate) })}</th><th className="px-5 py-4 text-end font-semibold">{fmt(P.colSponsor, { rate: pct(sponsorRate) })}</th><th className="px-5 py-4 text-start font-semibold">{P.colRenewal}</th></tr></thead>
    <tbody className="divide-y divide-line">{offers.map((o) => <tr key={o.id} className={cn(o.id === best && "bg-accent-soft/60")}><td className="px-5 py-4 font-semibold">{P.plans[o.tier].name}{o.id === best && <span className="ms-2 inline-block whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg">{P.maxBadge}</span>}</td><td className="tabular whitespace-nowrap px-5 py-4 text-end"><Money cents={o.priceCents} sourceCurrency={o.currency} /> <span className="text-muted">{renews(o) ? P.perYear : P.oneTime}</span></td><td className="tabular px-5 py-4 text-end text-[16px] font-semibold"><Money cents={firstSaleCommissionCents(o, directRate)} sourceCurrency={o.currency} /></td><td className="tabular whitespace-nowrap px-5 py-4 text-end"><Money cents={firstSaleCommissionCents(o, sponsorRate)} sourceCurrency={o.currency} /></td><td className="px-5 py-4 text-muted">{renews(o) ? P.renewalEach : P.renewalNone}</td></tr>)}</tbody>
  </table></div>;
}

export { OfferPrice };
