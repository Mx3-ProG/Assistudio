"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import {
  processPayoutAction, markPayoutPaidAction, rejectPayoutAction, failPayoutAction, type StaffPayoutState,
} from "@/app/actions/payouts";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/primitives";
import type { PayoutStatus } from "@/lib/payouts";
import { cn } from "@/lib/cn";

type Kind = "process" | "paid" | "reject" | "fail";
const ACTIONS = { process: processPayoutAction, paid: markPayoutPaidAction, reject: rejectPayoutAction, fail: failPayoutAction };

/**
 * Staff actions on one payout. Every action asks for a confirmation; paying
 * needs the transfer reference, refusing / failing needs a reason (shown to
 * the partner). The database re-checks status, rights and eligibility.
 */
export function PayoutActions({ id, status, amountLabel, partnerName, problem }: {
  id: string; status: PayoutStatus; amountLabel: string; partnerName: string; problem: boolean;
}) {
  const { t } = useI18n();
  const A = t.po.admin;
  const [open, setOpen] = useState<Kind | null>(null);
  const actions: { kind: Kind; label: string; variant: "accent" | "primary" | "danger" | "secondary"; show: boolean }[] = [
    { kind: "process", label: A.process, variant: "primary", show: status === "requested" || status === "scheduled" },
    { kind: "paid", label: A.markPaid, variant: "accent", show: status === "requested" || status === "scheduled" || status === "processing" },
    { kind: "reject", label: A.reject, variant: "danger", show: status === "requested" || status === "scheduled" || status === "processing" },
    { kind: "fail", label: A.fail, variant: "secondary", show: status === "processing" },
  ];
  const visible = actions.filter((a) => a.show);
  if (!visible.length) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visible.map((a) => (
          <button key={a.kind} type="button" onClick={() => setOpen(open === a.kind ? null : a.kind)} aria-expanded={open === a.kind}
            disabled={problem && (a.kind === "process" || a.kind === "paid")}
            className={buttonClass(a.variant, "md", "disabled:opacity-40")}>{a.label}</button>
        ))}
      </div>
      {open && <Confirm key={open} kind={open} id={id} amountLabel={amountLabel} partnerName={partnerName} onCancel={() => setOpen(null)} />}
    </div>
  );
}

function Confirm({ kind, id, amountLabel, partnerName, onCancel }: { kind: Kind; id: string; amountLabel: string; partnerName: string; onCancel: () => void }) {
  const { t } = useI18n();
  const A = t.po.admin;
  const [state, action, pending] = useActionState<StaffPayoutState, FormData>(ACTIONS[kind], {});
  const text = { process: A.processConfirm, paid: fmt(A.markPaidConfirm, { amount: amountLabel, name: partnerName }), reject: A.rejectConfirm, fail: A.failConfirm }[kind];
  const field = kind === "paid" ? { name: "reference", placeholder: A.referencePlaceholder, required: true }
    : kind === "process" ? { name: "note", placeholder: A.note, required: false }
    : { name: "reason", placeholder: A.reasonPlaceholder, required: true };
  const error = state.error ? (state.error === "forbidden" || state.error === "generic" ? t.po.modal.errorGeneric : t.po.errors[state.error]) : null;
  if (state.ok) return <p role="status" className="rounded-2xl bg-success-soft p-3 text-[13.5px] text-success">{A.done}</p>;
  return (
    <form action={action} className={cn("rounded-2xl border p-4", kind === "reject" || kind === "fail" ? "border-danger/30 bg-danger-soft/40" : "border-line bg-surface-2/60")}>
      <input type="hidden" name="id" value={id} />
      <p className="text-[14px] font-medium">{text}</p>
      <input name={field.name} required={field.required} minLength={field.required ? 3 : undefined} maxLength={500} autoFocus placeholder={field.placeholder}
        className={cn(inputClass, "mt-3 h-10 text-[14px]")} />
      {error && <p role="alert" className="mt-2 text-[13px] text-danger">{error}{state.detail ? ` — ${state.detail}` : ""}</p>}
      <div className="mt-3 flex gap-2">
        <button disabled={pending} className={buttonClass(kind === "reject" || kind === "fail" ? "danger" : "primary", "md")}>
          {pending && <Loader2 className="size-4 animate-spin" />}{A.confirm}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className={buttonClass("ghost", "md")}>{A.cancel}</button>
      </div>
    </form>
  );
}
