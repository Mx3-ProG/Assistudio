import Link from "next/link";
import { ArrowRight, Check, CreditCard, Database, FileClock, KeyRound, LockKeyhole, ServerCog, ShieldCheck, UserCheck } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { SecurityPageCopy } from "@/lib/marketing/trust-pages-copy";
import { buttonClass } from "@/components/ui/button";

const controlIcons = [LockKeyhole, KeyRound, ServerCog, FileClock];

export function SecurityContent({ copy, locale }: { copy: SecurityPageCopy; locale: Locale }) {
  const p = (path: string) => `/${locale}${path}`;
  return <>
    <section className="relative overflow-hidden border-b border-line bg-[#071020] px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[560px] rounded-full bg-blue-500/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_0.72fr] lg:items-center">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-300">{copy.eyebrow}</p>
          <h1 className="display mt-5 max-w-4xl text-balance text-[48px] leading-[0.96] text-white sm:text-[72px]">{copy.title}</h1>
          <p className="mt-7 max-w-3xl text-[18px] leading-relaxed text-white/70 sm:text-[20px]">{copy.intro}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={p("/contact")} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-[#071020] transition hover:bg-blue-100">{copy.primary}<ArrowRight className="size-4" /></Link>
            <Link href={p("/privacy")} className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 text-[15px] font-medium text-white transition hover:bg-white/10">{copy.secondary}</Link>
          </div>
        </div>
        <div className="relative mx-auto grid size-[300px] place-items-center sm:size-[390px]">
          <div className="absolute inset-0 rounded-full border border-blue-300/15" />
          <div className="absolute inset-[14%] rounded-full border border-blue-300/25" />
          <div className="absolute inset-[28%] rounded-full bg-blue-400/10 blur-sm" />
          <ShieldCheck className="relative size-28 text-blue-300 sm:size-36" strokeWidth={1.25} />
        </div>
      </div>
    </section>

    <section className="bg-bg px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.postureEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-fg sm:text-[60px]">{copy.postureTitle}</h2>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-fg-2">{copy.postureBody}</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.controls.map((item, index) => {
            const Icon = controlIcons[index] ?? ShieldCheck;
            return <article key={item.title} className="rounded-[26px] border border-line bg-surface p-7">
              <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon className="size-5" /></span>
              <h3 className="mt-10 text-[21px] font-semibold text-fg">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{item.body}</p>
            </article>;
          })}
        </div>
      </div>
    </section>

    <section className="border-y border-line bg-surface px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.dataEyebrow}</p>
            <h2 className="display mt-4 text-balance text-[42px] leading-tight text-fg sm:text-[58px]">{copy.dataTitle}</h2>
          </div>
          <p className="text-[17px] leading-relaxed text-fg-2">{copy.dataBody}</p>
        </div>
        <div className="mt-12 overflow-hidden rounded-[28px] border border-line bg-line">
          <div className="grid gap-px sm:grid-cols-2">
            {copy.dataPoints.map((item, index) => <article key={item.title} className="bg-bg p-7 sm:p-9">
              <div className="flex items-center gap-3"><Database className="size-5 text-accent" /><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">0{index + 1}</span></div>
              <h3 className="mt-8 text-[23px] font-semibold text-fg">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{item.body}</p>
            </article>)}
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#071020] px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="rounded-[32px] border border-white/12 bg-white/[0.06] p-7 sm:p-10">
          <span className="grid size-14 place-items-center rounded-2xl bg-blue-400/15 text-blue-300"><CreditCard className="size-6" /></span>
          <div className="mt-9 grid gap-4">
            {copy.paymentPoints.map((point) => <div key={point} className="flex items-start gap-3 text-[15px] leading-relaxed text-white/75"><Check className="mt-1 size-4 shrink-0 text-blue-300" />{point}</div>)}
          </div>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-300">{copy.paymentsEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-white sm:text-[58px]">{copy.paymentsTitle}</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-white/68">{copy.paymentsBody}</p>
        </div>
      </div>
    </section>

    <section className="bg-bg px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.responsibilityEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-fg sm:text-[60px]">{copy.responsibilityTitle}</h2>
          <p className="mx-auto mt-5 max-w-3xl text-[17px] leading-relaxed text-fg-2">{copy.responsibilityBody}</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {copy.responsibilities.map((item, index) => <article key={item.title} className="rounded-[26px] border border-line bg-surface p-7 sm:p-8">
            <UserCheck className="size-6 text-accent" />
            <span className="mt-12 block text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-3">0{index + 1}</span>
            <h3 className="mt-2 text-[23px] font-semibold text-fg">{item.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-2">{item.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="border-y border-line bg-surface px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent">{copy.incidentEyebrow}</p>
          <h2 className="display mt-4 text-balance text-[42px] leading-tight text-fg sm:text-[58px]">{copy.incidentTitle}</h2>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-fg-2">{copy.incidentBody}</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {copy.incidentSteps.map((step) => <article key={step.label} className="rounded-[24px] border border-line bg-bg p-7">
            <span className="text-[12px] font-bold text-accent">{step.label}</span><h3 className="mt-8 text-[23px] font-semibold text-fg">{step.title}</h3><p className="mt-3 text-[15px] leading-relaxed text-fg-2">{step.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="bg-accent px-4 py-20 text-accent-fg sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl"><h2 className="display text-balance text-[42px] leading-tight sm:text-[58px]">{copy.finalTitle}</h2><p className="mt-5 text-[17px] leading-relaxed opacity-75">{copy.finalBody}</p></div>
        <div className="flex shrink-0 flex-wrap gap-3"><Link href={p("/contact")} className={buttonClass("primary", "lg")}>{copy.finalPrimary}</Link><Link href={p("/privacy")} className="inline-flex h-12 items-center justify-center rounded-full border border-current/25 px-7 text-[15px] font-medium transition hover:bg-black/5">{copy.finalSecondary}</Link></div>
      </div>
    </section>
  </>;
}
