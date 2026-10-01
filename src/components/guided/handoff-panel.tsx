"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Check, LifeBuoy } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Field, inputClass, textareaClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { handOffProspect, type HandOffState } from "@/app/actions/guided";
import { createDossierAction } from "@/app/actions/contracts";

const REASONS = ["meeting", "quote", "technical", "contract", "price", "unknown", "other"] as const;

/**
 * "Hand over to Studio" — always visible on the prospect page. The prospect
 * stays attributed; Studio gets a structured message in the Support thread.
 */
export function HandOffPanel({ prospectId, done, hasEmail }: { prospectId: string; done: boolean; hasEmail: boolean }) {
  const { t, locale } = useI18n();
  const H = t.gd.handoff;
  const [state, action, pending] = useActionState<HandOffState, FormData>(handOffProspect, {});
  const finished = done || state.ok;
  return (
    <details id="handoff" className="card group border-accent/30 p-5 open:shadow-md sm:p-6" open={finished ? true : undefined}>
      <summary className="flex cursor-pointer select-none list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg"><LifeBuoy className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold">{H.button}</span>
          <span className="block text-[13px] text-muted">{H.reassurance}</span>
        </span>
      </summary>
      <div className="mt-4 grid gap-3">
        <p className="rounded-xl bg-success-soft px-3 py-2 text-[13.5px] text-success">{H.keep}</p>
        {finished ? (
          <>
            <p className="flex items-center gap-2 text-[14px] font-medium"><Check className="size-4 text-success" />{H.done}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/dashboard/messages`} className={buttonClass("secondary", "md")}>{H.openSupport}</Link>
            </div>
            <p className="text-[13px] text-muted">{H.quoteHint}</p>
            <form action={createDossierAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="prospectId" value={prospectId} />
              {!hasEmail && <input name="email" type="email" required placeholder="email@client.com" className={`${inputClass} max-w-xs`} />}
              <button className={buttonClass("primary", "md")}>{H.createDossier}</button>
            </form>
          </>
        ) : (
          <form action={action} className="grid gap-3">
            <p className="text-[13px] text-muted">{H.when}</p>
            <input type="hidden" name="id" value={prospectId} />
            <input type="hidden" name="locale" value={locale} />
            <Field label={H.reason}>
              <select name="reason" defaultValue="meeting" className={`${inputClass} appearance-none`}>
                {REASONS.map((r) => <option key={r} value={r}>{H.reasons[r]}</option>)}
              </select>
            </Field>
            <Field label={H.note}><textarea name="note" rows={3} placeholder={H.notePlaceholder} className={textareaClass} /></Field>
            <label className="flex items-start gap-3 text-[13.5px]"><input type="checkbox" name="consent" className="mt-0.5 size-4 accent-[var(--accent)]" />{H.consent}</label>
            {state.error && <p className="text-[13px] text-danger">{H.error}</p>}
            <button disabled={pending} className={buttonClass("accent", "lg", "justify-self-start")}>{H.submit}</button>
          </form>
        )}
      </div>
    </details>
  );
}
