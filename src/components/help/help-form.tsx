"use client";
import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useI18n } from "@/components/providers";
import { submitHelpRequest, type HelpState } from "@/app/actions/help";
import { HELP_CATEGORIES, HELP_URGENCIES, type HelpCategory } from "@/lib/data/types";
import { Field, inputClass, textareaClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { fmt } from "@/i18n/format";

type Option = { id: string; label: string };

export function HelpForm({ prospects, dossiers, defaults }: {
  prospects: Option[];
  dossiers: Option[];
  defaults: { category?: HelpCategory; prospectId?: string; dossierId?: string; pagePath?: string | null };
}) {
  const { t } = useI18n();
  const H = t.net.help;
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<HelpState, FormData>(submitHelpRequest, {});
  useEffect(() => { if (state.ok) form.current?.reset(); }, [state]);

  return (
    <form ref={form} action={action} className="grid gap-4">
      <input type="hidden" name="pagePath" value={defaults.pagePath ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={H.category}>
          <select name="category" defaultValue={defaults.category ?? "other"} className={inputClass}>
            {HELP_CATEGORIES.map((c) => <option key={c} value={c}>{t.net.categories[c]}</option>)}
          </select>
        </Field>
        <Field label={H.urgency} hint={H.urgentHint}>
          <select name="urgency" defaultValue="normal" className={inputClass}>
            {HELP_URGENCIES.map((u) => <option key={u} value={u}>{t.net.urgencies[u]}</option>)}
          </select>
        </Field>
      </div>
      <Field label={H.subject}>
        <input name="subject" required minLength={3} maxLength={160} placeholder={H.subjectPlaceholder} className={inputClass} />
      </Field>
      <Field label={H.message}>
        <textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder={H.messagePlaceholder} className={textareaClass} />
      </Field>
      {(prospects.length > 0 || dossiers.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {prospects.length > 0 && (
            <Field label={H.prospect}>
              <select name="prospectId" defaultValue={defaults.prospectId ?? ""} className={inputClass}>
                <option value="">{H.none}</option>
                {prospects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
          )}
          {dossiers.length > 0 && (
            <Field label={H.dossier}>
              <select name="dossierId" defaultValue={defaults.dossierId ?? ""} className={inputClass}>
                <option value="">{H.none}</option>
                {dossiers.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
          )}
        </div>
      )}
      <p className="text-[12.5px] text-muted">{H.shared}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className={buttonClass("primary", "md")}>
          <Send className="flip-rtl size-4" />{pending ? H.sending : H.send}
        </button>
        {state.ok && (
          <p role="status" className="flex items-center gap-1.5 text-[13px] text-success">
            <CheckCircle2 className="size-4" />{fmt(H.sent, { ref: state.ref ?? "" })}
          </p>
        )}
        {state.error && <p role="alert" className="text-[13px] text-danger">{H.errors[state.error]}</p>}
      </div>
    </form>
  );
}
