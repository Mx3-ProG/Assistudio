import type { Metadata } from "next";
import { Link2, Presentation, Wallet, Hammer, LifeBuoy, Receipt, LayoutDashboard, ArrowRight } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { repo } from "@/lib/data";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { computeCommissionCents } from "@/lib/commission";
import { Navbar } from "@/components/marketing/navbar";
import { HeroScene } from "@/components/marketing/hero-scene";
import { EarningsLadder } from "@/components/marketing/earnings-ladder";
import { SuccessStories } from "@/components/marketing/success-stories";
import { UncappedBand } from "@/components/marketing/uncapped-band";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { MarketsGrid } from "@/components/marketing/markets-grid";
import { LinkButton } from "@/components/ui/button";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "", t.meta.homeTitle, t.meta.homeDescription);
}

export default async function PartnerHome({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const [offer, markets] = await Promise.all([repo().getOffer(), repo().listMarkets()]);
  const commission = computeCommissionCents(offer.priceCents, offer.commissionRate);
  const p = (path: string) => `/${locale}${path}`;

  const steps = [
    { n: "01", icon: Link2, ...t.home.steps.share },
    { n: "02", icon: Presentation, ...t.home.steps.sell },
    { n: "03", icon: Wallet, ...t.home.steps.earn },
  ];
  const deliver = [
    { icon: Hammer, text: t.home.deliverItems.build },
    { icon: LifeBuoy, text: t.home.deliverItems.support },
    { icon: Receipt, text: t.home.deliverItems.billing },
    { icon: LayoutDashboard, text: t.home.deliverItems.tools },
  ];

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "STUDIO", url: `${env.siteUrl}/${locale}` }} />
      <Navbar />
      <main>
        {/* ---------------------------------------------------------------- HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-24 lg:pt-24">
            <div className="animate-rise">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-[12px] font-medium text-fg-2">
                <span className="animate-pulse-dot size-1.5 rounded-full bg-success" />
                {t.home.eyebrow}
              </p>
              <h1 className="display text-[44px] sm:text-[68px] lg:text-[84px]">
                {t.home.heroTitle1}
                <br />
                <span className="text-gradient">{t.home.heroTitle2}</span>
              </h1>
              <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-fg-2 sm:text-[21px]">{t.home.heroSubtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href={p("/register")} size="lg" variant="accent">
                  {t.home.ctaPrimary} <ArrowRight className="flip-rtl size-4" />
                </LinkButton>
                <LinkButton href={p("/studio")} size="lg" variant="secondary">
                  {t.home.ctaSecondary}
                </LinkButton>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
              <HeroScene />
            </div>
          </div>

          {/* key numbers, visible immediately */}
          <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
            <dl className="glass grid grid-cols-1 divide-y divide-line overflow-hidden rounded-[24px] shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {[
                [formatMoney(offer.priceCents, locale) + " " + t.common.perYear, t.home.statPriceLabel],
                [t.home.statRate, t.home.statRateLabel],
                [formatMoney(commission, locale), t.home.statCommissionLabel],
              ].map(([v, l]) => (
                <div key={l} className="px-6 py-5 sm:py-7">
                  <dt className="text-[13px] text-muted">{l}</dt>
                  <dd className="tabular mt-1 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------------------------------------------------------------- LADDER */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="display text-[36px] sm:text-[56px]">{t.home.ladderTitle}</h2>
            <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{t.home.ladderSubtitle}</p>
          </div>
          <div className="card mx-auto mt-12 max-w-3xl p-5 sm:p-10">
            <EarningsLadder priceCents={offer.priceCents} rate={offer.commissionRate} />
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[12px] leading-relaxed text-muted">{t.common.illustrationOnly}</p>
        </section>

        {/* ---------------------------------------------------------------- STORIES */}
        <section id="stories" className="scroll-mt-20 bg-surface-2/60 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{t.home.storiesEyebrow}</p>
              <h2 className="display mt-3 text-[36px] sm:text-[56px]">{t.home.storiesTitle}</h2>
              <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{t.home.storiesSubtitle}</p>
            </div>
            <SuccessStories t={t} locale={locale} priceCents={offer.priceCents} rate={offer.commissionRate} />
            <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-muted">{t.home.storiesDisclaimer}</p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- UNCAPPED */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <UncappedBand t={t} locale={locale} rate={offer.commissionRate} />
        </section>

        {/* ---------------------------------------------------------------- HOW */}
        <section id="how" className="scroll-mt-20 bg-surface-2/60 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="display text-[36px] sm:text-[56px]">{t.home.howTitle}</h2>
              <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{t.home.howSubtitle}</p>
            </div>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map(({ n, icon: Icon, title, body }) => (
                <li key={n} className="card relative overflow-hidden p-7 sm:p-8">
                  <span className="tabular absolute -end-2 -top-6 text-[120px] font-bold leading-none tracking-tighter text-fg/[0.04]">{n}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_12px_30px_-12px_var(--accent)]">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-8 text-[13px] font-semibold text-muted">{n}</h3>
                  <p className="mt-1 text-[28px] font-semibold tracking-[-0.03em]">{title}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------- WHAT YOU SELL */}
        <section id="sell" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mb-12 max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{t.home.sellEyebrow}</p>
            <h2 className="display mt-3 text-[36px] sm:text-[56px]">{t.home.sellTitle}</h2>
            <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{t.home.sellSubtitle}</p>
          </div>
          <ProductMockup />
        </section>

        {/* ---------------------------------------------------------------- MARKETS */}
        <section id="markets" className="scroll-mt-20 bg-surface-2/60 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{t.home.marketsEyebrow}</p>
              <h2 className="display mt-3 text-[36px] sm:text-[56px]">{t.home.marketsTitle}</h2>
              <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{t.home.marketsSubtitle}</p>
            </div>
            <MarketsGrid markets={markets} />
          </div>
        </section>

        {/* ---------------------------------------------------------------- DELIVER */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="display max-w-2xl text-[36px] sm:text-[56px]">{t.home.deliverTitle}</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {deliver.map(({ icon: Icon, text }) => (
              <li key={text} className="card flex items-center gap-4 p-5">
                <Icon className="size-5 shrink-0 text-accent" />
                <span className="text-[15px] text-fg-2">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------------- FINAL CTA */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-fg px-6 py-16 text-center text-bg sm:px-12 sm:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_120%,var(--accent),transparent)] opacity-70" />
            <div className="relative">
              <h2 className="display mx-auto max-w-3xl text-[34px] sm:text-[56px]">{t.home.finalTitle}</h2>
              <p className="mx-auto mt-5 max-w-xl text-[17px] opacity-70">{t.home.finalSubtitle}</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <LinkButton href={p("/register")} size="lg" className="bg-bg text-fg hover:opacity-90">
                  {t.home.ctaPrimary} <ArrowRight className="flip-rtl size-4" />
                </LinkButton>
              </div>
              <p className="mx-auto mt-8 max-w-xl text-[11px] leading-relaxed opacity-50">{t.common.illustrationOnly}</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
