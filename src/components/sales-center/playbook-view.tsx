"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, UserPlus } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Progress } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmt } from "@/i18n/format";
import type { PlaybookBody, SalesContent } from "@/lib/sales/content";
import type { MarketContent } from "@/content/markets";
import { TrackedCopy } from "./tracked-copy";
import { cn } from "@/lib/cn";

/**
 * A playbook you walk through. Generic steps are enriched with the chosen
 * target's data (problems, angle, questions) and the matching objections.
 */
export function PlaybookView({ body, target, objections, pageUrl, prospectHref, objectionsHref }: {
  body: PlaybookBody; target: MarketContent | null; objections: SalesContent<"objection">[];
  pageUrl: string; prospectHref: string; objectionsHref: string;
}) {
  const { t } = useI18n();
  const P = t.sc.playbooks;
  const [i, setI] = useState(0);
  const step = body.steps[i];
  const last = i === body.steps.length - 1;
  const name = target?.name ?? "";

  const extra = () => {
    if (!target && step.key !== "objections" && step.key !== "offer") return null;
    switch (step.key) {
      case "understand":
        return <Panel title={fmt(P.targetOutcomes, { target: name })} items={target?.outcomes ?? [target!.why]} />;
      case "discovery":
        return target?.discovery?.length ? <Panel title={fmt(P.targetQuestions, { target: name })} items={target.discovery} /> : null;
      case "pain":
        return <Panel title={fmt(P.targetPains, { target: name })} items={target?.pains?.length ? target.pains : [target!.problem]} tone="danger" />;
      case "present":
      case "value":
        return (
          <div className="rounded-2xl bg-accent-soft p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{fmt(P.targetAngle, { target: name })}</p>
            <p className="mt-1.5 text-[15px]">{target!.angle}</p>
            {target?.avoid && <p className="mt-2 text-[13px] text-fg-2">⚠︎ {target.avoid}</p>}
          </div>
        );
      case "objections":
        return objections.length ? (
          <ul className="grid gap-2">
            {objections.slice(0, 5).map((o) => (
              <li key={o.key} className="rounded-2xl bg-surface-2 p-3">
                <p className="text-[14px] font-medium">{o.body.objection}</p>
                <p className="mt-1 text-[13.5px] text-fg-2">{o.body.short}</p>
              </li>
            ))}
            <li><Link href={objectionsHref} className="text-[13px] font-medium text-accent hover:underline">{t.sc.sections.objections.title} →</Link></li>
          </ul>
        ) : null;
      case "offer":
        return (
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{P.yourPage}</p>
            <p className="mt-1 truncate font-mono text-[13px]" dir="ltr">{pageUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <TrackedCopy value={pageUrl} />
              <a href={pageUrl} target="_blank" rel="noopener" className={buttonClass("ghost", "sm")}><ExternalLink className="size-4" />{t.sc.preview}</a>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid gap-4">
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist">
        {body.steps.map((s, n) => (
          <button key={n} role="tab" aria-selected={n === i} onClick={() => setI(n)}
            className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] transition",
              n === i ? "bg-fg text-bg" : n < i ? "bg-success-soft text-success" : "bg-surface-2 text-fg-2")}>
            {n < i ? <Check className="size-3.5" /> : <span className="tabular">{n + 1}</span>}
            <span className="hidden sm:inline">{P.stepKeys[s.key]}</span>
          </button>
        ))}
      </div>
      <Progress value={i + 1} max={body.steps.length} />
      <article className="card p-5 sm:p-8" aria-live="polite">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">{fmt(P.step, { n: i + 1, total: body.steps.length })} · {P.stepKeys[step.key]}</p>
        <h2 className="mt-2 text-[24px] font-semibold tracking-tight sm:text-[28px]">{step.title}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-fg-2" dir="auto">{step.body}</p>
        {step.bullets && step.bullets.length > 0 && (
          <ul className="mt-4 grid gap-2">
            {step.bullets.map((b) => <li key={b} className="flex gap-2 text-[15px]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />{b}</li>)}
          </ul>
        )}
        {extra() && <div className="mt-5">{extra()}</div>}
      </article>
      <div className="flex items-center gap-2">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className={buttonClass("secondary", "lg")}><ArrowLeft className="flip-rtl size-4" />{P.prev}</button>
        <span className="flex-1" />
        {last ? (
          <Link href={prospectHref} className={buttonClass("accent", "lg")}><UserPlus className="size-4" />{P.addProspect}</Link>
        ) : (
          <button onClick={() => setI(i + 1)} className={buttonClass("primary", "lg")}>{P.next}<ArrowRight className="flip-rtl size-4" /></button>
        )}
      </div>
    </div>
  );
}

function Panel({ title, items, tone }: { title: string; items: string[]; tone?: "danger" }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em]", tone === "danger" ? "text-danger" : "text-accent")}>{title}</p>
      <ul className="mt-2 grid gap-1.5">{items.map((x) => <li key={x} className="text-[14.5px]">• {x}</li>)}</ul>
    </div>
  );
}
