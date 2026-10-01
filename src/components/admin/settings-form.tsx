"use client";
import { useActionState } from "react";
import { updateSettings, type AdminState } from "@/app/actions/admin";
import { useI18n } from "@/components/providers";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import type { Settings } from "@/lib/data/types";

export function SettingsForm({ settings, canEdit }: { settings: Settings; canEdit: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AdminState, FormData>(updateSettings, {});
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <fieldset disabled={!canEdit} className="contents">
        <Field label="Attribution window (days)"><input name="attributionWindowDays" type="number" min={1} max={730} defaultValue={settings.attributionWindowDays} className={inputClass} /></Field>
        <Field label="Attribution model">
          <select name="attributionModel" defaultValue={settings.attributionModel} className={`${inputClass} appearance-none`}>
            <option value="last_click">Last click</option>
            <option value="first_click">First click</option>
            <option value="manual">Manual (explicit context / staff only)</option>
          </select>
        </Field>
        <Field label="Commission validation period (days)"><input name="commissionValidationDays" type="number" min={0} max={365} defaultValue={settings.commissionValidationDays} className={inputClass} /></Field>
        <Field label="Payout minimum (€)"><input name="payoutMinimumEuros" type="number" min={0} step="1" defaultValue={settings.payoutMinimumCents / 100} className={inputClass} /></Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">Leaderboard enabled<input type="checkbox" name="leaderboardEnabled" defaultChecked={settings.leaderboardEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <Field label="Partial refund → commission">
          <select name="refundPartialPolicy" defaultValue={settings.refundPartialPolicy} className={`${inputClass} appearance-none`}>
            <option value="manual_review">Manual review (commission disputed)</option>
            <option value="proportional">Proportional reversal</option>
            <option value="full_reversal">Full reversal</option>
          </select>
        </Field>
        <Field label="Customer billing emails sent by">
          <select name="billingEmailsOwner" defaultValue={settings.billingEmailsOwner} className={`${inputClass} appearance-none`}>
            <option value="stripe">Stripe (receipts, failed payments, reminders)</option>
            <option value="studio">Studio ATS (Resend templates)</option>
          </select>
        </Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">Online checkout (Stripe) enabled<input type="checkbox" name="checkoutEnabled" defaultChecked={settings.checkoutEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">Stripe Connect payout accounts<input type="checkbox" name="connectEnabled" defaultChecked={settings.connectEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.save}</button>
          {state.ok && <span className="text-[13px] text-success">{t.dash.settings.saved}</span>}
          {state.error && <span className="text-[13px] text-danger">{state.error}</span>}
        </div>
      </fieldset>
    </form>
  );
}
