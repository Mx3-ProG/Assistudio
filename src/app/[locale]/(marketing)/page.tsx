import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { repo } from "@/lib/data";
import { pageMetadata, JsonLd } from "@/lib/seo";
import { env, isProductionDeployment } from "@/lib/env";
import { computeCommissionCents } from "@/lib/commission";
import { formatPercent } from "@/lib/money";
import { publicFieldProof } from "@/content/field-proof";
import { partnerDemo } from "@/content/partner-demo";
import { Navbar } from "@/components/marketing/navbar";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { Money } from "@/components/ui/money";
import { TrackedLink } from "@/components/marketing/home/tracked-link";
import { SectionHead } from "@/components/marketing/home/section-head";
import { PartnerJourney } from "@/components/marketing/home/partner-journey";
import { ProductDemoMacbook } from "@/components/marketing/home/product-demo-macbook";
import { HowItWorks } from "@/components/marketing/home/how-it-works";
import { StudioFlow } from "@/components/marketing/home/studio-flow";
import { DemoButton } from "@/components/marketing/home/demo-button";
import { FieldProof } from "@/components/marketing/home/field-proof";
import { CommissionSimulator } from "@/components/marketing/home/commission-simulator";
import { SupportSection, WhyPartner, AttributionRules, HomeFaq } from "@/components/marketing/home/sections";
import { StickyCta } from "@/components/marketing/home/sticky-cta";
import { HomeView } from "@/components/marketing/home/home-view";
import { TeamSection } from "@/components/marketing/team-section";
import { StudioDemoShowcase } from "@/components/marketing/studio-demo-showcase";
import { AmbassadorProof } from "@/components/proof/ambassador-proof";
import { publicProofEvents, publicTestimonials } from "@/lib/proof-server";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  return pageMetadata(locale, "", t.meta.homeTitle, t.meta.homeDescription);
}

/**
 * Partner home. One mental path, one function per section:
 * promise → how it works → the real partner space (video) → what you sell → how Studio helps you sell →
 * how much you could earn → why you can trust it → objections → sign-up.
 * One sign-up CTA label everywhere (`hc.cta`). Every money figure is computed
 * from `public.offers` and settings, and labelled as illustrative.
 */
export default async function PartnerHome({ params }: PageProps<"/[locale]">) {
  const { locale } = (await params) as { locale: Locale };
  const t = await getDictionary(locale);
  const [offer, offers, settings, proofEvents, homeTestimonials] = await Promise.all([
    repo().getOffer(), repo().listOffers(), repo().getSettings(), publicProofEvents(6), publicTestimonials({ placement: "home" }),
  ]);
  const commission = computeCommissionCents(offer.priceCents, offer.commissionRate);
  const rate = formatPercent(offer.commissionRate, locale, 0);
  const p = (path: string) => `/${locale}${path}`;
  // Sign-up first, then straight to the page the CTA promised (see verifyCode → welcome?next=).
  const register = (next?: string) => (next ? `${p("/register")}?next=${encodeURIComponent(p(next))}` : p("/register"));
  const H = t.hc.hero;
  const D = t.hc.demo;
  const proofs = publicFieldProof();
  const simOffers = offers.map((o) => ({
    tier: o.tier, name: t.pricing.plans[o.tier].name, priceCents: o.priceCents, currency: o.currency, interval: o.interval, rate: o.commissionRate,
  }));
  const facts = { rate, window: settings.attributionWindowDays, validation: settings.commissionValidationDays, model: settings.attributionModel };
  const band = "scroll-mt-20 bg-surface-2/60 py-14 sm:py-24";
  const plain = "mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-24";

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Studio ATS", url: `${env.siteUrl}/${locale}` }} />
      <HomeView />
      <Navbar />
      <main>
        {/* ------------------------------------------------------------ 1. PROMISE: what, what to do, what you earn, what it costs */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent)]" />
          {/* Phones: promise → CTA → cost/commission figures → journey. Desktop: journey beside the promise, figures below. */}
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-6 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-[1.2fr_1fr] lg:gap-x-14 lg:gap-y-16 lg:pt-20">
            <div className="animate-rise">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-[12px] font-medium text-fg-2">
                <span className="animate-pulse-dot size-1.5 rounded-full bg-success" />
                {H.eyebrow}
              </p>
              <h1 className="display text-[40px] sm:text-[60px] lg:text-[68px]">
                {H.title1}
                <br />
                <span className="text-gradient">{fmt(H.title2, { rate })}</span>
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-fg-2 sm:text-[19px]">{H.lead}</p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] font-medium">
                {H.reassurance.map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="size-4 text-success" aria-hidden />{x}</li>)}
              </ul>
              <div data-cta className="mt-7">
                <TrackedLink href={register()} event="hero_signup_click" placement="hero" className="w-full sm:w-auto">
                  {t.hc.cta} <ArrowRight className="flip-rtl size-4" />
                </TrackedLink>
              </div>
            </div>
            <div className="order-last lg:order-none"><PartnerJourney t={t} demoHref={partnerDemo.videoSrc ? "#demo" : undefined} /></div>
            <dl className="glass grid grid-cols-1 lg:col-span-2 divide-y divide-line overflow-hidden rounded-[24px] shadow-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {[
                { label: H.costLabel, value: <Money cents={0} sourceCurrency={offer.currency} />, hint: H.costHint },
                { label: H.rateLabel, value: rate, hint: H.rateHint },
                { label: H.maxLabel, value: <MoneyText template={H.maxValue} cents={commission} currency={offer.currency} />, hint: H.maxHint },
              ].map((x) => (
                <div key={x.label} className="px-5 py-4 sm:px-6 sm:py-6">
                  <dt className="text-[13px] text-muted">{x.label}</dt>
                  <dd className="tabular mt-1 text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">{x.value}</dd>
                  <dd className="mt-0.5 text-[13px] leading-snug text-muted">{x.hint}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------------ 2. HOW IT WORKS */}
        <section id="how" className={plain}>
          <SectionHead eyebrow={t.hc.how.eyebrow} title={t.hc.how.title} />
          <HowItWorks t={t} />
        </section>

        {/* ------------------------------------------------------------ 2b. PROOF IT WORKS: the real partner space, on video */}
        {(partnerDemo.videoSrc || !isProductionDeployment) && (
          <section id="demo" className="relative scroll-mt-20 overflow-hidden px-4 py-14 sm:px-6 sm:py-24">
            <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[70%] bg-[radial-gradient(50%_50%_at_50%_50%,var(--accent-soft),transparent)]" />
            <SectionHead eyebrow={D.eyebrow} title={D.title} subtitle={D.subtitle} center className="max-w-3xl" />
            <div className="mt-10 sm:mt-14">
              <ProductDemoMacbook
                videoSrc={partnerDemo.videoSrc} webmSrc={partnerDemo.webmSrc} posterSrc={partnerDemo.posterSrc}
                autoplay={partnerDemo.autoplay} loop={partnerDemo.loop} hasAudio={partnerDemo.hasAudio}
                screenRatio={partnerDemo.screenRatio} fit={partnerDemo.fit}
                labels={D} annotations={D.annotations}
              />
            </div>
            <div className="mx-auto mt-12 max-w-2xl text-center sm:mt-16">
              <p className="text-[20px] font-semibold leading-snug tracking-[-0.01em] sm:text-[24px]">
                {D.after1}<br /><span className="text-muted">{D.after2}</span>
              </p>
              <div data-cta className="mt-7 flex justify-center">
                <TrackedLink href={register()} event="cta_click" placement="demo" className="w-full sm:w-auto">
                  {D.cta} <ArrowRight className="flip-rtl size-4" />
                </TrackedLink>
              </div>
              <p className="mt-4 text-[13px] text-muted">{D.reassurance}</p>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------ 3. WHAT YOU'LL SELL */}
        <section id="sell" className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow={t.hc.sell.eyebrow} title={t.hc.sell.title} subtitle={t.hc.sell.subtitle} />
            <div className="mt-8 sm:mt-10"><StudioFlow t={t} /></div>
            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{fmt(t.hc.sell.offersLabel, { rate })}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {offers.map((o) => (
                  <li key={o.tier} className="rounded-full border border-line bg-surface px-4 py-2 text-[14px]">
                    <span className="font-semibold">{t.pricing.plans[o.tier].name}</span>{" "}
                    <span className="tabular text-muted"><Money cents={o.priceCents} sourceCurrency={o.currency} /> {o.interval === "one_time" ? t.hc.sell.oneTime : t.hc.sell.perYear}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink href={p("/studio")} event="studio_demo_click" placement="discover" variant="secondary" className="w-full sm:w-auto">
                {t.hc.sell.discover} <ArrowRight className="flip-rtl size-4" />
              </TrackedLink>
              {env.studioDemoUrl && <DemoButton url={env.studioDemoUrl} label={t.hc.sell.demo} closeLabel={t.hc.sell.demoClose} />}
            </div>
            {/* What the partner sells, to try first-hand: the same interactive demos as the client page. */}
            <div className="mt-14 border-t border-line pt-12 sm:mt-16 sm:pt-14">
              <StudioDemoShowcase locale={locale} compact />
            </div>
            {/* The flow above already explains Studio on phones; the real-interface tour is for larger screens. */}
            <div className="mt-12 hidden md:block"><ProductMockup /></div>
          </div>
        </section>

        {/* ------------------------------------------------------------ 4. YOU'RE NOT ON YOUR OWN */}
        <section id="sales-center" className={plain}>
          <SupportSection t={t} ctaHref={register("/dashboard/sales-center")} />
        </section>

        {/* ------------------------------------------------------------ 5. HOW MUCH */}
        <section id="simulator" className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead eyebrow={t.hc.sim.eyebrow} title={t.hc.sim.title} subtitle={t.hc.sim.subtitle} />
            <div className="mt-8 sm:mt-10"><CommissionSimulator offers={simOffers} ctaHref={register()} /></div>
          </div>
        </section>

        {/* ------------------------------------------------------------ 6. TRUST: guaranteed terms, attribution, real proof */}
        <section id="why" className={plain}>
          <WhyPartner t={t} rate={rate} />
        </section>

        <section id="attribution" className={band}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <AttributionRules t={t} facts={facts} />
          </div>
        </section>

        {/* How a recommendation becomes a payment (labelled simulation) + real anonymised payouts + reviews placed on the home. */}
        <AmbassadorProof t={t} locale={locale} validationDays={settings.commissionValidationDays} events={proofEvents} testimonials={homeTestimonials}
          offer={{ name: t.pricing.plans[offer.tier].name, priceCents: offer.priceCents, commissionRate: offer.commissionRate, currency: offer.currency }} />

        {/* Verified references only: renders nothing until one has documented client consent. */}
        <FieldProof t={t} locale={locale} proofs={proofs} />

        <TeamSection t={t} />

        {/* ------------------------------------------------------------ 7. OBJECTIONS */}
        <section id="faq" className={plain}>
          <HomeFaq t={t} locale={locale} facts={facts} />
        </section>

        {/* ------------------------------------------------------------ 8. SIGN-UP */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-fg px-6 py-16 text-bg sm:px-12 sm:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_120%,var(--accent),transparent)] opacity-70" />
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="display text-[38px] sm:text-[60px]">{t.hc.final.title}</h2>
              <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed opacity-80 sm:text-[19px]">{t.hc.final.line}</p>
              <div data-cta className="mt-9 flex justify-center">
                <TrackedLink href={register()} event="cta_click" placement="final" variant="inverse" className="w-full sm:w-auto">
                  {t.hc.cta} <ArrowRight className="flip-rtl size-4" />
                </TrackedLink>
              </div>
              <p className="mt-5 text-[14px] opacity-60">{t.hc.final.reminder}</p>
              <p className="mx-auto mt-8 max-w-xl text-[11px] leading-relaxed opacity-50">{t.common.illustrationOnly}</p>
            </div>
          </div>
        </section>
      </main>
      <StickyCta href={register()} />
    </>
  );
}

/** "Up to {commission}" with the amount rendered in the visitor's display currency. */
function MoneyText({ template, cents, currency }: { template: string; cents: number; currency: string }) {
  const [before, after = ""] = template.split("{commission}");
  return <>{before}<Money cents={cents} sourceCurrency={currency} />{after}</>;
}
