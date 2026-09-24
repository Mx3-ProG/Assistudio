"use client";
import { useActionState, useState } from "react";
import { useI18n } from "@/components/providers";
import type { AdminState } from "@/app/actions/admin";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * A staff action that always asks for a justification before submitting.
 * The reason is persisted in the audit log.
 */
export function ReasonAction({ action, fields, label, variant = "secondary", input }: {
  action: (s: AdminState, f: FormData) => Promise<AdminState>;
  fields: Record<string, string>;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "accent" | "ghost";
  /** Replace the reason field with another required input (e.g. provider reference) */
  input?: { name: string; placeholder: string };
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AdminState, FormData>(async (p, f) => {
    const r = await action(p, f);
    if (r.ok) setOpen(false);
    return r;
  }, {});

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={buttonClass(variant, "sm")}>{label}</button>;
  return (
    <form action={formAction} className="flex w-full min-w-64 flex-col gap-2 rounded-xl bg-surface-2 p-2 sm:w-auto">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input name={input?.name ?? "reason"} required minLength={3} autoFocus placeholder={input?.placeholder ?? t.admin.reason} className={cn(inputClass, "h-9 text-[13px]")} />
      <div className="flex gap-1.5">
        <button disabled={pending} className={buttonClass(variant === "ghost" ? "primary" : variant, "sm")}>{label}</button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")}>{t.common.cancel}</button>
      </div>
      {state.error && <p className="text-[12px] text-danger">{state.error}</p>}
    </form>
  );
}
