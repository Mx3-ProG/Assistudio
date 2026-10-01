import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { formatMoney, formatPercent } from "@/lib/money";
import { maxEarningOffer } from "@/lib/offers";
import { Navbar } from "@/components/marketing/navbar";
import { PricingPlans, PartnerCommissionTable } from "@/components/marketing/pricing-plans";
import { LinkButton } from "@/components/ui/button";
import { normalizePromoCode } from "@/lib/services/promo";

export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const [t, offers] = await Promise.all([getDictionary(locale), repo().listOffers()]);
  const price = Object.fromEntries(offers.map((o) => [o.tier, formatMoney(o.priceCents, locale, o.currency)]));
  return pageMetadata(locale, "/pricing", t.pricing.metaTitle, fmt(t.pricing.metaDescription, price));
}

/** The three offers, and what each one pays a partner under the existing commission rules. */
export default async function PricingPage({ params, searchParams }: PageProps<"/[locale]/pricing">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const promo = normalizePromoCode(sp.promo);
  const [t, offers, settings] = await Promise.all([getDictionary(locale), repo().listOffers(), repo().getSettings()]);
  const P = t.pricing;
  // One direct rate for every offer: the offers change prices, not commission rules.
  const directRate = maxEarningOffer(offers).commissionRate;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Studio ATS",
          description: t.meta.studioDescription,
          brand: { "@type": "Brand", name: "Studio ATS" },
          offers: offers.map((o) => ({
            "@type": "Offer",
            name: P.plans[o.tier].name,
            price: (o.priceCents / 100).toFixed(2),
            priceCurrency: o.currency,
            url: `${env.siteUrl}/${locale}/pricing`,
            availability: "https://schema.org/InStock",
          })),
        }}
      />
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent)]" />
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{P.eyebrow}</p>
              <h1 className="display mt-3 text-[40px] sm:text-[64px]">{P.title}</h1>
              <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{P.subtitle}</p>
            </div>
            <div className="mt-12">
              <PricingPlans t={t} locale={locale} offers={offers} promo={promo ?? undefined} requestHref={`/${locale}/studio#request`} requestLabel={P.talkToUs} />
            </div>
            <p className="mt-6 text-center text-[12px] text-muted">{t.studio.pricingNote}</p>
          </div>
        </section>

        <section className="bg-surface-2/60 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{P.partnersEyebrow}</p>
              <h2 className="display mt-3 text-[34px] sm:text-[52px]">{P.partnersTitle}</h2>
              <p className="mt-4 text-[17px] text-muted">
                {fmt(P.partnersSubtitle, { rate: formatPercent(directRate, locale, 0), sponsorRate: formatPercent(settings.sponsorRate, locale, 0) })}
              </p>
            </div>
            <div className="mt-10">
              <PartnerCommissionTable t={t} locale={locale} offers={offers} directRate={directRate} sponsorRate={settings.sponsorRate} />
            </div>
            <p className="mt-5 max-w-3xl text-[12px] leading-relaxed text-muted">{t.common.illustrationOnly}</p>
            <div className="mt-8">
              <LinkButton href={`/${locale}/register`} size="lg" variant="accent">
                {P.partnersCta} <ArrowRight className="flip-rtl size-4" />
              </LinkButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
