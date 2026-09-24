"use client";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@/components/providers";
import { createCampaign, type FormState } from "@/app/actions/dashboard";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { marketContent, type Market } from "@/content/markets";

const SOURCES = ["instagram", "linkedin", "email", "whatsapp", "facebook", "x", "tiktok", "website", "event", "other"];

export function CampaignForm({ markets }: { markets: Market[] }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [, action, pending] = useActionState<FormState, FormData>(async (p, f) => {
    const r = await createCampaign(p, f);
    if (r.ok) setOpen(false);
    return r;
  }, {});
  const c = t.dash.campaigns;
  if (!open) return <button onClick={() => setOpen(true)} className={buttonClass("primary", "md")}><Plus className="size-4" />{c.new}</button>;
  return (
    <form action={action} className="card grid w-full gap-4 p-5 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <Field label={c.name}><input name="name" required maxLength={120} placeholder={c.namePlaceholder} className={inputClass} autoFocus /></Field>
      <Field label={c.source}>
        <select name="source" className={`${inputClass} appearance-none capitalize`}>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label={c.market}>
        <select name="marketId" className={`${inputClass} appearance-none`} defaultValue="">
          <option value="">—</option>
          {markets.map((m) => <option key={m.id} value={m.id}>{marketContent(m, locale).name}</option>)}
        </select>
      </Field>
      <div className="flex gap-2">
        <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.create}</button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "md")}>{t.common.cancel}</button>
      </div>
    </form>
  );
}
