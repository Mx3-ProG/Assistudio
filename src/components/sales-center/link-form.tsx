"use client";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/components/providers";
import { createLink } from "@/app/actions/sales-center";
import type { FormState } from "@/app/actions/dashboard";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { CHANNELS } from "@/lib/sales/content";

export function LinkForm({ pages, targets }: { pages: { id: string; label: string }[]; targets: { id: string; name: string }[] }) {
  const { t } = useI18n();
  const L = t.sc.links;
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => {
    const r = await createLink(p, f);
    if (r.ok) setOpen(false);
    return r;
  }, {});
  if (!open) return <button onClick={() => setOpen(true)} className={buttonClass("primary", "md")}><Plus className="size-4" />{L.new}</button>;
  const select = `${inputClass} appearance-none`;
  return (
    <form action={action} className="card grid w-full gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <Field label={L.name}><input name="name" required maxLength={120} placeholder={L.namePlaceholder} className={inputClass} autoFocus /></Field>
      <Field label={L.page}>
        <select name="pageId" className={select} defaultValue="">
          <option value="">{L.pageNone}</option>
          {pages.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </Field>
      <Field label={L.channel}>
        <select name="channel" className={select} defaultValue="">
          <option value="">—</option>
          {CHANNELS.map((c) => <option key={c} value={c}>{t.sc.channels[c]}</option>)}
        </select>
      </Field>
      <Field label={L.target}>
        <select name="marketId" className={select} defaultValue="">
          <option value="">—</option>
          {targets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      <div className="flex items-center gap-2 lg:col-span-4">
        <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.create}</button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "md")}>{t.common.cancel}</button>
        {state.error && <span className="text-[13px] text-danger">{t.errors.generic}</span>}
      </div>
    </form>
  );
}
