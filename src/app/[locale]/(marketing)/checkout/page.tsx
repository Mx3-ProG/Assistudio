import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Check, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { convertCurrency, isCurrency } from "@/i18n/currency";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { env, isDemoMode, isEmbeddedCheckoutConfigured } from "@/lib/env";
import { VISITOR_COOKIE, isValidCode } from "@/lib/attribution";
import { isBillingCadence, isOfferTier } from "@/lib/offers";
import { resolveCheckoutAttribution } from "@/lib/services/attribution";
import { discountCents, normalizePromoCode } from "@/lib/services/promo";
import { formatPercent } from "@/lib/money";
import { Money } from "@/components/ui/money";
import { Notice } from "@/components/ui/primitives";
import { Logo } from "@/components/marketing/logo";
import { OfferPrice } from "@/components/marketing/pricing-plans";
import { EmbeddedCheckoutPanel } from "@/components/marketing/embedded-checkout";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params as { locale: Locale };
  const t = await getDictionary(locale);
  return { title: `${t.checkout.paymentTitle} — Studio ATS`, robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params, searchParams }: PageProps<"/[locale]/checkout">) {
  const { locale } = await params as { locale: Locale };
  const sp = await searchParams;
  const t = await getDictionary(locale);
  const C = t.checkout;
  const jar = await cookies();
  const queryCurrency = typeof sp.currency === "string" ? sp.currency.toUpperCase() : null;
  const cookieCurrency = jar.get("STUDIO_CURRENCY")?.value?.toUpperCase();
  const currency = isCurrency(queryCurrency) ? queryCurrency : isCurrency(cookieCurrency) ? cookieCurrency : "EUR";
  const tier = isOfferTier(sp.offer) ? sp.offer : "premium";
  const billing = tier !== "one" && isBillingCadence(sp.billing) ? sp.billing : "annual";
  const page = typeof sp.page === "string" && isValidCode(sp.page) ? sp.page : null;
  const referral = typeof sp.referral === "string" && isValidCode(sp.referral) ? sp.referral : null;
  const promoCode = normalizePromoCode(sp.promo);
  const requestedOrigin = typeof sp.origin === "string" ? sp.origin : "public";
  const origin = page ? "private_page" as const
    : requestedOrigin === "dashboard_cta" ? "dashboard_cta" as const
      : requestedOrigin === "affiliate_link" ? "affiliate_link" as const : "public" as const;
  const [offers, settings, privatePage] = await Promise.all([
    repo().listOffers(), repo().getSettings(), page ? repo().getPrivatePage(page) : Promise.resolve(null),
  ]);
  const catalogOffer = offers.find((offer) => offer.tier === tier) ?? offers[offers.length - 1];
  if (!catalogOffer) return null;
  const baseOffer = billing === "monthly" && catalogOffer.interval !== "one_time"
    ? { ...catalogOffer, priceCents: Math.round(catalogOffer.priceCents / 12), interval: "month" as const }
    : catalogOffer;
  const offer = {
    ...baseOffer,
    priceCents: convertCurrency(baseOffer.priceCents, baseOffer.currency, currency),
    currency,
  };
  const resolved = !isDemoMode ? await resolveCheckoutAttribution({
    sessionKey: jar.get(VISITOR_COOKIE)?.value ?? null,
    privatePageSlug: page,
    referralCode: referral,
    code: promoCode,
  }) : null;
  const promo = resolved?.promo ?? null;
  const invalidPromo = !!promoCode && (isDemoMode || resolved?.code === "invalid");
  const discount = promo ? discountCents(offer.priceCents, promo.discountRate) : 0;
  const total = offer.priceCents - discount;
  const plan = t.pricing.plans[offer.tier];
  const referrer = privatePage?.referral.active
    ? privatePage.displayName ?? privatePage.referral.displayName
    : resolved?.advisor ?? null;
  const backQuery = new URLSearchParams({ offer: tier, billing, currency });
  if (page) backQuery.set("page", page);
  if (referral) backQuery.set("referral", referral);
  if (promoCode) backQuery.set("promo", promoCode);
  const backHref = `/${locale}/buy?${backQuery.toString()}`;
  const unavailable = !settings.checkoutEnabled || isDemoMode || !isEmbeddedCheckoutConfigured || invalidPromo;

  return <main className="min-h-dvh bg-[radial-gradient(circle_at_12%_0%,var(--accent-soft),transparent_34%)] px-4 py-6 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-6xl">
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2 text-[12px] font-medium text-muted"><ShieldCheck className="size-4 text-success" />{C.secureBadge}</div>
      </header>

      <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-8">
          <Link href={backHref} className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-fg">
            <ArrowLeft className="size-4 rtl:rotate-180" />{C.backToOffer}
          </Link>
          <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">{C.orderSummary}</p>
          <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.04em] sm:text-[44px]">{C.paymentTitle}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-fg-2">{C.paymentSubtitle}</p>

          {referrer && <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-fg-2 shadow-sm">
            <Sparkles className="size-3.5 text-accent" />{fmt(C.referredBy, { name: referrer })}
          </div>}

          <section className="glass mt-6 rounded-[28px] p-6 shadow-soft sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{plan.name}</p><p className="mt-2 text-[15px] leading-relaxed text-fg-2">{plan.tagline}</p></div>
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent">{offer.tier === "one" ? C.oneTime : billing === "monthly" ? C.monthly : C.annual}</span>
            </div>
            <div className="mt-5 border-y border-line py-5 [&_.text-white\/65]:text-muted [&_.text-emerald-400]:text-success">
              <OfferPrice offer={offer} locale={locale} t={t} dark={false} featured displayCurrency={currency} />
            </div>
            {promo && <dl className="mt-5 grid gap-3 text-[13px]">
              <div className="flex justify-between gap-4 text-muted"><dt>{C.catalogPrice}</dt><dd className="tabular"><Money cents={offer.priceCents} sourceCurrency={offer.currency} displayCurrency={currency} /></dd></div>
              <div className="flex justify-between gap-4 text-success"><dt>{fmt(C.discountLine, { rate: formatPercent(promo.discountRate, locale, 0) })}</dt><dd className="tabular">−<Money cents={discount} sourceCurrency={offer.currency} displayCurrency={currency} /></dd></div>
              <div className="flex justify-between gap-4 border-t border-line pt-3 text-[15px] font-semibold"><dt>{offer.recurring ? C.totalPerPayment : C.totalToday}</dt><dd className="tabular"><Money cents={total} sourceCurrency={offer.currency} displayCurrency={currency} /></dd></div>
            </dl>}
            <ul className="mt-6 grid gap-2.5">
              {plan.features.slice(0, 4).map((feature) => <li key={feature} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-fg-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{feature}</li>)}
            </ul>
          </section>
          <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-muted"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" />{C.embeddedSecurity}</p>
        </aside>

        <section aria-label={C.paymentForm}>
          {unavailable ? <div className="rounded-[28px] border border-line bg-surface p-6 shadow-soft sm:p-8">
            <Notice tone="warning">{invalidPromo ? C.promoInvalid : C.unavailable}</Notice>
            <Link href={backHref} className="mt-5 flex h-11 items-center justify-center rounded-full bg-fg px-5 text-[13px] font-medium text-bg">{C.backToOffer}</Link>
          </div> : <EmbeddedCheckoutPanel
            publishableKey={env.stripePublishableKey}
            input={{ locale, origin, page, referral, offer: tier, billing, currency, promo: promo?.code ?? (resolved?.code === "attributed" ? promoCode : null) }}
            loadingLabel={C.loadingPayment}
            retryLabel={C.retryPayment}
            errorLabel={C.paymentError}
          />}
        </section>
      </div>
    </div>
  </main>;
}
