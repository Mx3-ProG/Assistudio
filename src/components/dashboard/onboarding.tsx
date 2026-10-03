"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Check, ArrowRight, Sparkles, PartyPopper } from "lucide-react";
import { useI18n } from "@/components/providers";
import { advanceOnboarding, createProspect, type FormState } from "@/app/actions/dashboard";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, inputClass, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { marketContent, type Market } from "@/content/markets";
import { formatMoney, formatPercent } from "@/lib/money";
import { cn } from "@/lib/cn";

export function Onboarding({ markets, link, priceCents, commissionCents, startStep, pending }: {
  markets: Market[]; link: string; priceCents: number; commissionCents: number; startStep: number; pending: boolean;
}) {
  const { t, locale } = useI18n();
  const O = t.dash.onboarding;
  const [step, setStep] = useState(Math.min(startStep, 4));
  const [done, setDone] = useState(false);
  const [market, setMarket] = useState<Market | null>(null);
  const [, start] = useTransition();
  const [prospectState, addProspect, adding] = useActionState<FormState, FormData>(async (p, f) => {
    const r = await createProspect(p, f);
    if (r.ok) finish();
    return r;
  }, {});

  const go = (next: number) => {
    start(() => advanceOnboarding(next));
    setStep(next);
  };
  function finish() {
    start(() => advanceOnboarding(5, true));
    setDone(true);
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center shadow-lift sm:p-12">
        <PartyPopper className="mx-auto size-12 text-accent" />
        <h1 className="display mt-6 text-[36px] sm:text-[48px]">{O.readyTitle}</h1>
        <p className="mt-4 text-[17px] text-fg-2">{O.readyBody}</p>
        <Link href={`/${locale}/dashboard/find`} className={buttonClass("accent", "lg", "mt-8")}>{O.readyCta} <ArrowRight className="flip-rtl size-4" /></Link>
        <p className="mt-6 text-[11px] text-muted">{t.common.illustrationOnly}</p>
      </div>
    );
  }

  const message = market ? marketContent(market, locale).message.replace(/\[(your link|votre lien)\]/gi, link) + `\n\n${link}` : "";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <Sparkles className="mx-auto size-8 text-accent" />
        <h1 className="display mt-4 text-[36px] sm:text-[48px]">{O.welcome}</h1>
        <p className="mt-3 text-[16px] text-muted">{O.welcomeBody}</p>
      </div>

      <ol className="mt-10 flex items-center gap-1.5" aria-label="progress">
        {O.steps.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-surface-3")} />
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] font-medium text-muted">{step + 1}/5 · {O.steps[step]}</p>

      <div key={step} className="card animate-rise mt-4 p-6 sm:p-8">
        <h2 className="text-[22px] font-semibold tracking-tight">{O.steps[step]}</h2>

        {step === 0 && (
          <>
            <p className="mt-2 text-[15px] text-fg-2">{O.productBody}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[[formatMoney(priceCents, locale), t.home.statPriceLabel], [priceCents ? formatPercent(commissionCents / priceCents, locale, 0) : "—", t.home.statRateLabel], [formatMoney(commissionCents, locale), t.dash.product.potential]].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-surface-2 p-4">
                  <div className="tabular text-[20px] font-semibold sm:text-[24px]">{v}</div>
                  <div className="mt-1 text-[11px] text-muted sm:text-[12px]">{l}</div>
                </div>
              ))}
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {t.dash.product.arguments.map((a) => <li key={a} className="flex gap-2 text-[14px]"><Check className="mt-0.5 size-4 shrink-0 text-success" />{a}</li>)}
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <p className="mt-2 text-[15px] text-fg-2">{O.marketBody}</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {markets.map((m) => (
                <button key={m.id} onClick={() => setMarket(m)} aria-pressed={market?.id === m.id}
                  className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-start text-[13px] font-medium transition",
                    market?.id === m.id ? "border-accent bg-accent-soft text-accent" : "border-line hover:bg-surface-2")}>
                  <MarketIcon name={m.icon} className="size-4 shrink-0" />{marketContent(m, locale).name}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mt-2 text-[15px] text-fg-2">{O.linkBody}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <input readOnly value={link} className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-4 font-mono text-[14px]" />
              <CopyButton track="affiliate_link_copied" value={link} variant="accent" size="lg" />
            </div>
            {pending && <div className="mt-4"><Notice tone="warning">{O.pendingNote}</Notice></div>}
          </>
        )}

        {step === 3 && (
          <>
            <p className="mt-2 text-[15px] text-fg-2">{O.messageBody}</p>
            <div className="mt-6 rounded-2xl bg-surface-2 p-4">
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{message || marketContent(markets[0], locale).message}</p>
            </div>
            <CopyButton track="sales_script_copied" value={message || marketContent(markets[0], locale).message} variant="primary" size="md" className="mt-4" />
          </>
        )}

        {step === 4 && (
          <form action={addProspect} className="mt-4 grid gap-4">
            <p className="text-[15px] text-fg-2">{O.prospectBody}</p>
            <input type="hidden" name="stage" value="new" />
            {market && <input type="hidden" name="marketId" value={market.id} />}
            <input type="hidden" name="nextAction" value={O.steps[3]} />
            <Field label={t.dash.prospects.fields.name}><input name="name" required className={inputClass} autoFocus /></Field>
            <Field label={t.dash.prospects.fields.company}><input name="company" className={inputClass} /></Field>
            <Field label={t.dash.prospects.fields.profession}><input name="profession" defaultValue={market ? marketContent(market, locale).name : ""} className={inputClass} /></Field>
            {prospectState.error && <p className="text-[13px] text-danger">{t.errors.generic}</p>}
            <div className="flex justify-between gap-2">
              <button type="button" onClick={finish} className={buttonClass("ghost", "md")}>{t.common.skip}</button>
              <button disabled={adding} className={buttonClass("accent", "md")}>{t.common.add} <ArrowRight className="flip-rtl size-4" /></button>
            </div>
          </form>
        )}

        {step < 4 && (
          <div className="mt-8 flex justify-between gap-2">
            <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0} className={buttonClass("ghost", "md")}>{t.common.back}</button>
            <button onClick={() => go(step + 1)} disabled={step === 1 && !market} className={buttonClass("primary", "md")}>
              {t.common.continue} <ArrowRight className="flip-rtl size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
