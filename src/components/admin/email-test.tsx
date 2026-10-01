"use client";
import { useActionState } from "react";
import { sendTestEmail, type EmailTestState } from "@/app/actions/admin";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import type { TransportKind } from "@/lib/email/transport";

export function EmailTest({ from, transport }: { from: string; transport: TransportKind }) {
  const { t, locale } = useI18n();
  const e = t.admin.emailTest;
  const [state, action, pending] = useActionState<EmailTestState, FormData>(sendTestEmail, { status: "idle" });
  const transportLabel = { resend: e.transportResend, missing: e.transportMissing, log: e.transportLog }[transport];
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <p className="text-[15px] font-semibold">{e.title}</p>
        <p className="mt-1 text-[13px] text-muted">{e.hint}</p>
      </div>
      <dl className="grid gap-1 text-[13.5px]">
        <div className="flex gap-2"><dt className="text-muted">{e.from} :</dt><dd className="font-mono text-[12.5px]">{from}</dd></div>
        <div className="flex gap-2"><dt className="text-muted">{e.transport} :</dt><dd className={transport === "missing" ? "text-danger" : ""}>{transportLabel}</dd></div>
      </dl>
      {state.status === "sent" && <p role="status" className="text-[13px] text-success">{e.sent.replace("{to}", state.to ?? "").replace("{id}", state.id ?? "—")}</p>}
      {state.status === "failed" && <p role="alert" className="break-words text-[13px] text-danger">{e.failed.replace("{error}", state.error ?? "")}</p>}
      <button disabled={pending} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>{pending ? t.common.loading : e.send}</button>
    </form>
  );
}
