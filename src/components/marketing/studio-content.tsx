import Image from "next/image";
import { ArrowDown, ArrowRight, CircleCheck, Inbox, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { MarketContent } from "@/content/markets";
import { publicFieldProof, type FieldProof } from "@/content/field-proof";
import type { Offer, Settings } from "@/lib/data/types";
import { fmt } from "@/i18n/format";
import { ProductMockup } from "./product-mockup";
import { LeadForm } from "./lead-form";
import { PricingPlans } from "./pricing-plans";
import { StudioSectionBeacon, StudioViewBeacon } from "./studio-tracking";
import { TrackedStudioLink } from "./tracked-studio-link";
import { StudioCapacitySignal } from "./studio-capacity";
import { TeamSection } from "./team-section";
import { StudioDemoShowcase } from "./studio-demo-showcase";
import studioHero from "../../../public/portfolio/maisonaurelia.webp";

export interface StudioContentProps {
  t: Dictionary;
  locale: Locale;
  offers: Offer[];
  settings: Settings;
  page?: string;
  referral?: string;
  referrerName?: string | null;
  market?: MarketContent | null;
  pitch?: "default" | "premium" | "automation";
  ctaVariant?: "request" | "call";
}

const DEMO_SHOWCASE = [
  { image: "/portfolio/maisonaurelia.webp", mobile: "/portfolio/maisonaurelia-mobile.webp" },
  { image: "/portfolio/autosold.webp", mobile: "/portfolio/autosold-mobile.webp" },
  { image: "/portfolio/pizzaflash.webp", mobile: "/portfolio/pizzaflash-mobile.webp" },
] as const;

export function StudioContent({ t, locale, offers, settings, page, referral, referrerName, market, pitch = "default", ctaVariant = "request" }: StudioContentProps) {
  const s = t.studio;
  const cta = ctaVariant === "call" ? t.dash.link.page.ctaCall : s.cta;
  const heroSub = pitch === "automation" ? s.automationBody : market?.why ?? s.heroSubtitle;
  const proofs = publicFieldProof();

  return (
    <main>
      <StudioViewBeacon />
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_82%_20%,var(--accent-soft),transparent)]" />
        <div className="mx-auto grid min-h-[760px] max-w-7xl gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[12px] font-semibold text-fg-2 shadow-sm"><span className="size-1.5 rounded-full bg-success" />{market?.name ?? s.eyebrow}</p>
            {referrerName && <p className="mt-3 flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent"><Sparkles className="size-3.5" />{fmt(s.referredBy, { name: referrerName })}</p>}
            <h1 className="display mt-7 max-w-[720px] text-balance text-[48px] sm:text-[68px] lg:text-[76px]">
              {pitch === "premium" && market ? market.angle : s.heroTitle}<br />
              {!(pitch === "premium" && market) && <span className="text-gradient">{s.heroTitle2}</span>}
            </h1>
            <p className="mt-7 max-w-xl text-[18px] leading-relaxed text-fg-2 sm:text-[20px]">{heroSub}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <TrackedStudioLink href="#journey" placement="hero_demo" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-[15px] font-medium text-accent-fg shadow-[0_12px_32px_-12px_var(--accent)] transition hover:brightness-110">{s.ctaSecondary}<ArrowDown className="size-4" /></TrackedStudioLink>
              <TrackedStudioLink href="#demos" placement="hero_offer_demos" className="inline-flex h-12 items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-7 text-[15px] font-medium text-accent transition hover:bg-accent hover:text-accent-fg"><Sparkles className="size-4" />{locale === "fr" ? "Essayer les démos" : "Try the demos"}</TrackedStudioLink>
              <TrackedStudioLink href="#request" placement="hero_request" className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface px-7 text-[15px] font-medium hover:bg-surface-2">{cta}<ArrowRight className="flip-rtl size-4" /></TrackedStudioLink>
            </div>
            <StudioCapacitySignal t={t} settings={settings} className="mt-7 max-w-lg" />
          </div>

          <div className="relative mx-auto w-full max-w-[680px] pb-10 lg:pb-0">
            <div className="absolute inset-10 -z-10 rounded-full bg-accent/15 blur-[90px]" />
            <figure className="relative ms-auto w-[88%] overflow-hidden rounded-[28px] border border-white/70 bg-surface shadow-lift sm:w-[82%]">
              <Image src={studioHero} alt={s.features[0].body} loading="eager" sizes="(min-width: 1024px) 48vw, 90vw" className="aspect-[16/10] w-full object-cover object-top" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-14 text-[13px] font-medium text-white">1 · {s.features[0].title}</figcaption>
            </figure>
            <div className="relative -mt-10 w-[72%] rounded-[24px] border border-line bg-surface p-5 shadow-lift sm:-ms-5 sm:w-[66%]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">2 · {s.features[1].title}</p>
              <div className="mt-4 grid gap-2.5"><span className="h-9 rounded-xl border border-line bg-surface-2" /><span className="h-9 rounded-xl border border-line bg-surface-2" /><span className="h-16 rounded-xl border border-line bg-surface-2" /><span className="h-10 rounded-full bg-fg" /></div>
            </div>
            <div className="relative -me-2 -mt-12 ms-auto w-[78%] rounded-[24px] border border-line bg-surface p-5 shadow-lift sm:w-[70%]">
              <div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">3 · {s.features[3].title}</p><span className="rounded-full bg-success-soft px-2 py-1 text-[10px] font-semibold text-success">{s.journey[2]}</span></div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2 p-4"><span className="grid size-10 place-items-center rounded-full bg-accent-soft font-semibold text-accent">SM</span><div className="min-w-0 flex-1"><p className="font-semibold">Sophie Martin</p><p className="truncate text-[12px] text-muted">Projet · 50 000–100 000 CHF</p></div><Inbox className="size-5 text-accent" /></div>
              <p className="mt-3 text-[11px] text-muted">{s.demoOnly}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="lg:sticky lg:top-24"><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">{s.problemTitle}</p><h2 className="display mt-4 text-balance text-[40px] sm:text-[58px]">{s.heroTitle}</h2><p className="mt-6 max-w-lg text-[17px] leading-relaxed text-fg-2">{market?.problem ?? s.problemBody}</p></div>
          <div className="overflow-hidden rounded-[32px] bg-[#0b1020] p-6 text-white shadow-lift sm:p-9">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">{s.problemTitle}</p>
            <ul className="mt-5 divide-y divide-white/10">{s.problems.map((problem) => <li key={problem} className="flex items-center gap-3 py-4 text-[15px]"><span className="size-2 rounded-full bg-orange-400" />{problem}</li>)}</ul>
            <div className="mt-8 rounded-[24px] bg-white p-5 text-[#111114]"><p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Studio ATS</p><ol className="mt-4 grid gap-3 sm:grid-cols-3">{s.journey.slice(0, 3).map((step, index) => <li key={step} className="flex items-center gap-3 rounded-2xl bg-[#f4f4f7] p-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">{index + 1}</span><span className="text-[13px] font-semibold">{step}</span></li>)}</ol></div>
          </div>
        </div>
      </section>

      <Showcase t={t} locale={locale} proofs={proofs} />

      <StudioDemoShowcase locale={locale} />

      <section id="journey" className="scroll-mt-20 border-y border-line bg-surface-2/55 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end"><h2 className="display text-balance text-[42px] sm:text-[62px]">{s.journeyTitle}<br /><span className="text-gradient">{s.heroTitle2}</span></h2><p className="max-w-xl text-[17px] leading-relaxed text-fg-2 lg:justify-self-end">{s.productBody}</p></div>
          <div className="mt-16 grid gap-14">
            <JourneyStep number="01" title={s.features[0].title} body={s.features[0].body} image="/portfolio/maisonaurelia.webp" imageAlt={s.features[0].body} />
            <JourneyStep number="02" title={s.features[1].title} body={s.features[1].body} image="/portfolio/autosold.webp" imageAlt={s.features[1].body} reverse />
            <div className="grid gap-8 lg:grid-cols-[0.3fr_0.7fr] lg:items-center"><div><p className="tabular text-[13px] font-semibold text-accent">03</p><h3 className="mt-3 text-[28px] font-semibold tracking-tight">{s.features[3].title}</h3><p className="mt-3 text-[15px] leading-relaxed text-muted">{s.features[3].body}</p></div><div className="rounded-[30px] border border-line bg-surface p-4 shadow-lift sm:p-7"><ProductMockup /></div></div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <StudioSectionBeacon event="studio_demo_interaction" placement="product_tour_seen" />
        <div className="max-w-3xl"><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">{s.productTitle}</p><h2 className="display mt-4 text-balance text-[42px] sm:text-[62px]">{s.featuresTitle}</h2></div>
        <ul className="mt-12 grid gap-x-10 border-y border-line md:grid-cols-2">{s.features.map((feature) => <li key={feature.title} className="flex gap-4 border-b border-line py-6 md:[&:nth-last-child(-n+2)]:border-b-0"><CircleCheck className="mt-0.5 size-5 shrink-0 text-accent" /><div><h3 className="font-semibold">{feature.title}</h3><p className="mt-1.5 text-[14px] leading-relaxed text-muted">{feature.body}</p></div></li>)}</ul>
      </section>

      <TeamSection t={t} />

      <section id="how" className="border-y border-white/10 bg-[#071020] py-20 text-white sm:py-28"><div className="mx-auto max-w-6xl px-4 sm:px-6"><h2 className="display text-[42px] sm:text-[62px]">{s.howTitle}</h2><ol className="mt-12 grid gap-px overflow-hidden rounded-[28px] bg-white/10 md:grid-cols-4">{s.how.map((step, index) => <li key={step.title} className="bg-[#071020] p-7 sm:p-8"><span className="tabular text-[12px] font-semibold text-blue-300">0{index + 1}</span><h3 className="mt-8 text-[20px] font-semibold text-white">{step.title}</h3><p className="mt-3 text-[14px] leading-relaxed text-white/65">{step.body}</p></li>)}</ol></div></section>

      <section id="pricing" className="scroll-mt-20 bg-surface-2/60 py-20 sm:py-28"><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mx-auto max-w-3xl text-center"><h2 className="display text-[42px] sm:text-[62px]">{s.pricingTitle}</h2><p className="mt-5 text-[17px] text-muted">{t.pricing.subtitle}</p></div><div className="mt-12"><PricingPlans t={t} locale={locale} offers={offers} page={page} referral={referral} requestHref="#request" requestLabel={cta} detailed={false} capacity={settings} /></div><p className="mt-6 text-center text-[12px] text-muted">{s.pricingNote}</p></div></section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28"><h2 className="display text-[42px] sm:text-[58px]">{s.faqTitle}</h2><div className="mt-8 divide-y divide-line border-y border-line">{s.faq.map((item) => <details key={item.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">{item.q}<span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{item.a}</p></details>)}</div></section>

      <section id="request" className="relative scroll-mt-20 overflow-hidden bg-[#071020] px-4 py-20 text-white sm:px-6 sm:py-28"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_0%_100%,rgb(47_91_255_/_0.35),transparent)]" /><div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"><div><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-300">{s.eyebrow}</p><h2 className="display mt-4 text-balance text-[44px] sm:text-[64px]">{s.formTitle}</h2><p className="mt-6 max-w-md text-[18px] leading-relaxed text-white/65">{s.formSubtitle}</p><StudioCapacitySignal t={t} settings={settings} dark className="mt-7 max-w-md" /></div><div className="theme-light-surface rounded-[30px] bg-white p-6 shadow-lift sm:p-9"><LeadForm page={page} referral={referral} cta={cta} /></div></div></section>
    </main>
  );
}

function JourneyStep({ number, title, body, image, imageAlt, reverse = false }: { number: string; title: string; body: string; image: string; imageAlt: string; reverse?: boolean }) {
  return <article className="grid gap-8 lg:grid-cols-[0.3fr_0.7fr] lg:items-center"><div className={reverse ? "lg:order-2" : ""}><p className="tabular text-[13px] font-semibold text-accent">{number}</p><h3 className="mt-3 text-[28px] font-semibold tracking-tight">{title}</h3><p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p></div><div className={reverse ? "lg:order-1" : ""}><Image src={image} alt={imageAlt} width={1280} height={800} sizes="(min-width: 1024px) 60vw, 100vw" className="aspect-[16/10] w-full rounded-[30px] border border-line object-cover object-top shadow-lift" /></div></article>;
}

function Showcase({ t, locale, proofs }: { t: Dictionary; locale: Locale; proofs: FieldProof[] }) {
  const items = proofs.length ? proofs.map((p) => ({ image: p.screenshot, mobile: undefined, name: p.name, label: p.sector[locale] ?? p.sector.en, url: p.url })) : DEMO_SHOWCASE.map((demo, index) => ({ ...demo, name: `${t.studio.eyebrow} · ${t.studio.features[index].title}`, label: t.studio.demoOnly, url: undefined }));
  return <section className="overflow-hidden py-20 sm:py-28"><StudioSectionBeacon event="studio_proof_view" placement={proofs.length ? "verified_projects" : "studio_examples"} /><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="grid gap-6 lg:grid-cols-2 lg:items-end"><h2 className="display text-balance text-[42px] sm:text-[62px]">{t.studio.productTitle}<br /><span className="text-gradient">{t.studio.features[0].title}</span></h2><p className="max-w-xl text-[16px] leading-relaxed text-muted lg:justify-self-end">{proofs.length ? t.hc.proof.subtitle : t.studio.demoOnly}</p></div></div><ul className="no-scrollbar mx-auto mt-12 flex max-w-[1600px] snap-x gap-4 overflow-x-auto px-4 pb-4 sm:px-6">{items.map((item, index) => item.image && <li key={`${item.name}-${index}`} className="w-[86%] shrink-0 snap-start sm:w-[58%] lg:w-[38%]"><a href={item.url} target={item.url ? "_blank" : undefined} rel={item.url ? "noopener" : undefined} className="group block"><div className="overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft"><picture>{item.mobile && <source media="(max-width: 639px)" srcSet={item.mobile} />}<Image src={item.image} alt={item.name} width={1280} height={800} sizes="(min-width: 1024px) 38vw, (min-width: 640px) 58vw, 86vw" className="aspect-[16/10] w-full object-cover object-top transition duration-500 group-hover:scale-[1.015]" /></picture></div><p className="mt-4 font-semibold">{item.name}</p><p className="mt-1 text-[13px] text-muted">{item.label}</p></a></li>)}</ul></section>;
}
