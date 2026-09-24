"use client";
import { useActionState, useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { useI18n } from "@/components/providers";
import { updateProfile, exportMyData, requestErasure, type FormState } from "@/app/actions/dashboard";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

export function ProfileForm({ fullName, displayName, optIn }: { fullName: string; displayName: string | null; optIn: boolean }) {
  const { t } = useI18n();
  const S = t.dash.settings;
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label={S.fullName}><input name="fullName" defaultValue={fullName} required className={inputClass} /></Field>
      <Field label={S.displayName} hint={S.displayNameHint}><input name="displayName" defaultValue={displayName ?? ""} maxLength={40} className={inputClass} /></Field>
      <label className="flex items-center justify-between gap-4 text-[14px]">
        {t.dash.leaderboard.optIn}
        <input type="checkbox" name="leaderboardOptIn" defaultChecked={optIn} className="size-5 accent-[var(--accent)]" />
      </label>
      <button disabled={pending} className={buttonClass("primary", "md", "justify-self-start")}>{state.ok ? S.saved : t.common.save}</button>
    </form>
  );
}

export function PrivacyActions() {
  const { t } = useI18n();
  const S = t.dash.settings;
  const [pending, start] = useTransition();
  const [requested, setRequested] = useState(false);
  return (
    <div className="grid gap-3">
      <button disabled={pending} className={buttonClass("secondary", "md", "justify-self-start")}
        onClick={() => start(async () => {
          const json = await exportMyData();
          const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
          const a = Object.assign(document.createElement("a"), { href: url, download: "studio-my-data.json" });
          a.click();
          URL.revokeObjectURL(url);
        })}>
        <Download className="size-4" />{S.exportData}
      </button>
      <button disabled={pending || requested} className={buttonClass("danger", "md", "justify-self-start")}
        onClick={() => { if (confirm(S.deleteAccount + "?")) start(async () => { await requestErasure(); setRequested(true); }); }}>
        <Trash2 className="size-4" />{requested ? "✓" : S.deleteAccount}
      </button>
      <p className="text-[12px] text-muted">{S.deleteHint}</p>
    </div>
  );
}
