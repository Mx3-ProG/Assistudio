import { Check, X as XIcon, Plug, Zap, ArrowRight, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { MarketContent } from "@/content/markets";
import { formatMoney } from "@/lib/money";
import { fmt } from "@/i18n/format";
import { ProductMockup } from "./product-mockup";
import { LeadForm } from "./lead-form";

export interface StudioContentProps {
  t: Dictionary;
  locale: Locale;
  priceCents: number;
  /** Private sales page context */
  page?: string;
  referrerName?: string | null;
  market?: MarketContent | null;
  pitch?: "default" | "premium" | "automation";
  ctaVariant?: "request" | "call";
}

export function StudioContent({ t, locale, priceCents, page, referrerName, market, pitch = "default", ctaVariant = "request" }: StudioContentProps) {
  const s = t.studio;
  const cta = ctaVariant === "call" ? t.dash.link.page.ctaCall : s.cta;
  const heroSub = pitch === "automation" ? s.automationBody : market?.why ?? s.heroSubtitle;

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent)]" />
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-24">
          {referrerName && (
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[12px] font-medium text-fg-2">
              <Sparkles className="size-3.5 text-accent" /> {fmt(s.referredBy, { name: referrerName })}
            </p>
          )}
          {market && <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{market.name}</p>}
          <h1 className="display animate-rise text-[40px] sm:text-[72px]">
            {pitch === "premium" && market ? market.angle : s.heroTitle}
            {!(pitch === "premium" && market) && (
              <>
                <br />
                <span className="text-gradient">{s.heroTitle2}</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-relaxed text-fg-2 sm:text-[20px]">{heroSub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="#request" className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-[15px] font-medium text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] transition hover:brightness-110">
              {cta} <ArrowRight className="flip-rtl size-4" />
            </a>
            <a href="#how" className="inline-flex h-12 items-center rounded-full border border-line bg-surface-2 px-7 text-[15px] font-medium hover:bg-surface-3">
              {s.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="display text-[34px] sm:text-[52px]">{s.problemTitle}</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-fg-2">{market?.problem ?? s.problemBody}</p>
          </div>
          <ul className="grid gap-3">
            {s.problems.map((p) => (
              <li key={p} className="card flex items-center gap-4 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-danger-soft text-danger"><XIcon className="size-4" /></span>
                <span className="text-[15px]">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRODUCT */}
      <section id="features" className="scroll-mt-20 bg-surface-2/60 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="display text-[34px] sm:text-[52px]">{s.productTitle}</h2>
            <p className="mt-4 text-[17px] text-muted">{s.productBody}</p>
          </div>
          <ProductMockup />
          <h3 className="mt-20 max-w-2xl text-[24px] font-semibold tracking-tight sm:text-[30px]">{s.featuresTitle}</h3>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {s.features.map((f) => (
              <li key={f.title} className="card p-5">
                <p className="text-[16px] font-semibold">{f.title}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-center text-[34px] sm:text-[52px]">{s.journeyTitle}</h2>
        <ol className="mt-12 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {s.journey.map((step, i) => (
            <li key={step} className="flex flex-1 items-center gap-2 sm:flex-col">
              <div className="card flex w-full items-center gap-3 p-4 sm:flex-col sm:py-6 sm:text-center">
                <span className="tabular grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[13px] font-semibold text-white">{i + 1}</span>
                <span className="text-[15px] font-semibold">{step}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* AUTOMATION + INTEGRATIONS */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:px-6 sm:pb-24 md:grid-cols-2">
        <div className="card p-7 sm:p-9">
          <Zap className="size-6 text-accent" />
          <h3 className="mt-6 text-[24px] font-semibold tracking-tight">{s.automationTitle}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.automationBody}</p>
        </div>
        <div className="card p-7 sm:p-9">
          <Plug className="size-6 text-accent" />
          <h3 className="mt-6 text-[24px] font-semibold tracking-tight">{s.integrationsTitle}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.integrationsBody}</p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-20 bg-surface-2/60 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="display text-center text-[34px] sm:text-[52px]">{s.pricingTitle}</h2>
          <div className="glass mx-auto mt-12 max-w-xl rounded-[28px] p-8 shadow-lift sm:p-10">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">STUDIO</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="tabular text-[56px] font-semibold tracking-[-0.04em]">{formatMoney(priceCents, locale)}</span>
              <span className="text-muted">{s.pricingPeriod}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {s.pricingIncludes.map((i) => (
                <li key={i} className="flex items-start gap-3 text-[15px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {i}
                </li>
              ))}
            </ul>
            <a href="#request" className="mt-8 flex h-12 items-center justify-center rounded-full bg-fg text-[15px] font-medium text-bg hover:opacity-90">{cta}</a>
            <p className="mt-4 text-center text-[12px] text-muted">{s.pricingNote}</p>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="display text-[34px] sm:text-[52px]">{s.howTitle}</h2>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {s.how.map((h, i) => (
            <li key={h.title} className="card p-6">
              <span className="tabular text-[13px] font-semibold text-accent">0{i + 1}</span>
              <p className="mt-3 text-[18px] font-semibold">{h.title}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{h.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="display text-[34px] sm:text-[52px]">{s.faqTitle}</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {s.faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* REQUEST */}
      <section id="request" className="scroll-mt-20 px-4 pb-24 sm:px-6">
        <div className="card mx-auto max-w-3xl p-6 shadow-lift sm:p-10">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-[36px]">{s.formTitle}</h2>
          <p className="mt-2 text-muted">{s.formSubtitle}</p>
          <div className="relative mt-8">
            <LeadForm page={page} cta={cta} />
          </div>
        </div>
      </section>
    </main>
  );
}
