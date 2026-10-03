import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { computeCommissionCents } from "@/lib/commission";
import { formatPercent } from "@/lib/money";
import { publicFieldProof } from "@/content/field-proof";
import { Navbar } from "@/components/marketing/navbar";
import { HeroScene } from "@/components/marketing/hero-scene";
import { UncappedBand } from "@/components/marketing/uncapped-band";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { Money } from "@/components/ui/money";
import { TrackedLink } from "@/components/marketing/home/tracked-link";
import { SectionHead } from "@/components/marketing/home/section-head";
import { StudioFlow } from "@/components/marketing/home/studio-flow";
import { DemoButton } from "@/components/marketing/home/demo-button";
import { BuyerProfiles } from "@/components/marketing/home/buyer-profiles";
import { FieldProof } from "@/components/marketing/home/field-proof";
import { FirstCommission } from "@/components/marketing/home/first-commission";
import { CommissionSimulator } from "@/components/marketing/home/commission-simulator";
import { RelationSplit, SalesCenterBlock, HandoffBlock, AmbassadorProfiles, HomeFaq } from "@/components/marketing/home/sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta";
import { HomeView } from "@/components/marketing/home/home-view";
import { ContactNewsletter } from "@/components/marketing/contact-newsletter";
import { TeamSection } from "@/components/marketing/team-section";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "", t.meta.homeTitle, t.meta.homeDescription);
}

/**
 * Partner home. Rhythm: promise → understanding → proof → projection →
 * earnings → reassurance → urgency → action. Each CTA sits where the visitor
 * has just been given a reason to act; every money figure is computed from
 * `public.offers` and settings, and labelled as illustrative.
 */
export default async function PartnerHome({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const [offer, offers, settings] = await Promise.all([repo().getOffer(), repo().listOffers(), repo().getSettings()]);
  const commission = computeCommissionCents(offer.priceCents, offer.commissionRate);
  const rate = formatPercent(offer.commissionRate, locale, 0);
  const p = (path: string) => `/${locale}${path}`;
  // Sign-up first, then straight to the page the CTA promised (see verifyCode → welcome?next=).
  const register = (next?: string) => (next ? `${p("/register")}?next=${encodeURIComponent(p(next))}` : p("/register"));
  const H = t.hc.hero;
  const proofs = publicFieldProof();
  const simOffers = offers.map((o) => ({
    tier: o.tier, name: t.pricing.plans[o.tier].name, priceCents: o.priceCents, currency: o.currency, interval: o.interval, rate: o.commissionRate,
  }));
  const band = "scroll-mt-20 bg-surface-2/60 py-14 sm:py-28";
  const plain = "mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-28";

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Studio ATS", url: `${env.siteUrl}/${locale}` }} />
      <HomeView />
      <Navbar />
      <main>
        {/* ------------------------------------------------------------ PROMISE */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-20 lg:pt-20">
            <div className="animate-rise">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-[12px] font-medium text-fg-2">
                <span className="animate-pulse-dot size-1.5 rounded-full bg-success" />
                {H.eyebrow}
              </p>
              <h1 className="display text-[42px] sm:text-[64px] lg:text-[76px]">
                {H.title1}
                <br />
                <span className="text-gradient">{H.title2}</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-fg-2 sm:text-[19px]">{H.lead}</p>
              <p className="mt-4 max-w-xl text-[17px] font-medium leading-relaxed sm:text-[19px]">
                {H.pitch.map((line, i) => <span key={i} className="block">{fmt(line, { rate })}</span>)}
              </p>
              <div data-cta className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <TrackedLink href={register()} event="hero_signup_click" placement="hero" className="w-full sm:w-auto">
                  {H.ctaPrimary} <ArrowRight className="flip-rtl size-4" />
                </TrackedLink>
                <TrackedLink href="#sell" event="see_product_click" placement="hero" variant="secondary" className="w-full sm:w-auto">
                  {H.ctaSecondary}
                </TrackedLink>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
                {H.reassurance.map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="size-3.5 text-success" aria-hidden />{x}</li>)}
              </ul>
            </div>
            {/* Decorative: skipped on phones (no WebGL download, the CTA stays above the fold). */}
            <div className="relative mx-auto hidden w-full max-w-[460px] sm:block lg:max-w-none">
              <HeroScene />
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
            <dl className="glass grid grid-cols-1 divide-y divide-line overflow-hidden rounded-[24px] shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {[
                [<><Money key="price" cents={offer.priceCents} sourceCurrency={offer.currency} /> {t.common.perYear}</>, t.home.statPriceLabel],
                [t.home.statRate, t.home.statRateLabel],
                [<Money key="commission" cents={commission} sourceCurrency={offer.currency} />, t.home.statCommissionLabel],
              ].map(([v, l]) => (
                <div key={String(l)} className="px-6 py-5 sm:py-7">
                  <dt className="text-[13px] text-muted">{l}</dt>
                  <dd className="tabular mt-1 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------------ UNDERSTAND: what you sell */}
        <section id="sell" className={plain}>
          <SectionHead eyebrow={t.hc.sell.eyebrow} title={t.hc.sell.title} subtitle={t.hc.sell.subtitle} />
          <div className="mt-10"><StudioFlow t={t} /></div>
          <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-fg-2">{t.hc.sell.oneLine}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <TrackedLink href={p("/studio")} event="studio_demo_click" placement="discover" variant="primary" className="w-full sm:w-auto">
              {t.hc.sell.discover} <ArrowRight className="flip-rtl size-4" />
            </TrackedLink>
            {env.studioDemoUrl && <DemoButton url={env.studioDemoUrl} label={t.hc.sell.demo} closeLabel={t.hc.sell.demoClose} />}
          </div>
          {/* The flow above already explains Studio on phones; the interactive mockup is for larger screens. */}
          <div className="mt-14 hidden md:block"><ProductMockup /></div>
        </section>

        {/* ------------------------------------------------------------ UNDERSTAND: who buys */}
        <section id="markets" className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow={t.hc.buyers.eyebrow} title={t.hc.buyers.title} subtitle={t.hc.buyers.subtitle} />
            <BuyerProfiles t={t} ctaHref={register("/dashboard/find")} />
          </div>
        </section>

        {/* ------------------------------------------------------------ PROOF (verified references only) */}
        <FieldProof t={t} locale={locale} proofs={proofs} />

        {/* ------------------------------------------------------------ REASSURANCE: no code needed */}
        <section className={plain}>
          <RelationSplit t={t} />
        </section>

        {/* ------------------------------------------------------------ PROJECTION: first commission */}
        <section id="how" className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow={t.hc.first.eyebrow} title={t.hc.first.title} />
            <FirstCommission t={t} ctaHref={register()} />
          </div>
        </section>

        {/* ------------------------------------------------------------ EARNINGS */}
        <section id="simulator" className={plain}>
          <SectionHead eyebrow={t.hc.sim.eyebrow} title={t.hc.sim.title} subtitle={t.hc.sim.subtitle} />
          <div className="mt-10"><CommissionSimulator offers={simOffers} ctaHref={register()} /></div>
          {/* "No cap" is already in the hero, the simulator and the FAQ: the full band is for larger screens. */}
          <div className="mt-16 hidden sm:block"><UncappedBand t={t} locale={locale} rate={offer.commissionRate} /></div>
        </section>

        {/* ------------------------------------------------------------ REASSURANCE: tools + hand-over */}
        <section id="sales-center" className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SalesCenterBlock t={t} ctaHref={register("/dashboard/sales-center")} />
          </div>
        </section>

        <section className={plain}>
          <HandoffBlock t={t} ctaHref={register("/dashboard/prospects")} />
        </section>

        <section className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <AmbassadorProfiles t={t} />
          </div>
        </section>

        <section id="faq" className={plain}>
          <HomeFaq t={t} locale={locale} facts={{
            rate, window: settings.attributionWindowDays, validation: settings.commissionValidationDays, model: settings.attributionModel,
          }} />
        </section>

        <TeamSection t={t} />

        <ContactNewsletter t={t} source="home" />

        {/* ------------------------------------------------------------ URGENCY → ACTION */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-fg px-6 py-16 text-bg sm:px-12 sm:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_120%,var(--accent),transparent)] opacity-70" />
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="display text-[36px] sm:text-[60px]">{t.hc.urgency.title}</h2>
              <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-[17px] leading-relaxed opacity-80 sm:text-[19px]">
                {t.hc.urgency.lines.map((x) => <p key={x}>{x}</p>)}
              </div>
              <div data-cta className="mt-9 flex justify-center">
                <TrackedLink href={register()} event="cta_click" placement="final" variant="inverse" className="w-full sm:w-auto">
                  {t.hc.urgency.cta} <ArrowRight className="flip-rtl size-4" />
                </TrackedLink>
              </div>
              <p className="mx-auto mt-6 max-w-xl text-[14px] opacity-60">{t.hc.urgency.reminder}</p>
              <p className="mx-auto mt-8 max-w-xl text-[11px] leading-relaxed opacity-50">{t.common.illustrationOnly}</p>
            </div>
          </div>
        </section>
      </main>
      <StickyCta href={register()} />
    </>
  );
}
