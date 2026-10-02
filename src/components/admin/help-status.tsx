"use client";
import { useActionState } from "react";
import { useI18n } from "@/components/providers";
import { updateHelpRequest } from "@/app/actions/help";
import type { AdminState } from "@/app/actions/admin";
import type { HelpStatus } from "@/lib/data/types";
import { buttonClass } from "@/components/ui/button";
import { textareaClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** Staff control for one help request: optional reply note + the next status. Audited server-side. */
export function HelpStatusForm({ id, status, note }: { id: string; status: HelpStatus; note: string | null }) {
  const { t } = useI18n();
  const A = t.net.admin;
  const [state, action, pending] = useActionState<AdminState, FormData>(updateHelpRequest, {});
  const next: { status: HelpStatus; label: string; variant: "primary" | "secondary" | "ghost" }[] =
    status === "open" ? [{ status: "in_progress", label: A.take, variant: "secondary" }, { status: "resolved", label: A.resolve, variant: "primary" }]
      : status === "in_progress" ? [{ status: "resolved", label: A.resolve, variant: "primary" }, { status: "closed", label: A.close, variant: "ghost" }]
        : [{ status: "open", label: A.reopen, variant: "secondary" }];

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      {status !== "resolved" && status !== "closed" && (
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-fg-2">{A.note}</span>
          <textarea name="note" rows={2} maxLength={2000} defaultValue={note ?? ""} className={cn(textareaClass, "min-h-16 text-[14px]")} />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {next.map((n) => (
          <button key={n.status} name="status" value={n.status} disabled={pending} className={buttonClass(n.variant, "sm")}>{n.label}</button>
        ))}
        {state.ok && <span className="text-[12px] text-success">{A.saved}</span>}
        {state.error && <span className="text-[12px] text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
