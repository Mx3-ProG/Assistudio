import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock, Minus, Sparkles } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { isValidCode } from "@/lib/attribution";
import { formatMoney } from "@/lib/money";
import { isOfferTier, renews } from "@/lib/offers";
import { cn } from "@/lib/cn";
import { Navbar } from "@/components/marketing/navbar";
import { Notice } from "@/components/ui/primitives";
import { CheckoutButton } from "@/components/marketing/checkout-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/buy">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return { title: `${t.checkout.title} — STUDIO`, robots: { index: false, follow: false } };
}

/**
 * Purchase entry point — reached from the STUDIO page, an affiliate link
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
  const [offers, settings, privatePage] = await Promise.all([
    repo().listOffers(), repo().getSettings(), page ? repo().getPrivatePage(page) : Promise.resolve(null),
  ]);
  // ?offer=one|pro|premium — Premium when absent, as before the three offers existed.
  const tier = isOfferTier(sp.offer) ? sp.offer : "premium";
  const offer = offers.find((o) => o.tier === tier) ?? offers[offers.length - 1];
  const plan = t.pricing.plans[offer.tier];
  const hrefFor = (x: string) => `/${locale}/buy?offer=${x}${page ? `&page=${page}` : ""}${origin === "dashboard_cta" ? "&via=dashboard" : ""}`;
  const referrer = privatePage?.referral.active ? privatePage.displayName ?? privatePage.referral.displayName : null;
  const unavailable = !!sp.unavailable || !settings.checkoutEnabled;
  const origin = privatePage ? "private_page" : typeof sp.via === "string" && sp.via === "dashboard" ? "dashboard_cta" : "public";

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
          <p className="mt-3 flex items-baseline gap-2">
            <span className="tabular text-[48px] font-semibold tracking-[-0.04em]">{formatMoney(offer.priceCents, locale, offer.currency)}</span>
            <span className="text-muted">{renews(offer) ? C.perYear : C.oneTime}</span>
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{plan.tagline}</p>
          <ul className="mt-5 space-y-2.5">
            {plan.features.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[14px]"><Check className="mt-0.5 size-4 shrink-0 text-success" />{i}</li>
            ))}
            {plan.excluded.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-muted"><Minus className="mt-0.5 size-4 shrink-0" />{i}</li>
            ))}
          </ul>

          {unavailable ? (
            <div className="mt-8 space-y-4">
              <Notice tone="warning">{C.unavailable}</Notice>
              <Link href={page ? `/${locale}/p/${page}#request` : `/${locale}/studio#request`}
                className="flex h-12 items-center justify-center rounded-full bg-fg text-[15px] font-medium text-bg hover:opacity-90">
                {C.requestInstead}
              </Link>
            </div>
          ) : (
            <CheckoutButton locale={locale} page={page} origin={origin} offer={offer.tier} label={C.pay} pendingLabel={C.paying} />
          )}
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[12px] text-muted"><Lock className="size-3.5" />{C.secure}</p>
        </section>
      </main>
    </>
  );
}
