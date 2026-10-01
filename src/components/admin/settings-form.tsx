"use client";
import { useActionState } from "react";
import { updateSettings, type AdminState } from "@/app/actions/admin";
import { useI18n } from "@/components/providers";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import type { Settings } from "@/lib/data/types";

export function SettingsForm({ settings, canEdit }: { settings: Settings; canEdit: boolean }) {
  const { t } = useI18n();
  const f = t.admin.settingsForm;
  const [state, action, pending] = useActionState<AdminState, FormData>(updateSettings, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <fieldset disabled={!canEdit} className="contents">
        <Field label={f.attributionWindow}><input name="attributionWindowDays" type="number" min={1} max={730} defaultValue={settings.attributionWindowDays} className={inputClass} /></Field>
        <Field label={f.attributionModel}>
          <select name="attributionModel" defaultValue={settings.attributionModel} className={`${inputClass} appearance-none`}>
            <option value="last_click">{f.lastClick}</option>
            <option value="first_click">{f.firstClick}</option>
            <option value="manual">{f.manual}</option>
          </select>
        </Field>
        <Field label={f.validationDays}><input name="commissionValidationDays" type="number" min={0} max={365} defaultValue={settings.commissionValidationDays} className={inputClass} /></Field>
        <Field label={f.payoutMinimum}><input name="payoutMinimumEuros" type="number" min={0} step="1" defaultValue={settings.payoutMinimumCents / 100} className={inputClass} /></Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">{f.leaderboard}<input type="checkbox" name="leaderboardEnabled" defaultChecked={settings.leaderboardEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <Field label={f.partialRefund}>
          <select name="refundPartialPolicy" defaultValue={settings.refundPartialPolicy} className={`${inputClass} appearance-none`}>
            <option value="manual_review">{f.manualReview}</option>
            <option value="proportional">{f.proportional}</option>
            <option value="full_reversal">{f.fullReversal}</option>
          </select>
        </Field>
        <Field label={f.billingEmails}>
          <select name="billingEmailsOwner" defaultValue={settings.billingEmailsOwner} className={`${inputClass} appearance-none`}>
            <option value="stripe">{f.billingStripe}</option>
            <option value="studio">{f.billingStudio}</option>
          </select>
        </Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">{f.checkout}<input type="checkbox" name="checkoutEnabled" defaultChecked={settings.checkoutEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">{f.connect}<input type="checkbox" name="connectEnabled" defaultChecked={settings.connectEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">{f.autoApprove}<input type="checkbox" name="autoApprove" defaultChecked={settings.autoApprove} className="size-5 accent-[var(--accent)]" /></label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.save}</button>
          {state.ok && <span className="text-[13px] text-success">{t.dash.settings.saved}</span>}
          {state.error && <span className="text-[13px] text-danger">{state.error}</span>}
        </div>
      </fieldset>
    </form>
  );
}
