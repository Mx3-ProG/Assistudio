"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Flag, Lock } from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";
import { fmt } from "@/i18n/format";
import { formatRelative } from "@/lib/money";
import type { MessageReportRow, ModerationAction, OpenedReport } from "@/lib/messaging/types";
import { moderateReport, openReport } from "@/app/actions/messaging";

const TONE: Record<MessageReportRow["status"], string> = {
  open: "bg-danger-soft text-danger",
  reviewing: "bg-warning-soft text-warning",
  dismissed: "bg-surface-2 text-muted",
  actioned: "bg-success-soft text-success",
};

/** Staff moderation. Opening a report is the only way to read a private conversation, and it is audited. */
export function ReportsPanel({ reports, backHref, now }: { reports: MessageReportRow[]; backHref: string; now: number }) {
  const { t, locale } = useI18n();
  const M = t.msg;
  const A = M.admin;
  const router = useRouter();
  const [opened, setOpened] = useState<Record<string, OpenedReport>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const errors = M.errors as Record<string, string>;

  const open = (id: string) => start(async () => {
    const r = await openReport(id);
    if (r.ok) { setOpened((o) => ({ ...o, [id]: r.data })); router.refresh(); } else setError(errors[r.error] ?? errors.generic);
  });
  const moderate = (id: string, action: ModerationAction) => start(async () => {
    const r = await moderateReport(id, action, reason[id] ?? "");
    if (!r.ok) setError(errors[r.error] ?? errors.generic);
    router.refresh();
  });

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <Link href={backHref} className="grid size-9 place-items-center rounded-full hover:bg-surface-2 lg:hidden" aria-label={M.back}><ArrowLeft className="flip-rtl size-5" /></Link>
        <Flag className="size-5 text-danger" />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{A.reports}</h2>
          <p className="text-[12px] text-muted">{A.openReportHint}</p>
        </div>
      </header>
      {error && <p role="alert" className="bg-danger-soft px-4 py-2 text-[13px] text-danger">{error}</p>}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {reports.length === 0 ? <p className="mt-12 text-center text-[14px] text-muted">{A.reportsEmpty}</p> : (
          <ul className="flex flex-col gap-3">
            {reports.map((r) => {
              const ctx = opened[r.id];
              const live = r.status === "open" || r.status === "reviewing";
              return (
                <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE[r.status])}>{A.status[r.status]}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-2">{A.kind[r.conversationKind]}</span>
                    <span className="ms-auto text-[12px] text-muted">{formatRelative(r.createdAt, locale, now)}</span>
                  </div>
                  <p className="mt-2 text-[14px]">« {r.reason} »</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {fmt(A.reportedBy, { name: r.reporterName ?? M.unknown })} · {fmt(A.sender, { name: r.senderName ?? M.unknown })}
                  </p>

                  {ctx ? (
                    <ol className="mt-3 flex max-h-80 flex-col gap-1.5 overflow-y-auto rounded-xl bg-surface-2 p-3">
                      {ctx.messages.map((m) => (
                        <li key={m.id} className={cn("rounded-lg px-2.5 py-1.5 text-[13px]", m.id === ctx.reportedId && "bg-danger-soft ring-1 ring-danger/40")}>
                          <span className="font-medium">{ctx.participants[m.senderId ?? ""]?.name ?? M.unknown}</span>
                          <span className="ms-2 text-[11px] text-muted">{formatRelative(m.createdAt, locale)}</span>
                          <p className="whitespace-pre-wrap break-words text-fg-2">
                            {m.deletedAt ? M.deleted : m.body ?? (m.attachment ? fmt(A.fileHidden, { mime: m.attachment.mime }) : M.preview[m.kind])}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <button type="button" disabled={pending} onClick={() => open(r.id)}
                      className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] font-medium hover:bg-surface-2 disabled:opacity-50">
                      <Eye className="size-3.5" />{A.openReport}<Lock className="size-3 text-muted" />
                    </button>
                  )}

                  {live && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input value={reason[r.id] ?? ""} onChange={(e) => setReason((x) => ({ ...x, [r.id]: e.target.value }))} maxLength={500}
                        placeholder={A.reasonPlaceholder} aria-label={A.reasonPlaceholder}
                        className="h-8 min-w-48 flex-1 rounded-full border border-line bg-surface-2 px-3 text-[12.5px] outline-none focus:border-accent" />
                      <button type="button" disabled={pending} onClick={() => moderate(r.id, "dismiss")}
                        className="h-8 rounded-full bg-surface-2 px-3 text-[12.5px] font-medium hover:bg-surface-3 disabled:opacity-50">{A.dismiss}</button>
                      <button type="button" disabled={pending} onClick={() => moderate(r.id, "delete_message")}
                        className="h-8 rounded-full bg-danger-soft px-3 text-[12.5px] font-medium text-danger disabled:opacity-50">{A.deleteMessage}</button>
                      <button type="button" disabled={pending} onClick={() => moderate(r.id, "mute_sender")}
                        className="h-8 rounded-full bg-danger px-3 text-[12.5px] font-medium text-white disabled:opacity-50">{A.muteSender}</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
