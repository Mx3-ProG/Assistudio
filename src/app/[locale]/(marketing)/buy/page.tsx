import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock, Minus, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { isDemoMode, isStripeConfigured } from "@/lib/env";
import { isBillingCadence, isOfferTier } from "@/lib/offers";
import { cn } from "@/lib/cn";
import { Navbar } from "@/components/marketing/navbar";
import { Notice } from "@/components/ui/primitives";
import { CheckoutButton } from "@/components/marketing/checkout-button";
import { OfferPrice } from "@/components/marketing/pricing-plans";
import { Money } from "@/components/ui/money";
import { VISITOR_COOKIE } from "@/lib/attribution";
import { resolveCheckoutAttribution } from "@/lib/services/attribution";
import { discountCents, normalizePromoCode } from "@/lib/services/promo";
import { formatPercent } from "@/lib/money";

export async function generateMetadata({ params }: PageProps<"/[locale]/buy">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return { title: `${t.checkout.title} — Studio ATS`, robots: { index: false, follow: false } };
}

/**
 * Purchase entry point — reached from the Studio ATS page, an affiliate link
 * (/s/CODE?to=/{locale}/buy), a private sales page or a dashboard CTA.
 * A plain GET page with no side effect; the Checkout Session is only created
 * when the visitor submits the form.
 */
export default async function BuyPage({ params, searchParams }: PageProps<"/[locale]/buy">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const t = await getDictionary(locale);
  const C = t.checkout;
  const page = typeof sp.page === "string" && isValidCode(sp.page) ? sp.page : null;
  const referral = typeof sp.referral === "string" && isValidCode(sp.referral) ? sp.referral : null;
  const [offers, settings, privatePage] = await Promise.all([
    repo().listOffers(), repo().getSettings(), page ? repo().getPrivatePage(page) : Promise.resolve(null),
  ]);
  // ?offer=one|pro|premium — Premium when absent, as before the three offers existed.
  const tier = isOfferTier(sp.offer) ? sp.offer : "premium";
  const cadence = tier !== "one" && isBillingCadence(sp.billing) ? sp.billing : "annual";
  const catalogOffer = offers.find((o) => o.tier === tier) ?? offers[offers.length - 1];
  const offer = cadence === "monthly" && catalogOffer.interval !== "one_time"
    ? { ...catalogOffer, priceCents: Math.round(catalogOffer.priceCents / 12), interval: "month" as const }
    : catalogOffer;
  const requestedPromo = normalizePromoCode(sp.promo);
  const jar = await cookies();
  // Same resolution as the checkout: a typed code (promo or ambassador code) only
  // attributes when no tracked click / private page does.
  const resolved = !isDemoMode ? await resolveCheckoutAttribution({
    sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null, privatePageSlug: page, referralCode: referral, code: requestedPromo,
  }) : null;
  const promo = resolved?.promo ?? null;
  const promoInvalid = !!requestedPromo && (isDemoMode || resolved?.code === "invalid");
  const codeAdvisor = resolved?.code === "attributed" ? resolved.advisor : null;
  const discount = promo ? discountCents(offer.priceCents, promo.discountRate) : 0;
  const finalPrice = offer.priceCents - discount;
  const plan = t.pricing.plans[offer.tier];
  const origin = privatePage ? "private_page" : referral ? "affiliate_link" : typeof sp.via === "string" && sp.via === "dashboard" ? "dashboard_cta" : "public";
  const promoQuery = requestedPromo ? `&promo=${encodeURIComponent(requestedPromo)}` : "";
  const preservedQuery = `${page ? `&page=${page}` : ""}${referral ? `&referral=${encodeURIComponent(referral)}` : ""}${origin === "dashboard_cta" ? "&via=dashboard" : ""}${promoQuery}`;
  const hrefFor = (x: string) => `/${locale}/buy?offer=${x}${x !== "one" ? `&billing=${cadence}` : ""}${preservedQuery}`;
  const hrefForCadence = (next: "annual" | "monthly") => `/${locale}/buy?offer=${tier}&billing=${next}${preservedQuery}`;
  const referrer = privatePage?.referral.active ? privatePage.displayName ?? privatePage.referral.displayName : null;
  // Same conditions as startCheckout: never offer a payment button that can only fail.
  const unavailable = !!sp.unavailable || !settings.checkoutEnabled || isDemoMode || !isStripeConfigured;

  return (
    <>
      <Navbar variant="studio" />
      <main className="mx-auto max-w-xl px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
        {referrer && (
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[12px] font-medium text-fg-2">
            <Sparkles className="size-3.5 text-accent" /> {fmt(C.referredBy, { name: referrer })}
          </p>
        )}
        <h1 className="display text-[36px] sm:text-[52px]">{C.title}</h1>
        <p className="mt-3 text-[16px] text-fg-2">{C.subtitle}</p>

        {sp.cancelled && <div className="mt-6"><Notice>{C.cancelled}</Notice></div>}

        <nav aria-label={t.pricing.eyebrow} className="mt-8 grid grid-cols-3 gap-1 rounded-full border border-line bg-surface-2 p-1">
          {offers.map((o) => (
            <Link key={o.id} href={hrefFor(o.tier)} aria-current={o.tier === offer.tier ? "page" : undefined}
              className={cn("rounded-full px-2 py-2 text-center text-[13px] font-medium transition",
                o.tier === offer.tier ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg")}>
              {t.pricing.plans[o.tier].name}
            </Link>
          ))}
        </nav>

        <section className="glass mt-4 rounded-[28px] p-7 shadow-lift sm:p-9">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{plan.name}</p>
          <p className="mt-2 text-[20px] font-semibold leading-snug">{plan.tagline}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{plan.subline}</p>
          {offer.tier !== "one" && <nav aria-label={C.billingCadence} className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-line bg-surface-2 p-1">
            {(["monthly", "annual"] as const).map((value) => <Link key={value} href={hrefForCadence(value)} aria-current={cadence === value ? "page" : undefined}
              className={cn("rounded-full px-3 py-2 text-center text-[13px] font-medium transition", cadence === value ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg")}>
              {value === "monthly" ? C.monthly : C.annual}
            </Link>)}
          </nav>}
          <div className="mt-5 [&_.text-white\/65]:text-muted [&_.text-emerald-400]:text-success"><OfferPrice offer={offer} locale={locale} t={t} dark={false} featured /></div>
          <form method="get" className="mt-6 rounded-2xl border border-line bg-surface-2/60 p-4">
            <input type="hidden" name="offer" value={offer.tier} />
            <input type="hidden" name="billing" value={cadence} />
            {page && <input type="hidden" name="page" value={page} />}
            {referral && <input type="hidden" name="referral" value={referral} />}
            {origin === "dashboard_cta" && <input type="hidden" name="via" value="dashboard" />}
            <label htmlFor="promo" className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{C.promoLabel}</label>
            <div className="mt-2 flex gap-2">
              <input id="promo" name="promo" defaultValue={requestedPromo ?? ""} placeholder={C.promoPlaceholder} maxLength={24}
                className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 font-mono text-[14px] uppercase outline-none focus:border-accent" />
              <button className="h-11 rounded-full bg-fg px-5 text-[13px] font-medium text-bg">{C.applyPromo}</button>
            </div>
            {promoInvalid && <p className="mt-2 text-[12px] text-danger">{C.promoInvalid}</p>}
            {resolved?.code === "attributed" && requestedPromo && <p className="mt-2 text-[12px] text-success">
              {codeAdvisor ? fmt(C.codeRecognisedBy, { code: requestedPromo, name: codeAdvisor }) : fmt(C.codeRecognised, { code: requestedPromo })}
            </p>}
            {promo && <p className="mt-2 text-[12px] text-success">
              {C.promoApplied.replace("{code}", promo.code).split("{amount}")[0]}
              <Money cents={discount} sourceCurrency={offer.currency} />
              {C.promoApplied.replace("{code}", promo.code).split("{amount}")[1]}
            </p>}
          </form>
          {promo && <div className="mt-4 rounded-2xl border border-success/20 bg-success-soft p-4 text-[13px]">
            <dl className="grid gap-2">
              <div className="flex justify-between gap-4 text-muted"><dt>{C.catalogPrice}</dt><dd className="tabular"><Money cents={offer.priceCents} sourceCurrency={offer.currency} /></dd></div>
              <div className="flex justify-between gap-4 text-success"><dt>{fmt(C.discountLine, { rate: formatPercent(promo.discountRate, locale, 0) })}</dt><dd className="tabular">−<Money cents={discount} sourceCurrency={offer.currency} /></dd></div>
              <div className="flex justify-between gap-4 border-t border-success/20 pt-2 text-[15px] font-semibold"><dt>{offer.recurring ? C.totalPerPayment : C.totalToday}</dt><dd className="tabular"><Money cents={finalPrice} sourceCurrency={offer.currency} /></dd></div>
            </dl>
            {offer.recurring && <p className="mt-2 text-[11px] text-muted">{C.renewalNotice}</p>}
          </div>}
          <p className="mt-5 border-s-2 border-accent ps-3 text-[14px] font-medium leading-relaxed text-fg-2">{plan.promise}</p>
          <ul className="mt-5 space-y-2.5">
            {plan.features.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[14px]"><Check className="mt-0.5 size-4 shrink-0 text-success" />{i}</li>
            ))}
            {plan.excluded.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-muted"><Minus className="mt-0.5 size-4 shrink-0" />{i}</li>
            ))}
          </ul>

          <details className="group mt-6 rounded-2xl border border-line bg-surface-2/60">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[14px] font-semibold">
              {t.pricing.exploreIncluded}<span className="text-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
              <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t.pricing.whatYouGet}</p><ul className="mt-3 space-y-2">{plan.product.map((i) => <li key={i} className="text-[13px] leading-relaxed text-fg-2">• {i}</li>)}</ul></div>
              {plan.services.length > 0 && <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{t.pricing.whatStudioDoes}</p><ul className="mt-3 space-y-2">{plan.services.map((i) => <li key={i} className="text-[13px] leading-relaxed text-fg-2">• {i}</li>)}</ul></div>}
            </div>
          </details>

          {unavailable ? (
            <div className="mt-8 space-y-4">
              <Notice tone="warning">{C.unavailable}</Notice>
              <Link href={page ? `/${locale}/p/${page}#request` : `/${locale}/studio#request`}
                className="flex h-12 items-center justify-center rounded-full bg-fg text-[15px] font-medium text-bg hover:opacity-90">
                {C.requestInstead}
              </Link>
            </div>
          ) : (
            <CheckoutButton locale={locale} page={page} referral={referral} promo={promo?.code ?? (resolved?.code === "attributed" ? requestedPromo : null)} origin={origin} offer={offer.tier} billing={cadence} label={C.pay} pendingLabel={C.paying} />
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[12px] text-muted"><Lock className="size-3.5" />{C.secure}</p>
        </section>
      </main>
    </>
  );
}
