import Link from "next/link";
import {
  ArrowRight, Check, Phone, MessageCircle, Camera, Mail, ShieldQuestion, Presentation, PanelsTopLeft, FileText, SquareKanban,
  GraduationCap, LifeBuoy, Handshake, Link2, Activity, BadgeCheck, Repeat, ShieldCheck,
} from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { JsonLd } from "@/lib/seo";
import type { AttributionModel } from "@/lib/attribution";
import { TrackedLink } from "./tracked-link";
import { SectionHead } from "./section-head";

const CENTER_ICONS = [Phone, MessageCircle, Camera, Mail, ShieldQuestion, Presentation, FileText, PanelsTopLeft, SquareKanban, GraduationCap];

/**
 * "You're not on your own to sell": who does what, then what the Sales Center
 * already holds. Answers "how would I even sell software I barely know?".
 */
export function SupportSection({ t, ctaHref }: { t: Dictionary; ctaHref: string }) {
  const S = t.hc.support;
  return (
    <>
      <SectionHead eyebrow={S.eyebrow} title={S.title} subtitle={S.subtitle} />
      <div className="mt-8 grid gap-3 sm:mt-10 md:grid-cols-2 md:gap-4">
        <div className="card p-6 sm:p-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{S.partnerLabel}</p>
          <ul className="mt-4 grid gap-2.5">
            {S.partner.map((x) => (
              <li key={x} className="flex items-center gap-3 text-[16px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2"><Check className="size-3.5" aria-hidden /></span>{x}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-[var(--radius)] bg-fg p-6 text-bg sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,var(--accent),transparent)] opacity-50" />
          <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] opacity-60">{S.studioLabel}</p>
          <ul className="relative mt-4 grid gap-2.5">
            {S.studio.map((x) => (
              <li key={x} className="flex items-center gap-3 text-[16px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bg/15"><Check className="size-3.5" aria-hidden /></span>{x}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 flex gap-3 rounded-2xl bg-success-soft p-4 text-[14.5px] leading-relaxed text-success">
        <Handshake className="mt-0.5 size-5 shrink-0" aria-hidden />{S.keep}
      </p>

      <h3 className="mt-12 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{S.resourcesLabel}</h3>
      <ul className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {S.items.map((x, i) => {
          const Icon = CENTER_ICONS[i] ?? Check;
          return (
            <li key={x} className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3 py-3 text-[13.5px] font-medium leading-tight sm:gap-3 sm:px-4 sm:py-3.5 sm:text-[14.5px]">
              <Icon className="size-[18px] shrink-0 text-accent" aria-hidden />{x}
            </li>
          );
        })}
      </ul>
      <div data-cta className="mt-8">
        <TrackedLink href={ctaHref} event="sales_center_click" placement="sales_center" className="w-full sm:w-auto">
          {t.hc.cta} <ArrowRight className="flip-rtl size-4" />
        </TrackedLink>
      </div>
    </>
  );
}

/** "Why become a partner": only what the partner terms guarantee, scannable as a list of ticks. */
export function WhyPartner({ t, rate }: { t: Dictionary; rate: string }) {
  const W = t.hc.why;
  return (
    <>
      <SectionHead eyebrow={W.eyebrow} title={W.title} />
      <ul className="mt-8 grid gap-x-8 gap-y-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {W.items.map((x) => (
          <li key={x.title} className="flex gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-success"><Check className="size-3.5" aria-hidden /></span>
            <div>
              <p className="text-[16px] font-semibold leading-snug">{x.title}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-muted">{fmt(x.body, { rate })}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

const ATTRIBUTION_ICONS = [Link2, Activity, LifeBuoy, BadgeCheck, Repeat];

/** "Your prospects stay attributed to you": the real attribution rules, in plain words. */
export function AttributionRules({ t, facts }: { t: Dictionary; facts: FaqFacts }) {
  const A = t.hc.attribution;
  const vars = { rate: facts.rate, window: facts.window, validation: facts.validation, model: t.hc.faq.models[facts.model] };
  return (
    <>
      <SectionHead eyebrow={A.eyebrow} title={A.title} subtitle={A.subtitle} />
      <dl className="mt-8 grid gap-2.5 sm:mt-10 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
        {A.points.map((x, i) => {
          const Icon = ATTRIBUTION_ICONS[i] ?? ShieldCheck;
          return (
            <div key={x.q} className="card p-5 sm:p-6">
              <dt className="flex items-center gap-2.5 text-[15.5px] font-semibold leading-snug">
                <Icon className="size-[18px] shrink-0 text-accent" aria-hidden />{x.q}
              </dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-fg-2">{fmt(x.a, vars)}</dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-muted">{A.note}</p>
    </>
  );
}

export interface FaqFacts {
  rate: string;
  window: number;
  validation: number;
  model: AttributionModel;
}

/** Pre-sign-up objection FAQ. Answers come from the partner terms; numbers from live settings and offers. */
export function HomeFaq({ t, locale, facts }: { t: Dictionary; locale: Locale; facts: FaqFacts }) {
  const F = t.hc.faq;
  const vars = { rate: facts.rate, window: facts.window, validation: facts.validation, model: F.models[facts.model] };
  const items = F.items.map((x) => ({ q: x.q, a: fmt(x.a, vars) }));
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <SectionHead eyebrow={F.eyebrow} title={F.title} />
      <div className="mt-10 divide-y divide-line border-y border-line">
        {items.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-medium sm:text-[17px] [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <Link href={`/${locale}/faq`} className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline">
        {F.all}<ArrowRight className="flip-rtl size-4" />
      </Link>
    </>
  );
}
