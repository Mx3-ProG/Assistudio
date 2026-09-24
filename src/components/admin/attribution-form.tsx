"use client";
import { useActionState, useState } from "react";
import { useI18n } from "@/components/providers";
import type { AdminState } from "@/app/actions/admin";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/primitives";

export function AttributionForm({ action, saleId, current, affiliates, label }: {
  action: (s: AdminState, f: FormData) => Promise<AdminState>; saleId: string; current: string | null;
  affiliates: { id: string; name: string }[]; label: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AdminState, FormData>(async (p, f) => {
    const r = await action(p, f);
    if (r.ok) setOpen(false);
    return r;
  }, {});
  if (!open) return <button onClick={() => setOpen(true)} className={buttonClass("ghost", "sm")}>{label}</button>;
  return (
    <form action={formAction} className="flex w-full flex-col gap-2 rounded-xl bg-surface-2 p-2 sm:w-72">
      <input type="hidden" name="id" value={saleId} />
      <select name="affiliateId" defaultValue={current ?? ""} required className={`${inputClass} h-9 text-[13px]`}>
        {affiliates.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <input name="reason" required minLength={3} placeholder={t.admin.reason} className={`${inputClass} h-9 text-[13px]`} />
      <div className="flex gap-1.5">
        <button disabled={pending} className={buttonClass("primary", "sm")}>{t.common.save}</button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")}>{t.common.cancel}</button>
      </div>
      {state.error && <p className="text-[12px] text-danger">{state.error}</p>}
    </form>
  );
}
