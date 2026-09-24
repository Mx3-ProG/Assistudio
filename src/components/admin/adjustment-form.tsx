"use client";
import { useActionState } from "react";
import { adjustLedger, type AdminState } from "@/app/actions/admin";
import { useI18n } from "@/components/providers";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

/** Manual ledger adjustment: amount in cents (+/−), currency, mandatory reason → immutable entry + audit log. */
export function AdjustmentForm({ affiliates }: { affiliates: { id: string; name: string }[] }) {
  const { t } = useI18n();
  const A = t.admin;
  const [state, action, pending] = useActionState<AdminState, FormData>(adjustLedger, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_0.6fr_2fr_auto] sm:items-end">
      <Field label={A.affiliate}>
        <select name="affiliateId" required className={`${inputClass} appearance-none`}>
          {affiliates.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label={A.amountCents}><input name="amountCents" type="number" step={1} required className={inputClass} placeholder="-150000" /></Field>
      <Field label="Currency"><input name="currency" defaultValue="EUR" maxLength={3} required className={inputClass} /></Field>
      <Field label={A.reason}><input name="reason" required minLength={3} maxLength={500} className={inputClass} /></Field>
      <button disabled={pending} className={buttonClass("secondary", "md")}>{A.adjust}</button>
      {state.ok && <p className="text-[13px] text-success sm:col-span-5">{t.dash.settings.saved}</p>}
      {state.error && <p className="text-[13px] text-danger sm:col-span-5">{state.error}</p>}
    </form>
  );
}
