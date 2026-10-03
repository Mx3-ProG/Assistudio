"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { ArrowRight, Check, PartyPopper, Sparkles } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Field, inputClass, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { advanceOnboarding, createProspect, type FormState } from "@/app/actions/dashboard";
import { saveSalesPage, type PageFormState } from "@/app/actions/sales-center";
import { personalize } from "@/lib/sales/personalize";
import type { SalesContent } from "@/lib/sales/content";
import { fmt } from "@/i18n/format";
import { TrackedCopy } from "./tracked-copy";
import type { StartTarget } from "./start-selling";
import { cn } from "@/lib/cn";
import { CHECKLIST_LAST_STEP, CHECKLIST_SIZE, checklistDone } from "@/lib/sales/onboarding-checklist";

const STEPS = 6;

/**
 * First run, six short steps: understand Studio → choose a sector → what to
 * say → my link & code → first message → first prospect. The finish screen
 * explains how the commission comes back. Success = they know who to contact,
 * what to say, what to show and how they get paid — not "modules completed".
 */
export function SalesOnboarding({ productLine, pitch, offerLine, targets, messages, templateKey, pageBase, existingPages, startStep, pending, advisorName, link, code, next }: {
  productLine: string; pitch: string | null; offerLine: string | null; targets: (StartTarget & { id: string })[]; messages: SalesContent<"message">[];
  templateKey: string | null; pageBase: string; existingPages: Record<string, string>; startStep: number; pending: boolean; advisorName: string;
  link: string; code: string;
  /** Where the visitor was heading when they signed up (e.g. the Sales Center); shown as the finish CTA. */
  next?: string;
}) {
  const { t, locale } = useI18n();
  const O = t.sc.onboarding;
  const A = t.hc.activation;
  const [step, setStep] = useState(Math.min(Math.max(startStep, 0), STEPS - 1));
  const [target, setTarget] = useState<(StartTarget & { id: string }) | null>(null);
  const [pageUrl, setPageUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [, start] = useTransition();
  const go = (n: number) => { start(() => advanceOnboarding(n)); setStep(n); };
  const finish = () => { start(() => advanceOnboarding(STEPS, true)); setDone(true); };

  const [pageState, makePage, making] = useActionState<PageFormState, FormData>(async (p, f) => {
    const r = await saveSalesPage(p, f);
    if (r.ok && target) setPageUrl(`${pageBase}/${target.slug}`);
    return r;
  }, {});
  const [pState, addProspect, adding] = useActionState<FormState, FormData>(async (p, f) => {
    const r = await createProspect(p, f);
    if (r.ok) finish();
    return r;
  }, {});

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center shadow-lift sm:p-12">
        <PartyPopper className="mx-auto size-12 text-accent" />
        <p className="tabular mt-6 text-[13px] font-semibold text-success">{fmt(A.progress, { done: CHECKLIST_SIZE, total: CHECKLIST_SIZE })}</p>
        <h1 className="display mt-2 text-[34px] sm:text-[44px]">{A.ready}</h1>
        <p className="mt-4 text-[17px] text-fg-2">{O.doneBody}</p>
        <div className="mt-6 rounded-2xl bg-surface-2 p-5 text-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{O.paidTitle}</p>
          <ol className="mt-3 grid gap-2">
            {O.paidSteps.map((x, i) => <li key={x} className="flex gap-3 text-[14.5px]"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold text-accent-fg">{i + 1}</span>{x}</li>)}
          </ol>
        </div>
        <Link href={next ?? `/${locale}/dashboard/sales-center`} className={buttonClass("accent", "lg", "mt-8")}>{next ? t.common.continue : O.doneCta}<ArrowRight className="flip-rtl size-4" /></Link>
      </div>
    );
  }

  const c = target?.c;
  const url = pageUrl ?? (target ? existingPages[target.slug] : null) ?? null;
  const msg = target && ([...messages.filter((m) => m.targetKey === target.slug), ...messages.filter((m) => !m.targetKey)]
    .find((m) => m.stage === "first_contact"));
  // The sector's own first message wins (most specific); the generic one is the fallback.
  const msgSource = c?.message || msg?.body.text || "";
  const msgText = msgSource ? personalize(msgSource, { advisorName, affiliateUrl: url ?? link, sector: c?.name }, t.sc.messages.vars).text : "";
  const needsTarget = step >= 2 && !target;
  const checked = checklistDone(step);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <Sparkles className="mx-auto size-8 text-accent" />
        <h1 className="display mt-4 text-[32px] sm:text-[44px]">{A.welcomeTitle}</h1>
        <p className="mt-3 text-[17px] font-medium text-fg-2">{A.goal}</p>
      </div>
      {pending && <div className="mt-6"><Notice tone="warning">{t.dash.onboarding.pendingNote}</Notice></div>}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex flex-1 gap-1.5" aria-hidden>
            {CHECKLIST_LAST_STEP.map((last, i) => <li key={i} className={cn("h-1.5 flex-1 rounded-full", step > last ? "bg-success" : step >= (CHECKLIST_LAST_STEP[i - 1] ?? -1) + 1 ? "bg-accent" : "bg-surface-3")} />)}
          </ol>
          <span className="tabular shrink-0 text-[13px] font-semibold">{fmt(A.progress, { done: checked, total: CHECKLIST_SIZE })}</span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {A.checklist.map((label, i) => {
            const done = step > CHECKLIST_LAST_STEP[i];
            const current = !done && step >= (CHECKLIST_LAST_STEP[i - 1] ?? -1) + 1;
            return (
              <li key={label} className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]",
                done ? "border-success/30 bg-success-soft text-success" : current ? "border-accent/40 bg-accent-soft font-medium text-fg" : "border-line text-muted")}>
                {done ? <Check className="size-3.5" aria-hidden /> : <span className="tabular text-[11px] font-semibold">{i + 1}</span>}
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="card mt-6 p-5 sm:p-8">
        <p className="tabular text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{Math.max(0, CHECKLIST_LAST_STEP.findIndex((last) => step <= last)) + 1} / {CHECKLIST_SIZE}</p>
        <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{O.steps[step]}</h2>

        {step === 0 && (
          <div className="mt-4 grid gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{O.productLead}</p>
            <p className="text-[19px] font-semibold leading-snug">{productLine}</p>
            {pitch && <p className="rounded-2xl bg-accent-soft p-4 text-[15.5px] leading-relaxed">{pitch}</p>}
            {offerLine && <p className="rounded-2xl bg-surface-2 p-4 text-[15px] font-medium">{offerLine}</p>}
            <Next onClick={() => go(1)} label={O.continue} />
          </div>
        )}

        {(step === 1 || needsTarget) && (
          <div className="mt-4">
            <p className="text-[15px] text-fg-2">{O.chooseTarget}</p>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {targets.map((x) => (
                <li key={x.slug}>
                  <button onClick={() => { setTarget(x); go(2); }} aria-pressed={target?.slug === x.slug}
                    className={cn("flex h-full w-full items-center gap-2.5 rounded-2xl border p-3 text-start text-[14px] transition",
                      target?.slug === x.slug ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2")}>
                    <MarketIcon name={x.icon} className="size-4 shrink-0 text-accent" />{x.c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 2 && c && (
          <div className="mt-4 grid gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{fmt(O.problemLead, { target: c.name })}</p>
            <ul className="grid gap-2">{(c.pains?.length ? c.pains.slice(0, 3) : [c.problem]).map((p) => <li key={p} className="rounded-xl bg-surface-2 px-3 py-2 text-[15px]">{p}</li>)}</ul>
            <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{fmt(O.pitchLead, { target: c.name })}</p>
            <p className="rounded-2xl bg-accent-soft p-4 text-[16px] leading-relaxed">{c.angle}</p>
            {c.avoid && <p className="text-[14px] text-fg-2">⚠︎ {c.avoid}</p>}
            <Next onClick={() => go(3)} label={O.continue} />
          </div>
        )}

        {step === 3 && target && (
          <div className="mt-4 grid gap-3">
            <p className="text-[15px] text-fg-2">{O.toolsLead}</p>
            <div className="grid gap-1.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{t.cp.kit.link}</p>
              <div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-[13px]" dir="ltr">{link}</p><TrackedCopy value={link} size="md" /></div>
            </div>
            <div className="grid gap-1.5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{t.cp.kit.code}</p>
              <div className="flex items-center gap-2"><p className="rounded-xl bg-surface-2 px-3 py-2 font-mono text-[18px] font-semibold tracking-[0.08em]" dir="ltr">{code}</p><TrackedCopy value={code} size="md" /></div>
              <p className="text-[12.5px] text-muted">{t.cp.kit.codeHint}</p>
            </div>
            <p className="mt-2 text-[15px] text-fg-2">{fmt(O.pageLead, { target: target.c.name })}</p>
            {url ? (
              <>
                <p className="flex items-center gap-2 text-[14px] font-medium text-success"><Check className="size-4" />{O.pageReady}</p>
                <p className="truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-[13px]" dir="ltr">{url}</p>
                <div className="flex flex-wrap gap-2">
                  <TrackedCopy value={url} size="md" />
                  <a href={url} target="_blank" rel="noopener" className={buttonClass("secondary", "md")}>{t.sc.preview}</a>
                </div>
                <Next onClick={() => go(4)} label={O.continue} />
              </>
            ) : templateKey ? (
              <form action={makePage}>
                <input type="hidden" name="marketId" value={target.id} />
                <input type="hidden" name="pathKey" value={target.slug} />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="templateKey" value={templateKey} />
                <input type="hidden" name="ctaMode" value="lead" />
                <input type="hidden" name="showAdvisor" value="on" />
                <button disabled={making} className={buttonClass("accent", "lg")}><Sparkles className="size-4" />{t.sc.pages.generate}</button>
                <button type="button" onClick={() => go(4)} className={buttonClass("ghost", "lg", "ms-2")}>{O.skip}</button>
                {pageState.error && <p className="mt-2 text-[13px] text-danger">{t.sc.pages.errors[pageState.error as keyof typeof t.sc.pages.errors] ?? t.sc.pages.errors.generic}</p>}
              </form>
            ) : <Next onClick={() => go(4)} label={O.continue} />}
          </div>
        )}

        {step === 4 && target && (
          <div className="mt-4 grid gap-3">
            <p className="text-[15px] text-fg-2">{O.messageLead}</p>
            {msgText && <p className="whitespace-pre-line rounded-2xl bg-surface-2 p-4 text-[15px] leading-relaxed">{msgText}</p>}
            <div className="flex flex-wrap gap-2">
              {msgText && <TrackedCopy value={msgText} kind="message" contentKey={c?.message ? undefined : msg?.key} variant="accent" size="lg" />}
              <button onClick={() => go(5)} className={buttonClass("primary", "lg")}>{O.continue}<ArrowRight className="flip-rtl size-4" /></button>
            </div>
          </div>
        )}

        {step === 5 && (
          <form action={addProspect} className="mt-4 grid gap-3">
            <p className="text-[15px] text-fg-2">{O.prospectLead}</p>
            <input type="hidden" name="stage" value="contacted" />
            {target && <input type="hidden" name="marketId" value={target.id} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t.dash.prospects.fields.name}><input name="name" required className={inputClass} /></Field>
              <Field label={t.dash.prospects.fields.company}><input name="company" className={inputClass} /></Field>
            </div>
            {pState.error && <p className="text-[13px] text-danger">{t.errors.generic}</p>}
            <div className="flex flex-wrap gap-2">
              <button disabled={adding} className={buttonClass("accent", "lg")}>{O.finish}</button>
              <button type="button" onClick={finish} className={buttonClass("ghost", "lg")}>{O.skip}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Next({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className={buttonClass("primary", "lg", "mt-2 justify-self-start")}>{label}<ArrowRight className="flip-rtl size-4" /></button>;
}
