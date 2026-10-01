"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, LifeBuoy } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Badge, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { TrackedCopy } from "@/components/sales-center/tracked-copy";
import { applyReply, planProspect } from "@/app/actions/guided";
import { cn } from "@/lib/cn";

export interface ReplyOption {
  key: string; said: string; level: number; meaning?: string; answer: string; question?: string; next: string; to?: string;
  /** Pre-rendered proof to show with this reply (project / page), if any. */
  proof?: { label: string; href: string } | null;
}

const TONE = { 1: "success", 2: "accent", 3: "warning" } as const;

/** "They said…" → the level (answer yourself / recommended answer / hand over), the words, the next step. */
export function ReplyPicker({ prospectId, replies }: { prospectId: string; replies: ReplyOption[] }) {
  const { t, locale } = useI18n();
  const P = t.gd.prospect;
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [date, setDate] = useState("");
  const [pending, start] = useTransition();
  const r = replies.find((x) => x.key === open);
  const level = (r?.level ?? 1) as 1 | 2 | 3;
  const openHandOff = () => {
    const el = document.getElementById("handoff") as HTMLDetailsElement | null;
    if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  };
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-[15px] font-semibold">{P.saidTitle}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {replies.map((x) => (
          <li key={x.key}>
            <button onClick={() => { setOpen(x.key === open ? null : x.key); setDone(false); }} aria-pressed={x.key === open}
              className={cn("inline-flex min-h-9 items-center rounded-full border px-3.5 py-1.5 text-start text-[13.5px] transition",
                x.key === open ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2")}>
              {x.said}
            </button>
          </li>
        ))}
      </ul>
      {r && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-surface-2/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[level]}>{level}. {P.levels[level]}</Badge>
            <span className="text-[12.5px] text-muted">{P.levelHints[level]}</span>
          </div>
          {r.meaning && <p className="text-[13.5px]"><span className="text-muted">{P.meaning} · </span>{r.meaning}</p>}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{P.answer}</p>
            <p className="mt-1 rounded-xl bg-surface p-3 text-[14.5px] leading-relaxed">{r.answer}</p>
            <TrackedCopy value={r.answer} kind="reply" contentKey={r.key} className="mt-2" />
          </div>
          {r.question && <p className="text-[14px]"><span className="font-semibold text-accent">{P.question} · </span>{r.question}</p>}
          {r.proof && <Link href={r.proof.href} className="text-[13.5px] font-medium text-accent hover:underline">{r.proof.label} →</Link>}
          <p className="text-[14px]"><span className="font-semibold">{P.nextStep} · </span>{r.next}</p>
          {done ? (
            <p className="flex items-center gap-2 text-[13.5px] text-success"><Check className="size-4" />{t.dash.settings.saved}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {level === 3 ? (
                <button onClick={() => start(async () => { await applyReply(prospectId, r.key, locale); setDone(true); openHandOff(); })} disabled={pending} className={buttonClass("accent", "md")}>
                  <LifeBuoy className="size-4" />{t.gd.handoff.button}
                </button>
              ) : (
                <button onClick={() => start(async () => { await applyReply(prospectId, r.key, locale); setDone(true); })} disabled={pending} className={buttonClass("accent", "md")}>
                  <Check className="size-4" />{P.apply}
                </button>
              )}
              {!r.to && (
                <span className="flex flex-wrap items-center gap-2">
                  <label className="text-[13px] text-muted" htmlFor={`plan-${r.key}`}>{P.planLabel}</label>
                  <input id={`plan-${r.key}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputClass, "h-9 w-auto")} />
                  <button disabled={!date || pending} onClick={() => start(async () => { await planProspect(prospectId, r.next.slice(0, 200), date); await applyReply(prospectId, r.key, locale); setDone(true); })}
                    className={buttonClass("secondary", "md")}>{P.plan}</button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
