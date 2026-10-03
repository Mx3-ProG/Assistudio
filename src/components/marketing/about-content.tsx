import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, Layers3, MessagesSquare, Workflow } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { AboutPageCopy } from "@/lib/marketing/trust-pages-copy";
import { buttonClass } from "@/components/ui/button";
import { TeamSection } from "./team-section";

const pillarIcons = [Layers3, MessagesSquare, Workflow, BarChart3];

export function AboutContent({ copy, locale, t }: { copy: AboutPageCopy; locale: Locale; t: Dictionary }) {
  const p = (path: string) => `/${locale}${path}`;

  return <>
    <section className="relative overflow-hidden border-b border-line bg-bg px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_38%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.eyebrow}</p>
          <h1 className="display mt-5 max-w-3xl text-balance text-[48px] leading-[0.95] text-fg sm:text-[72px]">{copy.title}</h1>
          <p className="mt-7 max-w-2xl text-[18px] leading-relaxed text-fg-2 sm:text-[20px]">{copy.intro}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={p("/studio")} className={buttonClass("primary", "lg")}>{copy.primary}<ArrowRight className="size-4" /></Link>
            <Link href={p("/contact")} className={buttonClass("secondary", "lg")}>{copy.secondary}</Link>
          </div>
        </div>
        <div className="relative min-h-[420px] sm:min-h-[520px]" aria-label="Démonstration Studio ATS">
          <div className="absolute left-0 top-0 w-[84%] overflow-hidden rounded-[28px] border border-line bg-surface shadow-2xl">
            <Image src="/showcase/contacts-book.webp" alt="" width={2048} height={946} sizes="(max-width: 1024px) 75vw, 520px" priority className="h-auto w-full" />
          </div>
          <div className="absolute bottom-0 right-0 w-[72%] overflow-hidden rounded-[24px] border-[6px] border-bg bg-surface shadow-2xl">
            <Image src="/showcase/appointment-calendar.webp" alt="" width={2048} height={1228} sizes="(max-width: 1024px) 65vw, 440px" className="h-auto w-full" />
          </div>
          <span className="absolute bottom-6 left-2 rounded-full border border-line bg-bg/95 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-fg shadow-lg">Démonstration Studio</span>
        </div>
      </div>
    </section>

    <section className="bg-surface px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.originEyebrow}</p>
        <div>
          <h2 className="display text-balance text-[40px] leading-tight text-fg sm:text-[58px]">{copy.originTitle}</h2>
          <p className="mt-8 text-[20px] font-medium leading-relaxed text-fg">{copy.originLead}</p>
          <p className="mt-5 text-[17px] leading-relaxed text-fg-2">{copy.originBody}</p>
        </div>
      </div>
    </section>

    <section className="bg-[#071020] px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-300">{copy.productEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-white sm:text-[62px]">{copy.productTitle}</h2>
          <p className="mt-6 max-w-3xl text-[18px] leading-relaxed text-white/70">{copy.productBody}</p>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
          {copy.pillars.map((item, index) => {
            const Icon = pillarIcons[index] ?? Layers3;
            return <article key={item.title} className="bg-[#0b1628] p-7 sm:min-h-[280px] sm:p-8">
              <span className="grid size-12 place-items-center rounded-2xl bg-blue-400/15 text-blue-300"><Icon className="size-5" /></span>
              <h3 className="mt-12 text-[23px] font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/65">{item.body}</p>
            </article>;
          })}
        </div>
      </div>
    </section>

    <section className="bg-bg px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.journeyEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-fg sm:text-[60px]">{copy.journeyTitle}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-fg-2">{copy.journeyBody}</p>
        </div>
        <div className="relative mt-14 grid gap-4 lg:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-line lg:block" />
          {copy.journey.map((step) => <article key={step.label} className="relative rounded-[24px] border border-line bg-surface p-6 shadow-sm">
            <span className="relative grid size-14 place-items-center rounded-full border border-accent/30 bg-bg text-[13px] font-bold text-accent">{step.label}</span>
            <h3 className="mt-8 text-[22px] font-semibold text-fg">{step.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{step.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="border-y border-line bg-surface px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.modelEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-fg sm:text-[58px]">{copy.modelTitle}</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-fg-2">{copy.modelBody}</p>
        </div>
        <div className="rounded-[28px] border border-line bg-bg p-6 sm:p-8">
          {copy.modelPoints.map((point, index) => <div key={point} className="flex gap-4 border-b border-line py-5 first:pt-0 last:border-0 last:pb-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/12 text-accent"><Check className="size-4" /></span>
            <div><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">0{index + 1}</span><p className="mt-1 font-medium text-fg">{point}</p></div>
          </div>)}
        </div>
      </div>
    </section>

    <TeamSection t={t} />

    <section className="bg-bg px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.principlesEyebrow}</p>
        <h2 className="display mt-4 max-w-4xl text-balance text-[42px] leading-tight text-fg sm:text-[60px]">{copy.principlesTitle}</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {copy.principles.map((item, index) => <article key={item.title} className="rounded-[26px] border border-line bg-surface p-7 sm:p-9">
            <span className="text-[12px] font-bold text-accent">0{index + 1}</span>
            <h3 className="mt-8 text-[24px] font-semibold text-fg">{item.title}</h3>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-fg-2">{item.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="overflow-hidden bg-accent px-4 py-20 text-accent-fg sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] opacity-65">{copy.futureEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[44px] leading-tight sm:text-[64px]">{copy.futureTitle}</h2>
        </div>
        <p className="text-[18px] leading-relaxed opacity-75">{copy.futureBody}</p>
      </div>
    </section>

    <section className="bg-[#071020] px-4 py-20 text-center text-white sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <h2 className="display text-balance text-[44px] leading-tight sm:text-[66px]">{copy.finalTitle}</h2>
        <p className="mx-auto mt-6 max-w-2xl text-[18px] leading-relaxed text-white/68">{copy.finalBody}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href={p("/studio")} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-[#071020] transition hover:bg-blue-100">{copy.finalPrimary}<ArrowRight className="size-4" /></Link>
          <Link href={p("/contact")} className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-[15px] font-medium text-white transition hover:bg-white/10">{copy.finalSecondary}</Link>
        </div>
      </div>
    </section>
  </>;
}
