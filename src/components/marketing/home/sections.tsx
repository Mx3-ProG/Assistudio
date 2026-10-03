import Link from "next/link";
import {
  ArrowRight, Check, BookOpen, Target, Phone, MessageCircle, Camera, Mail, ShieldQuestion, Presentation, MonitorPlay,
  PanelsTopLeft, FileText, SquareKanban, GraduationCap, LifeBuoy, Handshake, Briefcase, Laptop, Rocket, PenTool,
  Layers, Network, Code2, UserRound,
} from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { JsonLd } from "@/lib/seo";
import type { AttributionModel } from "@/lib/attribution";
import { TrackedLink } from "./tracked-link";
import { SectionHead } from "./section-head";

/** "You bring the relationship. Studio brings the expertise." — kills the "I'm not a developer" objection. */
export function RelationSplit({ t }: { t: Dictionary }) {
  const S = t.hc.split;
  return (
    <>
      <h2 className="display max-w-3xl text-[34px] sm:text-[52px]">
        {S.title1}<br /><span className="text-gradient">{S.title2}</span>
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-[1fr_1.35fr]">
        <div className="card p-6 sm:p-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{S.youLabel}</p>
          <ul className="mt-4 grid gap-2.5">
            {S.you.map((x) => (
              <li key={x} className="flex items-center gap-3 text-[16px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2"><Check className="size-3.5" /></span>{x}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-[var(--radius)] bg-fg p-6 text-bg sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,var(--accent),transparent)] opacity-50" />
          <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] opacity-60">{S.studioLabel}</p>
          <ul className="relative mt-4 grid gap-2.5 sm:grid-cols-2">
            {S.studio.map((x) => (
              <li key={x} className="flex items-center gap-3 text-[16px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bg/15"><Check className="size-3.5" /></span>{x}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-8 max-w-3xl text-[19px] font-medium leading-snug sm:text-[22px]">
        {S.conclusion1} <span className="text-muted">{S.conclusion2}</span>
      </p>
    </>
  );
}

const CENTER_ICONS = [BookOpen, Target, Phone, MessageCircle, Camera, Mail, ShieldQuestion, Presentation, MonitorPlay, PanelsTopLeft, FileText, SquareKanban, GraduationCap];

/** The Sales Center: what an ambassador gets the day they sign up. */
export function SalesCenterBlock({ t, ctaHref }: { t: Dictionary; ctaHref: string }) {
  const C = t.hc.center;
  return (
    <>
      <SectionHead eyebrow={C.eyebrow} title={C.title} subtitle={C.subtitle} />
      <ul className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 lg:grid-cols-4">
        {C.items.map((x, i) => {
          const Icon = CENTER_ICONS[i] ?? Check;
          return (
            <li key={x} className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-3 py-3 text-[13.5px] font-medium leading-tight sm:gap-3 sm:px-4 sm:py-3.5 sm:text-[14.5px]">
              <Icon className="size-[18px] shrink-0 text-accent" aria-hidden />{x}
            </li>
          );
        })}
      </ul>
      <div className="mt-8">
        <TrackedLink href={ctaHref} event="sales_center_click" placement="sales_center" variant="primary" className="w-full sm:w-auto">
          {C.cta} <ArrowRight className="flip-rtl size-4" />
        </TrackedLink>
      </div>
    </>
  );
}

/** "Found someone interested?" — hand the opportunity over to Studio, attribution kept. */
export function HandoffBlock({ t, ctaHref }: { t: Dictionary; ctaHref: string }) {
  const H = t.hc.handoff;
  return (
    <div className="card relative overflow-hidden border-accent/30 p-6 sm:p-10">
      <div className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent"><LifeBuoy className="size-4" />{H.eyebrow}</p>
          <h2 className="display mt-3 text-[32px] sm:text-[46px]">{H.title}</h2>
          <p className="mt-5 text-[19px] font-medium leading-snug">{H.lines[0]}<br />{H.lines[1]}</p>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-fg-2">{H.body}</p>
        </div>
        <div className="grid gap-4">
          <p className="flex gap-3 rounded-2xl bg-success-soft p-4 text-[14.5px] leading-relaxed text-success">
            <Handshake className="mt-0.5 size-5 shrink-0" aria-hidden />{H.keep}
          </p>
          <TrackedLink href={ctaHref} event="cta_click" placement="handoff" className="w-full">
            {H.cta} <ArrowRight className="flip-rtl size-4" />
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}

const WHO_ICONS = [Briefcase, Presentation, Laptop, Rocket, PenTool, Layers, GraduationCap, Network, Code2];

/** "No need to be an influencer." */
export function AmbassadorProfiles({ t }: { t: Dictionary }) {
  const W = t.hc.who;
  return (
    <>
      <SectionHead eyebrow={W.eyebrow} title={W.title} />
      <ul className="mt-8 grid grid-cols-2 gap-2 sm:mt-10 lg:grid-cols-3">
        {W.profiles.map((p, i) => {
          const Icon = WHO_ICONS[i] ?? UserRound;
          return (
            <li key={p.name} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3.5 sm:flex-row sm:items-start sm:gap-3 sm:p-4">
              <Icon className="size-[18px] shrink-0 text-accent sm:mt-0.5" aria-hidden />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-snug sm:text-[15px]">{p.name}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-muted sm:text-[13.5px]">{p.hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 max-w-3xl text-[19px] font-medium leading-snug sm:text-[22px]">{W.body}</p>
    </>
  );
}

export interface FaqFacts {
  rate: string;
  window: number;
  validation: number;
  model: AttributionModel;
}

/** Objection FAQ. Answers come from the partner terms; numbers from live settings and offers. */
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
