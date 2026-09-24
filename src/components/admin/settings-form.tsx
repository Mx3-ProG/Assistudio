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
          </select>
        </Field>
        <Field label="Commission validation period (days)"><input name="commissionValidationDays" type="number" min={0} max={365} defaultValue={settings.commissionValidationDays} className={inputClass} /></Field>
        <Field label="Payout minimum (€)"><input name="payoutMinimumEuros" type="number" min={0} step="1" defaultValue={settings.payoutMinimumCents / 100} className={inputClass} /></Field>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">Leaderboard enabled<input type="checkbox" name="leaderboardEnabled" defaultChecked={settings.leaderboardEnabled} className="size-5 accent-[var(--accent)]" /></label>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-[14px]">Auto-approve affiliates<input type="checkbox" name="autoApprove" defaultChecked={settings.autoApprove} className="size-5 accent-[var(--accent)]" /></label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.save}</button>
          {state.ok && <span className="text-[13px] text-success">{t.dash.settings.saved}</span>}
          {state.error && <span className="text-[13px] text-danger">{state.error}</span>}
        </div>
      </fieldset>
    </form>
  );
}
